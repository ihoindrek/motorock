<?php

if (!defined('ABSPATH')) {
    exit;
}

class Shopify_Importer_Product_Sync {

    const META_LAST_SEEN = '_shopify_last_seen';
    const META_AUTO_DRAFTED = '_shopify_auto_drafted';

    public static function get_stale_days() {
        $days = (int) apply_filters('shopify_importer_stale_days', 7);
        return max(1, $days);
    }

    public static function mark_product_seen($product_id) {
        $product_id = (int) $product_id;
        if (!$product_id) {
            return;
        }

        update_post_meta($product_id, self::META_LAST_SEEN, current_time('mysql'));

        if (get_post_status($product_id) !== 'draft') {
            return;
        }

        if (!get_post_meta($product_id, self::META_AUTO_DRAFTED, true)) {
            return;
        }

        wp_update_post(array(
            'ID' => $product_id,
            'post_status' => 'publish',
        ));
        delete_post_meta($product_id, self::META_AUTO_DRAFTED);
    }

    public static function draft_stale_products($site_id) {
        $cutoff = date('Y-m-d H:i:s', current_time('timestamp') - (self::get_stale_days() * DAY_IN_SECONDS));

        $query = new WP_Query(array(
            'post_type' => 'product',
            'post_status' => 'publish',
            'posts_per_page' => -1,
            'fields' => 'ids',
            'meta_query' => array(
                'relation' => 'AND',
                array(
                    'key' => '_import_source',
                    'value' => 'shopify',
                    'compare' => '=',
                ),
                array(
                    'key' => '_shopify_site_id',
                    'value' => $site_id,
                    'compare' => '=',
                ),
                array(
                    'key' => self::META_LAST_SEEN,
                    'value' => $cutoff,
                    'compare' => '<',
                    'type' => 'DATETIME',
                ),
            ),
        ));

        $drafted = 0;

        foreach ($query->posts as $product_id) {
            wp_update_post(array(
                'ID' => $product_id,
                'post_status' => 'draft',
            ));
            update_post_meta($product_id, self::META_AUTO_DRAFTED, '1');
            $drafted++;
        }

        return $drafted;
    }
}
