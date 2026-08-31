<?php

if (!defined('ABSPATH')) {
    exit;
}

class Motorock_Catalog_Importer_Feed_Products {

    const BATCH_SIZE = 40;

    /**
     * @return int[]
     */
    public static function get_product_ids_for_feed($feed_id) {
        global $wpdb;

        $feed_id = sanitize_key((string) $feed_id);
        if ($feed_id === '') {
            return array();
        }

        $ids = $wpdb->get_col(
            $wpdb->prepare(
                "SELECT DISTINCT p.ID
                FROM {$wpdb->posts} p
                INNER JOIN {$wpdb->postmeta} pm ON pm.post_id = p.ID
                WHERE p.post_type = 'product'
                AND p.post_status != 'trash'
                AND pm.meta_key = '_catalog_feed_id'
                AND pm.meta_value = %s
                ORDER BY p.ID ASC",
                $feed_id
            )
        );

        return array_map('intval', $ids ?: array());
    }

    public static function count_for_feed($feed_id) {
        return count(self::get_product_ids_for_feed($feed_id));
    }

    /**
     * @return array{total: int, published: int, draft: int, hidden_visibility: int}
     */
    public static function get_visibility_stats_for_feed($feed_id) {
        $stats = array(
            'total' => 0,
            'published' => 0,
            'draft' => 0,
            'hidden_visibility' => 0,
        );

        foreach (self::get_product_ids_for_feed($feed_id) as $product_id) {
            $stats['total']++;
            $product = wc_get_product($product_id);
            if (!$product) {
                continue;
            }

            if ($product->get_status() === 'publish') {
                $stats['published']++;
            } elseif ($product->get_status() === 'draft') {
                $stats['draft']++;
            }

            if ($product->get_catalog_visibility() === 'hidden') {
                $stats['hidden_visibility']++;
            }
        }

        return $stats;
    }

    public static function is_feed_visible_on_storefront(array $feed) {
        return empty($feed['catalog_hidden']);
    }

    /**
     * Bulk show/hide feed products on the storefront.
     *
     * Hidden = draft + catalog_visibility hidden (GraphQL catalog uses status publish).
     * Visible = publish + catalog_visibility visible.
     *
     * @return array{processed: int, total: int, done: bool, stats: array<string, int>}
     */
    public static function apply_storefront_visibility_batch($feed_id, $visible, $offset = 0) {
        $product_ids = self::get_product_ids_for_feed($feed_id);
        $total = count($product_ids);
        $slice = array_slice($product_ids, max(0, (int) $offset), self::BATCH_SIZE);
        $processed = 0;

        foreach ($slice as $product_id) {
            $product = wc_get_product($product_id);
            if (!$product) {
                continue;
            }

            if ($visible) {
                $product->set_status('publish');
                $product->set_catalog_visibility('visible');
            } else {
                $product->set_status('draft');
                $product->set_catalog_visibility('hidden');
            }

            $product->save();
            $processed++;
        }

        $next_offset = (int) $offset + $processed;

        return array(
            'processed' => $processed,
            'offset' => $next_offset,
            'total' => $total,
            'done' => $next_offset >= $total,
            'stats' => self::get_visibility_stats_for_feed($feed_id),
        );
    }

    public static function default_status_for_feed(array $feed) {
        return self::is_feed_visible_on_storefront($feed) ? 'publish' : 'draft';
    }

    public static function default_catalog_visibility_for_feed(array $feed) {
        return self::is_feed_visible_on_storefront($feed) ? 'visible' : 'hidden';
    }

    public static function refresh_feed_product_stats($feed_id) {
        $stats = self::get_visibility_stats_for_feed($feed_id);

        Motorock_Catalog_Importer_Feed_Manager::save_feed($feed_id, array(
            'product_count' => $stats['total'],
            'product_count_published' => $stats['published'],
            'product_count_draft' => $stats['draft'],
            'product_count_updated_at' => current_time('mysql'),
        ));

        return $stats;
    }
}
