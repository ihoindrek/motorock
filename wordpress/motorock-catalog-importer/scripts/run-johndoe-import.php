<?php
/**
 * Run John Doe catalog import via WP-CLI (no admin UI).
 *
 * Usage (on shop.motorock.eu):
 *   wp eval-file wp-content/plugins/motorock-catalog-importer/scripts/run-johndoe-import.php \
 *     /path/to/source-stock.csv with-images-only
 *
 *   wp eval-file ... dry-run with-images-only
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

if (!class_exists('WooCommerce') || !class_exists('Motorock_Catalog_Importer_Feed_Manager')) {
    fwrite(STDERR, "WooCommerce and Motorock Catalog Importer are required.\n");
    exit(1);
}

/**
 * Motorock Woo category IDs (shop.motorock.eu) — see docs/catalog/johndoe-import.md
 *
 * @return array<string, int>
 */
function motorock_johndoe_category_mappings() {
    return array(
        'John Doe > Men > Jackets' => 136,
        'John Doe > Women > Jackets' => 151,
        'John Doe > Men > Motoshirts' => 136,
        'John Doe > Women > Motoshirts' => 151,
        'John Doe > Men > Vests' => 143,
        'John Doe > Women > Vests' => 159,
        'John Doe > Men > Hoodies & Sweaters' => 139,
        'John Doe > Women > Hoodies & Sweaters' => 155,
        'John Doe > Men > T-Shirts' => 415,
        'John Doe > Women > T-Shirts' => 418,
        'John Doe > Men > Pants' => 179,
        'John Doe > Women > Pants' => 412,
        'John Doe > Men > Gloves' => 138,
        'John Doe > Women > Gloves' => 153,
        'John Doe > Men > Footwear' => 137,
        'John Doe > Women > Footwear' => 152,
        'John Doe > Men > Protection' => 185,
        'John Doe > Women > Protection' => 185,
        'John Doe > Men > Eyewear' => 203,
        'John Doe > Women > Eyewear' => 203,
        'John Doe > Men > Accessories' => 185,
        'John Doe > Women > Accessories' => 185,
        'John Doe > Men > Other' => 134,
        'John Doe > Women > Other' => 149,
    );
}

$cli_args = isset($args) && is_array($args) ? $args : array();
$dry_run = in_array('dry-run', $cli_args, true) || in_array('--dry-run', $cli_args, true);
$with_images_only = in_array('with-images-only', $cli_args, true);

$csv_path = '';
foreach ($cli_args as $arg) {
    if ($arg === 'dry-run' || $arg === '--dry-run' || $arg === 'with-images-only') {
        continue;
    }
    if ($csv_path === '' && is_string($arg) && $arg !== '') {
        $csv_path = $arg;
        break;
    }
}

if ($csv_path === '') {
    $upload_dir = wp_upload_dir();
    $csv_path = trailingslashit($upload_dir['basedir']) . 'motorock-catalog-importer/csv/johndoe-source.csv';
}

if (!file_exists($csv_path)) {
    fwrite(STDERR, "CSV not found: {$csv_path}\n");
    exit(1);
}

@set_time_limit(0);

$feed = array(
    'id' => 'johndoe-cli',
    'adapter' => 'johndoe',
    'brand' => 'John Doe',
    'price_multiplier' => 1,
    'category_mappings' => motorock_johndoe_category_mappings(),
    'catalog_hidden' => false,
    'csv_file' => $csv_path,
);

$adapter = Motorock_Catalog_Importer_Feed_Manager::get_adapter($feed);
$queue = $adapter->build_queue($feed, array('mode' => 'full'));
$skipped_no_image = 0;

if ($with_images_only) {
    $before = count($queue);
    $queue = $adapter->filter_queue_with_pe_images($queue);
    $skipped_no_image = $before - count($queue);
}

$logger = new Motorock_Catalog_Importer_Logger('johndoe-cli');
$writer = new Motorock_Catalog_Importer_Product_Writer($feed, $logger);
$stats = array(
    'imported' => 0,
    'updated' => 0,
    'skipped' => 0,
    'failed' => 0,
);

echo ($dry_run ? '[DRY RUN] ' : '') . 'John Doe import' . ($with_images_only ? ' (with images only)' : '') . "\n";
echo 'CSV: ' . $csv_path . "\n";
echo 'Queue: ' . count($queue) . ' parent products';
if ($with_images_only) {
    echo " ({$skipped_no_image} skipped — no PE image)";
}
echo "\n\n";

foreach ($queue as $index => $item) {
    $label = isset($item['parent_sku']) ? $item['parent_sku'] : ('item-' . $index);
    $progress = ($index + 1) . '/' . count($queue);

    if ($dry_run) {
        echo "[{$progress}] would import {$label}\n";
        continue;
    }

    try {
        $product_data = $adapter->map_queue_item($feed, $item, array('mode' => 'full'));
        if (!$product_data) {
            $stats['skipped'] += 1;
            echo "[{$progress}] SKIP {$label}\n";
            continue;
        }

        $result = $writer->upsert_product($product_data, 'full');
        $action = isset($result['action']) ? $result['action'] : 'failed';
        $product_id = isset($result['product_id']) ? (int) $result['product_id'] : 0;

        if ($action === 'imported') {
            $stats['imported'] += 1;
            echo "[{$progress}] OK imported {$label} (#{$product_id})\n";
        } elseif ($action === 'updated') {
            $stats['updated'] += 1;
            echo "[{$progress}] OK updated {$label} (#{$product_id})\n";
        } elseif ($action === 'skipped') {
            $stats['skipped'] += 1;
            echo "[{$progress}] SKIP {$label}\n";
        } else {
            $stats['failed'] += 1;
            echo "[{$progress}] FAIL {$label}\n";
        }
    } catch (Throwable $e) {
        $stats['failed'] += 1;
        echo "[{$progress}] FAIL {$label}: " . $e->getMessage() . "\n";
    }
}

echo "\nDone.\n";
echo '  Imported: ' . $stats['imported'] . "\n";
echo '  Updated:  ' . $stats['updated'] . "\n";
echo '  Skipped:  ' . $stats['skipped'] . "\n";
echo '  Failed:   ' . $stats['failed'] . "\n";

exit($stats['failed'] > 0 ? 1 : 0);
