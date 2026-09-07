<?php
/**
 * Upload John Doe product videos to the Media Library and fix blocked medienpaket URLs.
 *
 * Usage:
 *   wp eval-file wp-content/plugins/motorock-catalog-importer/scripts/backfill-johndoe-product-videos.php dry-run
 *   wp eval-file wp-content/plugins/motorock-catalog-importer/scripts/backfill-johndoe-product-videos.php
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

require_once dirname(__DIR__) . '/includes/class-image-downloader.php';
require_once dirname(__DIR__) . '/includes/shared/class-product-video.php';

$cli_args = $args ?? array();
$dry_run = in_array('dry-run', $cli_args, true) || in_array('--dry-run', $cli_args, true);

function motorock_johndoe_video_product_ids() {
    global $wpdb;

    $ids = $wpdb->get_col(
        "SELECT DISTINCT p.ID
        FROM {$wpdb->posts} p
        INNER JOIN {$wpdb->postmeta} pm ON pm.post_id = p.ID
        WHERE p.post_type = 'product'
        AND p.post_parent = 0
        AND p.post_status IN ('publish', 'draft')
        AND pm.meta_key = '" . esc_sql(Motorock_Catalog_Importer_Product_Video::META_KEY) . "'
        AND pm.meta_value <> ''"
    );

    return array_map('intval', $ids ?: array());
}

$downloader = new Motorock_Catalog_Importer_Image_Downloader();
$product_ids = motorock_johndoe_video_product_ids();

$stats = array(
    'processed' => 0,
    'updated' => 0,
    'skipped_public' => 0,
    'failed' => 0,
);

echo ($dry_run ? '[DRY RUN] ' : '') . 'John Doe product video upload — ' . count($product_ids) . " products\n\n";

foreach ($product_ids as $product_id) {
    $stats['processed']++;
    $product = wc_get_product($product_id);
    if (!$product) {
        continue;
    }

    $existing = Motorock_Catalog_Importer_Product_Video::sanitize_url(
        (string) get_post_meta($product_id, Motorock_Catalog_Importer_Product_Video::META_KEY, true)
    );

    if ($existing === '') {
        continue;
    }

    if (!$downloader->is_blocked_medienpaket_video_url($existing)) {
        $stats['skipped_public']++;
        continue;
    }

    if ($dry_run) {
        echo sprintf(
            "  would upload #%d (%s)\n    from %s\n",
            $product_id,
            $product->get_sku() ?: $product->get_slug(),
            $existing
        );
        $stats['updated']++;
        continue;
    }

    $public_video_url = $downloader->import_video_url($existing, $product_id);
    if ($public_video_url === '') {
        $stats['failed']++;
        echo sprintf(
            "  failed #%d (%s) — %s\n",
            $product_id,
            $product->get_sku() ?: $product->get_slug(),
            $existing
        );
        continue;
    }

    update_post_meta($product_id, Motorock_Catalog_Importer_Product_Video::META_KEY, $public_video_url);
    if (function_exists('update_field')) {
        update_field(Motorock_Catalog_Importer_Product_Video::META_KEY, $public_video_url, $product_id);
    }

    $stats['updated']++;
    echo sprintf(
        "  video #%d (%s) → %s\n",
        $product_id,
        $product->get_sku() ?: $product->get_slug(),
        $public_video_url
    );
}

echo sprintf(
    "\nDone. Updated: %d, already public: %d, failed: %d\n",
    $stats['updated'],
    $stats['skipped_public'],
    $stats['failed']
);

if ($dry_run) {
    echo "Re-run without dry-run to apply.\n";
}
