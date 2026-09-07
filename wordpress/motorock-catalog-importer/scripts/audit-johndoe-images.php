<?php
/**
 * Audit John Doe product image sources.
 * wp eval-file .../audit-johndoe-images.php
 */

if (!defined('ABSPATH')) {
    exit(1);
}

require_once dirname(__DIR__) . '/includes/class-medienpaket-index.php';

$medienpaket = new Motorock_Catalog_Importer_Medienpaket_Index();

function motorock_audit_image_source($attachment_id) {
    $src = (string) get_post_meta($attachment_id, '_catalog_source_image_url', true);
    if ($src === '') {
        $src = (string) wp_get_attachment_url($attachment_id);
    }

    $from_pe = (strpos($src, 'partseurope') !== false || strpos($src, 'media.partseurope') !== false);
    $from_mp = (strpos($src, Motorock_Catalog_Importer_Medienpaket_Index::SCHEME) === 0);

    return array(
        'src'     => $src,
        'file'    => basename((string) get_attached_file($attachment_id)),
        'from_pe' => $from_pe,
        'from_mp' => $from_mp,
    );
}

global $wpdb;

$ids = $wpdb->get_col(
    "SELECT DISTINCT p.ID FROM {$wpdb->posts} p
     INNER JOIN {$wpdb->postmeta} pm ON pm.post_id = p.ID AND pm.meta_key = '_catalog_adapter' AND pm.meta_value = 'johndoe'
     INNER JOIN {$wpdb->postmeta} th ON th.post_id = p.ID AND th.meta_key = '_thumbnail_id' AND th.meta_value NOT IN ('', '0')
     WHERE p.post_type = 'product' AND p.post_parent = 0 AND p.post_status = 'publish'"
);

$stats = array(
    'pe_only'        => 0,
    'mp_correct'     => 0,
    'mp_wrong_pe'    => 0,
    'mp_no_match'    => 0,
    'unknown'        => 0,
);

$samples_wrong   = array();
$samples_unknown = array();

foreach ($ids as $id) {
    $product = wc_get_product((int) $id);
    if (!$product) {
        continue;
    }

    $sku     = (string) $product->get_sku();
    $payload = $medienpaket->lookup($sku, get_post_meta($id, '_supplier_sku', true));
    $feat    = (int) $product->get_image_id();
    $audit   = motorock_audit_image_source($feat);
    $has_mp  = $payload && !empty($payload['images']);

    if (!$has_mp) {
        ++$stats['pe_only'];
        continue;
    }

    $expected_first = (string) $payload['images'][0];
    if ($audit['from_mp']) {
        ++$stats['mp_correct'];
    } elseif ($audit['from_pe']) {
        ++$stats['mp_wrong_pe'];
        if (count($samples_wrong) < 12) {
            $samples_wrong[] = array(
                'sku'      => $sku,
                'current'  => $audit['src'],
                'expected' => $expected_first,
            );
        }
    } else {
        ++$stats['unknown'];
        if (count($samples_unknown) < 8) {
            $samples_unknown[] = array(
                'sku'      => $sku,
                'current'  => $audit['src'],
                'file'     => $audit['file'],
                'expected' => $expected_first,
            );
        }
    }
}

echo "Published John Doe with image: " . count($ids) . "\n\n";
foreach ($stats as $key => $count) {
    echo "  {$key}: {$count}\n";
}

if ($samples_unknown) {
    echo "\nMedienpaket products with non-PE featured image (uploaded copy):\n";
    foreach ($samples_unknown as $row) {
        echo "  {$row['sku']} — file: {$row['file']}\n";
        echo "    source meta: {$row['current']}\n";
        echo "    expected 1st: {$row['expected']}\n";
    }
}

if ($samples_wrong) {
    echo "\nMedienpaket products currently showing PE image:\n";
    foreach ($samples_wrong as $row) {
        echo "  {$row['sku']}\n";
        echo "    current:  {$row['current']}\n";
        echo "    expected: {$row['expected']}\n";
    }
}
