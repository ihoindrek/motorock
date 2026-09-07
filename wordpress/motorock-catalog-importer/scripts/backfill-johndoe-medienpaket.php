<?php
/**
 * Backfill John Doe products with medienpaket images and videos.
 *
 * Usage:
 *   wp eval-file wp-content/plugins/motorock-catalog-importer/scripts/backfill-johndoe-medienpaket.php dry-run
 *   wp eval-file wp-content/plugins/motorock-catalog-importer/scripts/backfill-johndoe-medienpaket.php
 *   wp eval-file wp-content/plugins/motorock-catalog-importer/scripts/backfill-johndoe-medienpaket.php force
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

require_once dirname(__DIR__) . '/includes/class-medienpaket-index.php';
require_once dirname(__DIR__) . '/includes/class-image-downloader.php';
require_once dirname(__DIR__) . '/includes/shared/class-product-video.php';

$cli_args = $args ?? array();
$dry_run = in_array('dry-run', $cli_args, true) || in_array('--dry-run', $cli_args, true);
$force = in_array('force', $cli_args, true) || in_array('--force', $cli_args, true);

function motorock_johndoe_backfill_parent_ids() {
    global $wpdb;

    $ids = $wpdb->get_col(
        "SELECT DISTINCT p.ID
        FROM {$wpdb->posts} p
        INNER JOIN {$wpdb->postmeta} pm ON pm.post_id = p.ID
        WHERE p.post_type = 'product'
        AND p.post_status IN ('publish', 'draft')
        AND p.post_parent = 0
        AND pm.meta_key = '_catalog_adapter'
        AND pm.meta_value = 'johndoe'
        ORDER BY p.ID ASC"
    );

    return array_map('intval', $ids ?: array());
}

$medienpaket = new Motorock_Catalog_Importer_Medienpaket_Index();
$index = $medienpaket->get_index();
$downloader = new Motorock_Catalog_Importer_Image_Downloader();
$product_ids = motorock_johndoe_backfill_parent_ids();

$stats = array(
    'processed' => 0,
    'images_updated' => 0,
    'videos_updated' => 0,
    'skipped_no_match' => 0,
    'skipped_has_media' => 0,
);

echo ($dry_run ? '[DRY RUN] ' : '') . 'John Doe medienpaket backfill — ' . count($product_ids) . " products\n";
echo 'Index keys: ' . count($index) . "\n\n";

foreach ($product_ids as $product_id) {
    $stats['processed']++;
    $product = wc_get_product($product_id);
    if (!$product) {
        continue;
    }

    $payload = $medienpaket->lookup($product->get_sku(), get_post_meta($product_id, '_supplier_sku', true));
    if (!$payload || (empty($payload['images']) && empty($payload['video_url']))) {
        $stats['skipped_no_match']++;
        continue;
    }

    $has_image = (bool) $product->get_image_id();
    $existing_video = Motorock_Catalog_Importer_Product_Video::sanitize_url(
        (string) get_post_meta($product_id, Motorock_Catalog_Importer_Product_Video::META_KEY, true)
    );
    $blocked_video = $downloader->is_blocked_medienpaket_video_url($existing_video);
    $should_update_images = !empty($payload['images']) && ($force || !$has_image);
    $should_update_video = !empty($payload['video_url']) && (
        $force
        || $existing_video === ''
        || $blocked_video
    );

    if (!$force && !$should_update_images && !$should_update_video) {
        $stats['skipped_has_media']++;
        continue;
    }

    $images = array();
    foreach ($payload['images'] as $src) {
        $images[] = array('src' => $src);
    }

    if ($dry_run) {
        echo sprintf(
            "  would update #%d (%s) — %d image(s)%s\n",
            $product_id,
            $product->get_sku() ?: $product->get_slug(),
            count($images),
            $payload['video_url'] ? ', video' : ''
        );
        if (!empty($images)) {
            $stats['images_updated']++;
        }
        if ($should_update_video) {
            $stats['videos_updated']++;
        }
        continue;
    }

    if ($should_update_images) {
        if ($downloader->set_product_images($product_id, $images)) {
            $stats['images_updated']++;
        }
    }

    if ($should_update_video) {
        $public_video_url = $downloader->import_video_url($payload['video_url'], $product_id);
        if ($public_video_url !== '') {
            update_post_meta($product_id, Motorock_Catalog_Importer_Product_Video::META_KEY, $public_video_url);
            if (function_exists('update_field')) {
                update_field(Motorock_Catalog_Importer_Product_Video::META_KEY, $public_video_url, $product_id);
            }
            $stats['videos_updated']++;
            echo sprintf(
                "  video #%d (%s) → %s\n",
                $product_id,
                $product->get_sku() ?: $product->get_slug(),
                $public_video_url
            );
        }
    }
}

echo sprintf(
    "\nDone. Images: %d, videos: %d, no medienpaket match: %d, skipped (already had media): %d\n",
    $stats['images_updated'],
    $stats['videos_updated'],
    $stats['skipped_no_match'],
    $stats['skipped_has_media']
);

if ($dry_run) {
    echo "Re-run without dry-run to apply.\n";
}
