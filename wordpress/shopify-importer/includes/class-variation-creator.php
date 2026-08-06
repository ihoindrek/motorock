<?php

if (!defined('ABSPATH')) {
    exit;
}

class Shopify_Importer_Variation_Creator {

    public function create_variation($product_id, $variation_data) {
        try {
            if (!empty($variation_data['sku']) && $this->sku_exists($variation_data['sku'])) {
                return false;
            }

            $variation = new WC_Product_Variation();
            $variation->set_parent_id($product_id);

            if (!empty($variation_data['attributes'])) {
                $variation->set_attributes($variation_data['attributes']);
            }

            if (!empty($variation_data['sku'])) {
                $variation->set_sku($variation_data['sku']);
            }

            if (isset($variation_data['regular_price'])) {
                $variation->set_regular_price($variation_data['regular_price']);
                $variation->set_price($variation_data['regular_price']);
            }

            $variation->set_stock_status(isset($variation_data['stock_status']) ? $variation_data['stock_status'] : 'instock');
            $variation->set_manage_stock(false);

            if (!empty($variation_data['image_id'])) {
                $variation->set_image_id($variation_data['image_id']);
            }

            $variation_id = $variation->save();

            if ($variation_id && isset($variation_data['regular_price'])) {
                update_post_meta($variation_id, '_recommended_price', $variation_data['regular_price']);
            }

            return $variation_id;
        } catch (Throwable $e) {
            return false;
        }
    }

    public function create_variations_from_data($product_id, $variations_data) {
        $created = array();

        foreach ($variations_data as $var_data) {
            $attributes = array();

            if (!empty($var_data['attributes'])) {
                foreach ($var_data['attributes'] as $attr) {
                    $attribute_slug = 'pa_' . sanitize_title($attr['name']);
                    $term = get_term_by('name', $attr['option'], $attribute_slug);
                    if ($term) {
                        $attributes[$attribute_slug] = $term->slug;
                    }
                }
            }

            $variation_id = $this->create_variation($product_id, array(
                'attributes' => $attributes,
                'sku' => isset($var_data['sku']) ? $var_data['sku'] : '',
                'regular_price' => isset($var_data['regular_price']) ? $var_data['regular_price'] : '',
                'stock_status' => isset($var_data['stock_status']) ? $var_data['stock_status'] : 'instock',
            ));

            if ($variation_id) {
                $created[] = $variation_id;
            }
        }

        return $created;
    }

    private function sku_exists($sku) {
        global $wpdb;

        return (bool) $wpdb->get_var($wpdb->prepare(
            "SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key='_sku' AND meta_value=%s LIMIT 1",
            $sku
        ));
    }
}
