<?php
/**
 * Remove the wrongly shared John Doe protector image from products.
 *
 * Usage:
 *   wp eval-file wp-content/plugins/motorock-catalog-importer/scripts/remove-johndoe-wrong-images.php dry-run
 *   wp eval-file wp-content/plugins/motorock-catalog-importer/scripts/remove-johndoe-wrong-images.php
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

$cli_args = $args ?? array();
$dry_run  = in_array('dry-run', $cli_args, true) || in_array('--dry-run', $cli_args, true);

function motorock_johndoe_wrong_image_product_ids() {
    global $wpdb;

    $ids = $wpdb->get_col(
        "SELECT DISTINCT p.ID
        FROM {$wpdb->posts} p
        INNER JOIN {$wpdb->postmeta} pm
            ON pm.post_id = p.ID
            AND pm.meta_key = '_catalog_adapter'
            AND pm.meta_value = 'johndoe'
        INNER JOIN {$wpdb->postmeta} th
            ON th.post_id = p.ID
            AND th.meta_key = '_thumbnail_id'
        INNER JOIN {$wpdb->posts} att
            ON att.ID = th.meta_value
        WHERE p.post_type = 'product'
        AND p.post_parent = 0
        AND att.post_title LIKE '%Protec_Back_LVL1_front%'"
    );

    return array_map('intval', $ids ?: array());
}

function motorock_attachment_used_by_products($attachment_id) {
    global $wpdb;

    $featured = (int) $wpdb->get_var($wpdb->prepare(
        "SELECT COUNT(*) FROM {$wpdb->postmeta}
        WHERE meta_key = '_thumbnail_id' AND meta_value = %s",
        (string) $attachment_id
    ));

    $gallery = (int) $wpdb->get_var($wpdb->prepare(
        "SELECT COUNT(*) FROM {$wpdb->postmeta}
        WHERE meta_key = '_product_image_gallery'
        AND (meta_value = %s OR meta_value LIKE %s OR meta_value LIKE %s OR meta_value LIKE %s)",
        (string) $attachment_id,
        $wpdb->esc_like((string) $attachment_id) . ',%',
        '%,' . $wpdb->esc_like((string) $attachment_id) . ',%',
        '%,' . $wpdb->esc_like((string) $attachment_id)
    ));

    return $featured + $gallery;
}

$product_ids = motorock_johndoe_wrong_image_product_ids();
$attachment_ids = array();

echo ($dry_run ? '[DRY RUN] ' : '') . 'Remove wrong John Doe images — ' . count($product_ids) . " products\n\n";

foreach ($product_ids as $product_id) {
    $product = wc_get_product($product_id);
    if (!$product) {
        continue;
    }

    $featured_id = (int) $product->get_image_id();
    $gallery_ids = $product->get_gallery_image_ids();

    if ($featured_id) {
        $attachment_ids[$featured_id] = true;
    }
    foreach ($gallery_ids as $gallery_id) {
        $attachment_ids[(int) $gallery_id] = true;
    }

    if ($dry_run) {
        echo sprintf(
            "  would clear #%d (%s) — featured %d, gallery %d item(s), status → draft\n",
            $product_id,
            $product->get_sku() ?: $product->get_slug(),
            $featured_id,
            count($gallery_ids)
        );
        continue;
    }

    $product->set_image_id(0);
    $product->set_gallery_image_ids(array());
    $product->set_status('draft');
    $product->save();

    echo sprintf(
        "  cleared #%d (%s)\n",
        $product_id,
        $product->get_sku() ?: $product->get_slug()
    );
}

if (!$dry_run) {
    foreach (array_keys($attachment_ids) as $attachment_id) {
        if (motorock_attachment_used_by_products($attachment_id) > 0) {
            continue;
        }

        $deleted = wp_delete_attachment((int) $attachment_id, true);
        if ($deleted) {
            echo "  deleted attachment #{$attachment_id}\n";
        }
    }
}

echo "\nDone.\n";
