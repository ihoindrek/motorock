<?php

if (!defined('ABSPATH')) {
    exit;
}

class Motorock_Catalog_Importer_Sku_Lookup {

    public static function get_product_id_by_sku($sku) {
        $sku = trim((string) $sku);
        if ($sku === '') {
            return 0;
        }

        global $wpdb;
        return (int) $wpdb->get_var($wpdb->prepare(
            "SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key='_sku' AND meta_value=%s LIMIT 1",
            $sku
        ));
    }

    public static function sku_exists($sku) {
        return self::get_product_id_by_sku($sku) > 0;
    }

    public static function get_product_id_by_meta($meta_key, $meta_value) {
        $meta_value = trim((string) $meta_value);
        if ($meta_value === '') {
            return 0;
        }

        global $wpdb;
        return (int) $wpdb->get_var($wpdb->prepare(
            "SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key=%s AND meta_value=%s LIMIT 1",
            $meta_key,
            $meta_value
        ));
    }

    /**
     * Resolve parent product id from normalized import payload.
     */
    public static function find_existing_product_id(array $data) {
        $meta = isset($data['meta']) && is_array($data['meta']) ? $data['meta'] : array();

        if (!empty($data['is_simple'])) {
            $id = self::get_product_id_by_sku($data['sku']);
            if ($id) {
                return $id;
            }

            if (!empty($meta['_supplier_sku'])) {
                $id = self::get_product_id_by_meta('_supplier_sku', $meta['_supplier_sku']);
                if ($id) {
                    return $id;
                }
            }

            if (!empty($meta['_ean'])) {
                $id = self::get_product_id_by_sku($meta['_ean']);
                if ($id) {
                    return $id;
                }
            }

            return 0;
        }

        $parent_id = self::get_product_id_by_sku($data['sku']);
        if ($parent_id) {
            return $parent_id;
        }

        if (!empty($data['sku'])) {
            $parent_id = self::get_product_id_by_meta('_supplier_sku', $data['sku']);
            if ($parent_id) {
                return $parent_id;
            }
        }

        foreach (isset($data['variations']) ? $data['variations'] : array() as $variation) {
            $id = self::get_product_id_by_sku($variation['sku']);
            if (!$id) {
                continue;
            }

            $product = wc_get_product($id);
            if ($product && $product->get_parent_id()) {
                return (int) $product->get_parent_id();
            }

            return $id;
        }

        return 0;
    }
}
