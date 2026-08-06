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

    public static function is_auto_draft_enabled($site) {
        if (!is_array($site)) {
            return false;
        }

        return !empty($site['auto_draft_stale']);
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

    /**
     * Draft products not seen during the latest successful import run.
     *
     * @param array $import_stats Stats from the import session (must include processed count).
     */
    public static function draft_stale_products($site_id, $site = null, $import_stats = array()) {
        if ($site === null) {
            $site = Shopify_Importer_Site_Manager::get_site($site_id);
        }

        if (!self::is_auto_draft_enabled($site)) {
            return 0;
        }

        $processed = isset($import_stats['processed']) ? (int) $import_stats['processed'] : 0;
        if ($processed <= 0) {
            return 0;
        }

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
