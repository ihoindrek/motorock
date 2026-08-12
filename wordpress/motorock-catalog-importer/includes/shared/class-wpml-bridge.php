<?php

if (!defined('ABSPATH')) {
    exit;
}

class Motorock_Catalog_Importer_Wpml_Bridge {

    public static function is_active() {
        return class_exists('Shopify_Importer_WPML_Helper')
            && Shopify_Importer_WPML_Helper::is_active();
    }

    public static function sync_product_categories($product_id, array $category_ids) {
        if (!self::is_active()) {
            wp_set_object_terms($product_id, array_map('intval', $category_ids), 'product_cat');
            return;
        }

        Shopify_Importer_WPML_Helper::sync_product_categories($product_id, $category_ids);
    }
}
