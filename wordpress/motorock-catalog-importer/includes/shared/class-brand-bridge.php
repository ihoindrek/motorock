<?php

if (!defined('ABSPATH')) {
    exit;
}

class Motorock_Catalog_Importer_Brand_Bridge {

    /** @var object|null */
    private $shopify_handler;

    public function __construct() {
        if (class_exists('Shopify_Importer_Brand_Handler')) {
            $this->shopify_handler = new Shopify_Importer_Brand_Handler();
        }
    }

    public function ensure_product_brand($product_id, $brand_name, $logger = null, $force = false) {
        $brand_name = trim((string) $brand_name);
        if ($brand_name === '' || !$product_id) {
            return false;
        }

        if ($this->shopify_handler) {
            $assigned = $this->shopify_handler->ensure_product_brand($product_id, $brand_name, $logger, $force);
            if ($assigned) {
                return true;
            }
        }

        return $this->assign_pa_brand_attribute($product_id, $brand_name);
    }

    /**
     * Assign pa_brand term + WooCommerce product attribute (required for GraphQL).
     */
    private function assign_pa_brand_attribute($product_id, $brand_name) {
        if (!taxonomy_exists('pa_brand')) {
            return false;
        }

        $term = get_term_by('name', $brand_name, 'pa_brand');
        if (!$term) {
            $created = wp_insert_term($brand_name, 'pa_brand', array('slug' => sanitize_title($brand_name)));
            if (is_wp_error($created)) {
                return false;
            }
            $term_id = (int) $created['term_id'];
        } else {
            $term_id = (int) $term->term_id;
        }

        wp_set_object_terms($product_id, array($term_id), 'pa_brand', false);

        $product = wc_get_product($product_id);
        if (!$product) {
            return false;
        }

        $attributes = $product->get_attributes();
        $brand_attribute = new WC_Product_Attribute();
        $attribute_id = wc_attribute_taxonomy_id_by_name('pa_brand');

        if ($attribute_id) {
            $brand_attribute->set_id($attribute_id);
        }

        $brand_attribute->set_name('pa_brand');
        $brand_attribute->set_options(array($term_id));
        $brand_attribute->set_visible(true);
        $brand_attribute->set_variation(false);

        $attributes['pa_brand'] = $brand_attribute;
        $product->set_attributes($attributes);
        $product->save();

        return true;
    }
}
