<?php

if (!defined('ABSPATH')) {
    exit;
}

class Motorock_Catalog_Importer_Product_Writer {

    /** @var array */
    private $feed;

    /** @var Motorock_Catalog_Importer_Logger */
    private $logger;

    /** @var Motorock_Catalog_Importer_Image_Downloader */
    private $images;

    /** @var Motorock_Catalog_Importer_Brand_Bridge */
    private $brand;

    public function __construct(array $feed, Motorock_Catalog_Importer_Logger $logger) {
        $this->feed = $feed;
        $this->logger = $logger;
        $this->images = new Motorock_Catalog_Importer_Image_Downloader();
        $this->brand = new Motorock_Catalog_Importer_Brand_Bridge();
    }

    public function upsert_product(array $product_data, $mode = 'full') {
        if (!empty($product_data['update_only']) || $mode === 'update_only') {
            return $this->update_stock_price($product_data);
        }

        $existing_id = Motorock_Catalog_Importer_Sku_Lookup::find_existing_product_id($product_data);
        if ($existing_id) {
            return $this->update_existing($existing_id, $product_data);
        }

        if (!empty($product_data['is_simple'])) {
            $product_id = $this->create_simple($product_data);
        } else {
            $product_id = $this->create_variable($product_data);
        }

        if ($product_id) {
            $this->apply_import_meta($product_id, $product_data);
            return array('action' => 'imported', 'product_id' => $product_id);
        }

        return array('action' => 'failed', 'product_id' => 0);
    }

    private function update_stock_price(array $data) {
        $sku = isset($data['sku']) ? trim((string) $data['sku']) : '';
        if ($sku === '') {
            return array('action' => 'skipped', 'product_id' => 0);
        }

        $product_id = Motorock_Catalog_Importer_Sku_Lookup::get_product_id_by_sku($sku);
        if (!$product_id) {
            return array('action' => 'skipped', 'product_id' => 0);
        }

        $product = wc_get_product($product_id);
        if (!$product) {
            return array('action' => 'failed', 'product_id' => 0);
        }

        if ($data['regular_price'] !== '') {
            $product->set_regular_price($data['regular_price']);
            $product->set_price($data['regular_price']);
        }

        $product->set_manage_stock(true);
        $product->set_stock_quantity((int) $data['stock_quantity']);
        $product->set_stock_status($data['stock_status']);
        $product->save();
        $this->set_meta($product_id, isset($data['meta']) ? $data['meta'] : array());

        return array('action' => 'updated', 'product_id' => $product_id);
    }

    private function create_simple(array $data) {
        $product = new WC_Product_Simple();
        $product->set_name($data['name']);
        $product->set_sku($data['sku']);
        $product->set_regular_price($data['regular_price']);
        $product->set_price($data['regular_price']);
        $product->set_description(isset($data['description']) ? $data['description'] : '');
        $product->set_short_description(isset($data['short_description']) ? $data['short_description'] : '');
        $product->set_status('publish');
        $product->set_catalog_visibility('visible');
        $product->set_manage_stock(true);
        $product->set_stock_quantity((int) $data['stock_quantity']);
        $product->set_stock_status($data['stock_status']);

        $product_id = $product->save();
        if (!$product_id) {
            return 0;
        }

        $this->set_categories($product_id, $data);
        $this->set_brand($product_id, $data);
        $this->set_meta($product_id, isset($data['meta']) ? $data['meta'] : array());
        $this->images->set_product_images($product_id, isset($data['images']) ? $data['images'] : array());
        $this->apply_shipping_dimensions($product);
        $product->save();

        return (int) $product_id;
    }

    private function create_variable(array $data) {
        $product = new WC_Product_Variable();
        $product->set_name($data['name']);
        $product->set_sku($data['sku']);
        $product->set_description(isset($data['description']) ? $data['description'] : '');
        $product->set_short_description(isset($data['short_description']) ? $data['short_description'] : '');
        $product->set_status('publish');
        $product->set_catalog_visibility('visible');

        $attributes = array();
        foreach (isset($data['attributes']) ? $data['attributes'] : array() as $attribute_data) {
            $attribute = new WC_Product_Attribute();
            $taxonomy = 'pa_' . sanitize_title($attribute_data['name']);
            $this->ensure_attribute_taxonomy($attribute_data['name'], $taxonomy);
            $term_ids = $this->ensure_attribute_terms($taxonomy, $attribute_data['options']);

            $attribute_id = wc_attribute_taxonomy_id_by_name($taxonomy);
            if ($attribute_id) {
                $attribute->set_id($attribute_id);
            }
            $attribute->set_name($taxonomy);
            $attribute->set_options($term_ids);
            $attribute->set_visible(!empty($attribute_data['visible']));
            $attribute->set_variation(!empty($attribute_data['variation']));
            $attributes[$taxonomy] = $attribute;
        }

        $product->set_attributes($attributes);
        $product_id = $product->save();
        if (!$product_id) {
            return 0;
        }

        $this->set_categories($product_id, $data);
        $this->set_brand($product_id, $data);
        $this->images->set_product_images($product_id, isset($data['images']) ? $data['images'] : array());

        foreach (isset($data['variations']) ? $data['variations'] : array() as $variation_data) {
            $this->create_variation($product_id, $variation_data);
        }

        return (int) $product_id;
    }

    private function create_variation($product_id, array $variation_data) {
        if (!empty($variation_data['sku'])) {
            $existing_id = Motorock_Catalog_Importer_Sku_Lookup::get_product_id_by_sku($variation_data['sku']);
            if ($existing_id) {
                return $this->update_variation($existing_id, $variation_data);
            }
        }

        $variation = new WC_Product_Variation();
        $variation->set_parent_id($product_id);

        $attrs = array();
        foreach (isset($variation_data['attributes']) ? $variation_data['attributes'] : array() as $attr) {
            $taxonomy = 'pa_' . sanitize_title($attr['name']);
            $term = get_term_by('name', $attr['option'], $taxonomy);
            if (!$term) {
                $term = get_term_by('slug', sanitize_title($attr['option']), $taxonomy);
            }
            if ($term && !is_wp_error($term)) {
                $attrs[$taxonomy] = $term->slug;
            }
        }

        $variation->set_attributes($attrs);
        if (!empty($variation_data['sku'])) {
            $variation->set_sku($variation_data['sku']);
        }
        $variation->set_regular_price($variation_data['regular_price']);
        $variation->set_price($variation_data['regular_price']);
        $variation->set_manage_stock(true);
        $variation->set_stock_quantity((int) $variation_data['stock_quantity']);
        $variation->set_stock_status($variation_data['stock_status']);

        $variation_id = $variation->save();
        if ($variation_id) {
            $this->set_meta($variation_id, isset($variation_data['meta']) ? $variation_data['meta'] : array());
            $saved_variation = wc_get_product($variation_id);
            if ($saved_variation) {
                $this->apply_shipping_dimensions($saved_variation);
                $saved_variation->save();
            }
        }

        return $variation_id;
    }

    private function update_variation($variation_id, array $variation_data) {
        $variation = wc_get_product($variation_id);
        if (!$variation || !$variation->is_type('variation')) {
            return false;
        }

        $variation->set_regular_price($variation_data['regular_price']);
        $variation->set_price($variation_data['regular_price']);
        $variation->set_manage_stock(true);
        $variation->set_stock_quantity((int) $variation_data['stock_quantity']);
        $variation->set_stock_status($variation_data['stock_status']);
        $variation->save();
        $this->set_meta($variation_id, isset($variation_data['meta']) ? $variation_data['meta'] : array());
        $this->apply_shipping_dimensions($variation);
        $variation->save();

        return $variation_id;
    }

    private function update_existing($product_id, array $data) {
        $product = wc_get_product($product_id);
        if (!$product) {
            return array('action' => 'failed', 'product_id' => 0);
        }

        if ($product->is_type('simple')) {
            $product->set_regular_price($data['regular_price']);
            $product->set_price($data['regular_price']);
            $product->set_manage_stock(true);
            $product->set_stock_quantity((int) $data['stock_quantity']);
            $product->set_stock_status($data['stock_status']);
            $product->save();
            $this->set_meta($product_id, isset($data['meta']) ? $data['meta'] : array());
        } elseif ($product->is_type('variable')) {
            foreach (isset($data['variations']) ? $data['variations'] : array() as $variation_data) {
                if (empty($variation_data['sku'])) {
                    continue;
                }
                $variation_id = Motorock_Catalog_Importer_Sku_Lookup::get_product_id_by_sku($variation_data['sku']);
                if ($variation_id) {
                    $this->update_variation($variation_id, $variation_data);
                } else {
                    $this->create_variation($product_id, $variation_data);
                }
            }
        }

        $this->set_categories($product_id, $data);
        $this->set_brand($product_id, $data);
        $this->apply_import_meta($product_id, $data);

        return array('action' => 'updated', 'product_id' => $product_id);
    }

    private function set_categories($product_id, array $data) {
        if (empty($data['category_ids'])) {
            return;
        }

        Motorock_Catalog_Importer_Wpml_Bridge::sync_product_categories(
            $product_id,
            array_map('intval', $data['category_ids'])
        );
    }

    private function set_brand($product_id, array $data) {
        $brand = isset($data['brand']) ? trim($data['brand']) : '';
        if ($brand === '') {
            return;
        }

        $this->brand->ensure_product_brand($product_id, $brand, $this->logger, true);
    }

    private function set_meta($product_id, array $meta) {
        foreach ($meta as $key => $value) {
            if ($value === '' || $value === null) {
                continue;
            }
            update_post_meta($product_id, $key, $value);
        }
    }

    private function apply_import_meta($product_id, array $data) {
        update_post_meta($product_id, '_import_source', 'catalog_feed');
        update_post_meta($product_id, '_catalog_feed_id', $this->feed['id']);
        update_post_meta($product_id, '_catalog_adapter', $this->feed['adapter']);
        update_post_meta($product_id, '_catalog_import_date', current_time('mysql'));
    }

    private function ensure_attribute_taxonomy($label, $taxonomy) {
        if (taxonomy_exists($taxonomy)) {
            return;
        }

        wc_create_attribute(array(
            'name' => $label,
            'slug' => sanitize_title($label),
            'type' => 'select',
            'order_by' => 'menu_order',
            'has_archives' => false,
        ));

        register_taxonomy(
            $taxonomy,
            apply_filters('woocommerce_taxonomy_objects_' . $taxonomy, array('product')),
            apply_filters('woocommerce_taxonomy_args_' . $taxonomy, array(
                'hierarchical' => false,
                'label' => $label,
                'show_ui' => false,
                'query_var' => true,
                'rewrite' => false,
            ))
        );
    }

    private function ensure_attribute_terms($taxonomy, array $options) {
        $term_ids = array();
        foreach ($options as $option) {
            $option = trim((string) $option);
            if ($option === '') {
                continue;
            }
            $term = get_term_by('name', $option, $taxonomy);
            if (!$term) {
                $inserted = wp_insert_term($option, $taxonomy, array('slug' => sanitize_title($option)));
                if (is_wp_error($inserted)) {
                    continue;
                }
                $term_ids[] = (int) $inserted['term_id'];
            } else {
                $term_ids[] = (int) $term->term_id;
            }
        }
        return $term_ids;
    }

    private function apply_shipping_dimensions(WC_Product $product) {
        if (!function_exists('motorock_shipping_dimensions_apply_if_missing')) {
            return;
        }

        motorock_shipping_dimensions_apply_if_missing($product);
    }
}
