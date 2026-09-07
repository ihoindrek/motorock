<?php
/**
 * Backfill product_video_url on Holy Freedom catalog products by re-scraping PrestaShop pages.
 *
 * Usage (on shop.motorock.eu):
 *   wp eval-file wp-content/plugins/motorock-catalog-importer/scripts/backfill-holyfreedom-videos.php dry-run
 *   wp eval-file wp-content/plugins/motorock-catalog-importer/scripts/backfill-holyfreedom-videos.php
 *   wp eval-file wp-content/plugins/motorock-catalog-importer/scripts/backfill-holyfreedom-videos.php dry-run 20
 *   wp eval-file wp-content/plugins/motorock-catalog-importer/scripts/backfill-holyfreedom-videos.php 1aeadd07d692 force
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

require_once dirname(__DIR__) . '/includes/class-csv-parser.php';
require_once dirname(__DIR__) . '/includes/class-feed-manager.php';
require_once dirname(__DIR__) . '/includes/class-prestashop-scraper.php';
require_once dirname(__DIR__) . '/includes/shared/class-product-video.php';

$cli_args = $args ?? array();
$dry_run = in_array('--dry-run', $cli_args, true) || in_array('dry-run', $cli_args, true);
$force = in_array('--force', $cli_args, true);
$feed_id = '';
$limit = 0;

foreach ($cli_args as $arg) {
    $arg = trim((string) $arg);
    if ($arg === 'dry-run' || $arg === '--dry-run') {
        $dry_run = true;
        continue;
    }
    if ($arg === 'force' || $arg === '--force') {
        $force = true;
        continue;
    }
    if (preg_match('/^\d+$/', $arg)) {
        $limit = max(0, (int) $arg);
        continue;
    }
    if (preg_match('/^[a-f0-9]{12}$/i', $arg)) {
        $feed_id = strtolower($arg);
    }
}

function motorock_hf_backfill_find_feed($feed_id) {
    $feeds = Motorock_Catalog_Importer_Feed_Manager::get_all_feeds();

    if ($feed_id !== '') {
        $feed = Motorock_Catalog_Importer_Feed_Manager::get_feed($feed_id);
        if (!$feed) {
            throw new RuntimeException('Feed not found: ' . $feed_id);
        }
        return $feed;
    }

    foreach ($feeds as $feed) {
        if (($feed['adapter'] ?? '') === 'holyfreedom' && !empty($feed['csv_file']) && file_exists($feed['csv_file'])) {
            return $feed;
        }
    }

    throw new RuntimeException('No Holy Freedom feed with CSV found. Pass --feed-id=...');
}

function motorock_hf_backfill_base_url($url) {
    $url = preg_replace('/#.*$/', '', trim((string) $url));
    return rtrim($url, '#');
}

/**
 * @return array<string, string> sku/ean/reference → product page URL
 */
function motorock_hf_backfill_url_map_from_csv($csv_path) {
    $rows = Motorock_Catalog_Importer_Csv_Parser::parse_file($csv_path);
    $map = array();

    foreach ($rows as $row) {
        $page_url = motorock_hf_backfill_base_url($row['product_link'] ?? '');
        if ($page_url === '') {
            continue;
        }

        if (($row['reference_product'] ?? '') !== '') {
            $parent = trim((string) $row['reference_product']);
            if ($parent !== '' && !isset($map[$parent])) {
                $map[$parent] = $page_url;
            }
        } else {
            $reference = trim((string) ($row['reference'] ?? ''));
            if ($reference !== '') {
                $map[$reference] = $page_url;
            }
        }

        $ean = trim((string) ($row['ean13'] ?? ''));
        if ($ean !== '') {
            $map[$ean] = $page_url;
        }
    }

    return $map;
}

function motorock_hf_backfill_parent_product_ids() {
    global $wpdb;

    $ids = $wpdb->get_col(
        "SELECT DISTINCT p.ID
        FROM {$wpdb->posts} p
        INNER JOIN {$wpdb->postmeta} pm ON pm.post_id = p.ID
        WHERE p.post_type = 'product'
        AND p.post_status = 'publish'
        AND p.post_parent = 0
        AND pm.meta_key = '_catalog_adapter'
        AND pm.meta_value = 'holyfreedom'
        ORDER BY p.ID ASC"
    );

    return array_map('intval', $ids ?: array());
}

function motorock_hf_backfill_resolve_page_url($product_id, array $url_map) {
    $stored = get_post_meta($product_id, '_catalog_source_product_url', true);
    if (is_string($stored) && $stored !== '') {
        return motorock_hf_backfill_base_url($stored);
    }

    $product = wc_get_product($product_id);
    if (!$product) {
        return '';
    }

    foreach (array($product->get_sku(), get_post_meta($product_id, '_supplier_sku', true)) as $key) {
        $key = trim((string) $key);
        if ($key !== '' && isset($url_map[$key])) {
            return $url_map[$key];
        }
    }

    return '';
}

function motorock_hf_backfill_set_video($product_id, $video_url, $dry_run) {
    if ($dry_run) {
        return true;
    }

    update_post_meta($product_id, Motorock_Catalog_Importer_Product_Video::META_KEY, $video_url);
    if (function_exists('update_field')) {
        update_field(Motorock_Catalog_Importer_Product_Video::META_KEY, $video_url, $product_id);
    }

    return true;
}

try {
    $feed = motorock_hf_backfill_find_feed($feed_id);
} catch (RuntimeException $exception) {
    fwrite(STDERR, $exception->getMessage() . "\n");
    exit(1);
}

$csv_file = $feed['csv_file'];
$url_map = motorock_hf_backfill_url_map_from_csv($csv_file);
$product_ids = motorock_hf_backfill_parent_product_ids();
$scraper = new Motorock_Catalog_Importer_Prestashop_Scraper();

if ($limit > 0) {
    $product_ids = array_slice($product_ids, 0, $limit);
}

$stats = array(
    'processed' => 0,
    'updated' => 0,
    'skipped_has_video' => 0,
    'skipped_no_url' => 0,
    'skipped_no_video' => 0,
    'errors' => 0,
);

echo ($dry_run ? '[DRY RUN] ' : '')
    . 'Holy Freedom video backfill — '
    . count($product_ids) . ' parent products'
    . ' (feed: ' . ($feed['id'] ?? 'unknown') . ', CSV keys: ' . count($url_map) . ")\n";

foreach ($product_ids as $product_id) {
    $stats['processed']++;
    $product = wc_get_product($product_id);
    if (!$product) {
        $stats['errors']++;
        continue;
    }

    $existing = Motorock_Catalog_Importer_Product_Video::sanitize_url(
        (string) get_post_meta($product_id, Motorock_Catalog_Importer_Product_Video::META_KEY, true)
    );
    if ($existing !== '' && !$force) {
        $stats['skipped_has_video']++;
        continue;
    }

    $page_url = motorock_hf_backfill_resolve_page_url($product_id, $url_map);
    if ($page_url === '') {
        $stats['skipped_no_url']++;
        echo sprintf(
            "  skip ID %d (%s) — no product page URL\n",
            $product_id,
            $product->get_sku() ?: $product->get_slug()
        );
        continue;
    }

    try {
        $scraped = $scraper->scrape($page_url, array('force_refresh' => true));
    } catch (RuntimeException $exception) {
        $stats['errors']++;
        echo sprintf(
            "  error ID %d (%s) — %s\n",
            $product_id,
            $product->get_sku() ?: $product->get_slug(),
            $exception->getMessage()
        );
        continue;
    }

    $video_url = Motorock_Catalog_Importer_Product_Video::sanitize_url(
        isset($scraped['video_url']) ? (string) $scraped['video_url'] : ''
    );

    if ($video_url === '') {
        $stats['skipped_no_video']++;
        continue;
    }

    motorock_hf_backfill_set_video($product_id, $video_url, $dry_run);
    $stats['updated']++;
    echo sprintf(
        "  %s ID %d (%s) → %s\n",
        $dry_run ? 'would set' : 'set',
        $product_id,
        $product->get_sku() ?: $product->get_slug(),
        $video_url
    );

    if (!$dry_run) {
        usleep(250000);
    }
}

echo sprintf(
    "Done. Updated: %d, already had video: %d, no URL: %d, page without video: %d, errors: %d (processed: %d)\n",
    $stats['updated'],
    $stats['skipped_has_video'],
    $stats['skipped_no_url'],
    $stats['skipped_no_video'],
    $stats['errors'],
    $stats['processed']
);

if ($dry_run) {
    echo "Re-run without dry-run to apply.\n";
}
