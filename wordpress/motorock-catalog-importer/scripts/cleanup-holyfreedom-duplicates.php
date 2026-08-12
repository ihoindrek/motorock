<?php
/**
 * Remove pre-import Holy Freedom duplicates after catalog_feed import.
 *
 * Usage (on shop.motorock.eu):
 *   wp eval-file wp-content/plugins/motorock-catalog-importer/scripts/cleanup-holyfreedom-duplicates.php
 *   wp eval-file ... -- dry-run
 */

if (!defined('ABSPATH')) {
    exit(1);
}

$dry_run = getenv('DRY_RUN') === '1';
$feed_id = '1aeadd07d692';

global $wpdb;

$catalog_products = $wpdb->get_results($wpdb->prepare(
    "SELECT p.ID, p.post_title, sku.meta_value AS sku
     FROM {$wpdb->posts} p
     INNER JOIN {$wpdb->postmeta} imp
       ON p.ID = imp.post_id AND imp.meta_key = '_import_source' AND imp.meta_value = 'catalog_feed'
     INNER JOIN {$wpdb->postmeta} feed
       ON p.ID = feed.post_id AND feed.meta_key = '_catalog_feed_id' AND feed.meta_value = %s
     LEFT JOIN {$wpdb->postmeta} sku ON p.ID = sku.post_id AND sku.meta_key = '_sku'
     WHERE p.post_type = 'product' AND p.post_status != 'trash'",
    $feed_id
));

$delete_ids = array();

foreach ($catalog_products as $keep) {
    $keep_sku = trim((string) $keep->sku);
    $others = $wpdb->get_results($wpdb->prepare(
        "SELECT p.ID, sku.meta_value AS sku
         FROM {$wpdb->posts} p
         LEFT JOIN {$wpdb->postmeta} sku ON p.ID = sku.post_id AND sku.meta_key = '_sku'
         WHERE p.post_type = 'product'
           AND p.post_status != 'trash'
           AND p.post_title = %s
           AND p.ID != %d",
        $keep->post_title,
        (int) $keep->ID
    ));

    foreach ($others as $other) {
        $other_id = (int) $other->ID;
        $other_sku = trim((string) $other->sku);

        if ($keep_sku !== '' && $other_sku === $keep_sku) {
            continue;
        }

        $delete_ids[$other_id] = array(
            'title' => $keep->post_title,
            'keep_id' => (int) $keep->ID,
            'keep_sku' => $keep_sku,
            'delete_sku' => $other_sku,
        );
    }
}

echo 'Catalog products: ' . count($catalog_products) . PHP_EOL;
echo 'Duplicates to remove: ' . count($delete_ids) . PHP_EOL;

if ($dry_run) {
    foreach ($delete_ids as $id => $info) {
        echo '[dry-run] delete ' . $id . ' sku=' . $info['delete_sku'] . ' keep=' . $info['keep_id'] . ' sku=' . $info['keep_sku'] . ' | ' . $info['title'] . PHP_EOL;
    }
    exit(0);
}

$deleted = 0;
$failed = 0;

foreach ($delete_ids as $id => $info) {
    $product = wc_get_product($id);
    if (!$product) {
        continue;
    }

    $name = $product->get_name();
    $sku = $product->get_sku();
    $result = $product->delete(true);

    if ($result) {
        $deleted++;
        echo '[deleted] ' . $id . ' sku=' . $sku . ' | ' . $name . PHP_EOL;
    } else {
        $failed++;
        echo '[failed] ' . $id . ' sku=' . $sku . ' | ' . $name . PHP_EOL;
    }
}

echo 'Done. deleted=' . $deleted . ' failed=' . $failed . PHP_EOL;
