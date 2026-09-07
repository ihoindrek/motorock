<?php
/**
 * Set catalog_visibility=visible on all catalog-import products.
 *
 * Usage:
 *   wp eval-file wp-content/plugins/motorock-catalog-importer/scripts/backfill-catalog-visibility.php
 *   wp eval-file ... dry-run
 *
 * @package Motorock_Catalog_Importer
 */

if (!defined('ABSPATH')) {
    $wp_load = dirname(__FILE__, 5) . '/wp-load.php';
    if (!file_exists($wp_load)) {
        fwrite(STDERR, "Run via wp eval-file on the WordPress server.\n");
        exit(1);
    }
    require_once $wp_load;
}

$cli_args = isset($args) && is_array($args) ? $args : array();
$dry_run = in_array('dry-run', $cli_args, true) || in_array('--dry-run', $cli_args, true);

global $wpdb;

$product_ids = $wpdb->get_col(
    "SELECT DISTINCT p.ID
    FROM {$wpdb->posts} p
    INNER JOIN {$wpdb->postmeta} pm ON pm.post_id = p.ID
    WHERE p.post_type = 'product'
    AND p.post_status != 'trash'
    AND pm.meta_key = '_catalog_feed_id'
    ORDER BY p.ID ASC"
);

$updated = 0;
$already_visible = 0;

foreach ($product_ids as $product_id) {
    $product = wc_get_product((int) $product_id);
    if (!$product) {
        continue;
    }

    if ($product->get_catalog_visibility() === 'visible') {
        $already_visible++;
        continue;
    }

    if ($dry_run) {
        echo "would fix #{$product_id} ({$product->get_sku()}) — {$product->get_catalog_visibility()} → visible\n";
        $updated++;
        continue;
    }

    $product->set_catalog_visibility('visible');
    $product->save();
    $updated++;
}

echo ($dry_run ? '[DRY RUN] ' : '') . "Done. Updated: {$updated}, already visible: {$already_visible}\n";

exit(0);
