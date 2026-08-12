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
            return $this->shopify_handler->ensure_product_brand($product_id, $brand_name, $logger, $force);
        }

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
        return true;
    }
}
