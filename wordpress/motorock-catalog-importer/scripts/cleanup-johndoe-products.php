<?php
/**
 * Remove all John Doe catalog products and their WooCommerce media attachments.
 *
 * Usage (on shop.motorock.eu):
 *   wp eval-file wp-content/plugins/motorock-catalog-importer/scripts/cleanup-johndoe-products.php dry-run
 *   wp eval-file wp-content/plugins/motorock-catalog-importer/scripts/cleanup-johndoe-products.php
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

$dry_run = in_array('dry-run', $args ?? array(), true)
    || in_array('--dry-run', $args ?? array(), true);

/**
 * @return int[]
 */
function motorock_johndoe_collect_product_ids() {
    global $wpdb;

    $ids = array();

    $term = get_term_by('slug', 'john-doe', 'pa_brand');
    if ($term) {
        $brand_product_ids = get_posts(array(
            'post_type' => 'product',
            'post_status' => array('publish', 'draft', 'pending', 'private'),
            'posts_per_page' => -1,
            'fields' => 'ids',
            'tax_query' => array(
                array(
                    'taxonomy' => 'pa_brand',
                    'field' => 'term_id',
                    'terms' => (int) $term->term_id,
                ),
            ),
        ));
        $ids = array_merge($ids, array_map('intval', $brand_product_ids));
    }

    $adapter_parent_ids = $wpdb->get_col(
        "SELECT DISTINCT pm.post_id
        FROM {$wpdb->postmeta} pm
        INNER JOIN {$wpdb->posts} p ON p.ID = pm.post_id
        WHERE pm.meta_key = '_catalog_adapter'
        AND pm.meta_value = 'johndoe'
        AND p.post_type = 'product'
        AND p.post_status != 'trash'"
    );
    $ids = array_merge($ids, array_map('intval', $adapter_parent_ids ?: array()));

    $feed_parent_ids = $wpdb->get_col(
        "SELECT DISTINCT pm.post_id
        FROM {$wpdb->postmeta} pm
        INNER JOIN {$wpdb->posts} p ON p.ID = pm.post_id
        INNER JOIN {$wpdb->postmeta} ad ON ad.post_id = pm.post_id AND ad.meta_key = '_catalog_adapter' AND ad.meta_value = 'johndoe'
        WHERE pm.meta_key = '_catalog_feed_id'
        AND p.post_type = 'product'
        AND p.post_status != 'trash'"
    );
    $ids = array_merge($ids, array_map('intval', $feed_parent_ids ?: array()));

    $ids = array_values(array_unique(array_filter($ids)));

    $all = $ids;
    foreach ($ids as $product_id) {
        $product = wc_get_product($product_id);
        if (!$product) {
            continue;
        }
        if ($product->is_type('variable')) {
            foreach ($product->get_children() as $child_id) {
                $all[] = (int) $child_id;
            }
        }
    }

    return array_values(array_unique(array_filter($all)));
}

/**
 * @param int[] $product_ids
 * @return int[]
 */
function motorock_johndoe_collect_attachment_ids(array $product_ids) {
    global $wpdb;

    $attachment_ids = array();

    foreach ($product_ids as $product_id) {
        $product = wc_get_product($product_id);
        if (!$product) {
            continue;
        }

        $thumb = (int) $product->get_image_id();
        if ($thumb > 0) {
            $attachment_ids[] = $thumb;
        }

        foreach ($product->get_gallery_image_ids() as $gallery_id) {
            $attachment_ids[] = (int) $gallery_id;
        }
    }

    if (!empty($product_ids)) {
        $parent_list = implode(',', array_map('intval', $product_ids));
        $child_attachments = $wpdb->get_col(
            "SELECT ID FROM {$wpdb->posts}
            WHERE post_type = 'attachment'
            AND post_status != 'trash'
            AND post_parent IN ({$parent_list})"
        );
        if (is_array($child_attachments)) {
            $attachment_ids = array_merge($attachment_ids, array_map('intval', $child_attachments));
        }
    }

    return array_values(array_unique(array_filter($attachment_ids)));
}

function motorock_johndoe_attachment_still_used($attachment_id, array $excluding_product_ids) {
    global $wpdb;

    $attachment_id = (int) $attachment_id;
    if ($attachment_id <= 0) {
        return false;
    }

    $exclude = implode(',', array_map('intval', $excluding_product_ids));
    if ($exclude === '') {
        $exclude = '0';
    }

    $thumb_use = (int) $wpdb->get_var(
        $wpdb->prepare(
            "SELECT COUNT(*) FROM {$wpdb->postmeta}
            WHERE meta_key = '_thumbnail_id'
            AND meta_value = %d
            AND post_id NOT IN ({$exclude})",
            (string) $attachment_id
        )
    );

    if ($thumb_use > 0) {
        return true;
    }

    $gallery_use = (int) $wpdb->get_var(
        $wpdb->prepare(
            "SELECT COUNT(*) FROM {$wpdb->postmeta}
            WHERE meta_key = '_product_image_gallery'
            AND meta_value LIKE %s
            AND post_id NOT IN ({$exclude})",
            '%' . $wpdb->esc_like((string) $attachment_id) . '%'
        )
    );

    return $gallery_use > 0;
}

$product_ids = motorock_johndoe_collect_product_ids();
$attachment_ids = motorock_johndoe_collect_attachment_ids($product_ids);

echo ($dry_run ? '[DRY RUN] ' : '') . 'John Doe cleanup' . PHP_EOL;
echo 'Products (incl. variations): ' . count($product_ids) . PHP_EOL;
echo 'Media attachments to remove: ' . count($attachment_ids) . PHP_EOL;

if ($dry_run) {
    foreach (array_slice($product_ids, 0, 15) as $id) {
        $p = wc_get_product($id);
        echo '  product ' . $id . ' ' . ($p ? $p->get_sku() : '?') . PHP_EOL;
    }
    if (count($product_ids) > 15) {
        echo '  ...' . PHP_EOL;
    }
    echo "Re-run without dry-run to delete.\n";
    exit(0);
}

$deleted_products = 0;
$failed_products = 0;

usort($product_ids, function ($a, $b) {
    $pa = wc_get_product($a);
    $pb = wc_get_product($b);
    $ta = $pa ? $pa->get_type() : '';
    $tb = $pb ? $pb->get_type() : '';
    if ($ta === 'variation' && $tb !== 'variation') {
        return -1;
    }
    if ($ta !== 'variation' && $tb === 'variation') {
        return 1;
    }
    return $a <=> $b;
});

foreach ($product_ids as $product_id) {
    $product = wc_get_product($product_id);
    if (!$product) {
        continue;
    }

    $name = $product->get_name();
    $sku = $product->get_sku();
    $result = $product->delete(true);

    if ($result) {
        $deleted_products++;
        echo '[deleted product] ' . $product_id . ' sku=' . $sku . ' | ' . $name . PHP_EOL;
    } else {
        $failed_products++;
        echo '[failed product] ' . $product_id . ' sku=' . $sku . PHP_EOL;
    }
}

$deleted_media = 0;
$skipped_media = 0;

foreach ($attachment_ids as $attachment_id) {
    if (motorock_johndoe_attachment_still_used($attachment_id, $product_ids)) {
        $skipped_media++;
        continue;
    }

    $file = get_attached_file($attachment_id);
    $result = wp_delete_attachment($attachment_id, true);
    if ($result) {
        $deleted_media++;
        echo '[deleted media] ' . $attachment_id . ' ' . basename((string) $file) . PHP_EOL;
    }
}

if (class_exists('Motorock_Catalog_Importer_Feed_Manager')) {
    require_once dirname(__DIR__) . '/includes/class-feed-manager.php';
    require_once dirname(__DIR__) . '/includes/class-feed-products.php';

    $feeds = Motorock_Catalog_Importer_Feed_Manager::get_all_feeds();
    foreach ($feeds as $feed) {
        if (($feed['adapter'] ?? '') !== 'johndoe' && stripos($feed['brand'] ?? '', 'john doe') === false) {
            continue;
        }
        Motorock_Catalog_Importer_Feed_Manager::save_feed($feed['id'], array(
            'catalog_hidden' => true,
            'product_count' => 0,
            'product_count_published' => 0,
            'product_count_draft' => 0,
            'product_count_updated_at' => current_time('mysql'),
        ));
    }
}

echo PHP_EOL . 'Done.' . PHP_EOL;
echo 'Products deleted: ' . $deleted_products . ' (failed: ' . $failed_products . ')' . PHP_EOL;
echo 'Media deleted: ' . $deleted_media . ' (skipped in use elsewhere: ' . $skipped_media . ')' . PHP_EOL;
echo 'Run: npm run revalidate (storefront cache)' . PHP_EOL;
