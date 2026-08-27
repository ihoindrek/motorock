<?php
/**
 * Backfill normalized pa_color / pa_size / pa_leg-length on existing variable products.
 *
 * Usage (on shop.motorock.eu):
 *   wp eval-file wp-content/plugins/motorock-catalog-importer/scripts/backfill-product-attributes.php
 *   wp eval-file wp-content/plugins/motorock-catalog-importer/scripts/backfill-product-attributes.php motogirl
 *   wp eval-file wp-content/plugins/motorock-catalog-importer/scripts/backfill-product-attributes.php motogirl --dry-run
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

require_once dirname(__DIR__) . '/includes/class-attribute-normalizer.php';

$brand = isset($args[0]) ? trim((string) $args[0]) : 'motogirl';
$dry_run = in_array('--dry-run', $args ?? array(), true);

$product_ids = get_posts(array(
    'post_type' => 'product',
    'post_status' => 'publish',
    'fields' => 'ids',
    'posts_per_page' => -1,
    'tax_query' => array(
        array(
            'taxonomy' => 'pa_brand',
            'field' => 'slug',
            'terms' => array(sanitize_title($brand)),
        ),
    ),
));

if (empty($product_ids)) {
    echo "No published products found for brand: {$brand}\n";
    exit(0);
}

$total_updated = 0;
$products_touched = 0;

echo ($dry_run ? '[DRY RUN] ' : '') . "Backfilling " . count($product_ids) . " products (brand: {$brand})\n";

foreach ($product_ids as $product_id) {
    $product = wc_get_product($product_id);
    if (!$product || !$product->is_type('variable')) {
        continue;
    }

    $result = Motorock_Catalog_Importer_Attribute_Normalizer::backfill_variable_product(
        (int) $product_id,
        $dry_run
    );

    if ($result['updated'] > 0) {
        $products_touched++;
        $total_updated += (int) $result['updated'];
        echo sprintf(
            "  %s ID %d — %d variation(s)\n",
            $product->get_sku() ?: $product->get_slug(),
            $product_id,
            $result['updated']
        );
    }
}

echo "Done. Products touched: {$products_touched}, variations updated: {$total_updated}\n";

if ($dry_run) {
    echo "Re-run without --dry-run to apply changes.\n";
}
