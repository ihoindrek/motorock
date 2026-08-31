<?php
/**
 * Backfill pa_brand = John Doe on catalog-imported products (GraphQL needs WC attributes).
 *
 * Usage:
 *   wp eval-file wp-content/plugins/motorock-catalog-importer/scripts/backfill-johndoe-pa-brand.php
 *   wp eval-file wp-content/plugins/motorock-catalog-importer/scripts/backfill-johndoe-pa-brand.php dry-run
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

if (!class_exists('WooCommerce')) {
    fwrite(STDERR, "WooCommerce is required.\n");
    exit(1);
}

require_once dirname(__DIR__) . '/includes/shared/class-brand-bridge.php';

$dry_run = in_array('dry-run', $args ?? array(), true)
    || in_array('--dry-run', $args ?? array(), true);

function motorock_johndoe_backfill_product_ids() {
    global $wpdb;

    $ids = $wpdb->get_col(
        "SELECT DISTINCT p.ID
        FROM {$wpdb->posts} p
        INNER JOIN {$wpdb->postmeta} pm ON pm.post_id = p.ID
        WHERE p.post_type = 'product'
        AND p.post_status = 'publish'
        AND pm.meta_key = '_catalog_adapter'
        AND pm.meta_value = 'johndoe'
        ORDER BY p.ID ASC"
    );

    return array_map('intval', $ids ?: array());
}

function motorock_johndoe_product_has_graphql_brand($product_id) {
    $product = wc_get_product($product_id);
    if (!$product) {
        return false;
    }

    $attributes = $product->get_attributes();
    if (!isset($attributes['pa_brand'])) {
        return false;
    }

    $options = $attributes['pa_brand']->get_options();
    return !empty($options);
}

$product_ids = motorock_johndoe_backfill_product_ids();
$bridge = new Motorock_Catalog_Importer_Brand_Bridge();
$assigned = 0;
$skipped = 0;

echo ($dry_run ? '[DRY RUN] ' : '') . 'John Doe pa_brand backfill — ' . count($product_ids) . " catalog products\n";

foreach ($product_ids as $product_id) {
    if (motorock_johndoe_product_has_graphql_brand($product_id)) {
        $skipped++;
        continue;
    }

    if ($dry_run) {
        $product = wc_get_product($product_id);
        echo sprintf(
            "  would assign John Doe → ID %d (%s)\n",
            $product_id,
            $product ? ($product->get_sku() ?: $product->get_slug()) : 'unknown'
        );
        $assigned++;
        continue;
    }

    if ($bridge->ensure_product_brand($product_id, 'John Doe', null, true)) {
        $assigned++;
    }
}

echo "Done. Assigned: {$assigned}, already OK: {$skipped}\n";

if ($dry_run) {
    echo "Re-run without dry-run to apply.\n";
}
