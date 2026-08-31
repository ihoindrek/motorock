<?php

if (!defined('ABSPATH')) {
    exit;
}

class Motorock_Catalog_Importer_Johndoe_Adapter extends Motorock_Catalog_Importer_Adapter_Base {

    /** @var Motorock_Catalog_Importer_PartsEurope_Scraper */
    private $scraper;

    public function __construct() {
        $this->scraper = new Motorock_Catalog_Importer_PartsEurope_Scraper();
    }

    public function get_slug() {
        return 'johndoe';
    }

    public function get_label() {
        return 'John Doe (stock CSV)';
    }

    public static function inferred_category_labels() {
        return array(
            'John Doe > Jackets',
            'John Doe > Pants',
            'John Doe > Gloves',
            'John Doe > Footwear',
            'John Doe > Protection',
            'John Doe > Accessories',
            'John Doe',
        );
    }

    public function build_queue(array $feed, array $context = array()) {
        if (empty($feed['csv_file'])) {
            throw new RuntimeException('CSV file missing.');
        }

        $rows = Motorock_Catalog_Importer_Csv_Parser::parse_file($feed['csv_file']);
        $mode = $this->get_import_mode($feed, $context);

        if ($mode === 'update_only') {
            return $this->build_update_queue($rows);
        }

        $queue = array();
        $grouped = $this->group_rows($rows);

        foreach ($grouped['simple'] as $row) {
            $queue[] = array(
                'type' => 'simple',
                'parent_sku' => $row['ArtNr'],
                'rows' => array($row),
            );
        }

        foreach ($grouped['variable'] as $parent_sku => $group_rows) {
            $queue[] = array(
                'type' => 'variable',
                'parent_sku' => $parent_sku,
                'rows' => $group_rows,
            );
        }

        return $queue;
    }

    public function map_queue_item(array $feed, array $queue_item, array $context = array()) {
        $mode = $this->get_import_mode($feed, $context);

        if ($mode === 'update_only' || (isset($queue_item['type']) && $queue_item['type'] === 'update_row')) {
            return $this->map_update_row($feed, $queue_item);
        }

        $first = $queue_item['rows'][0];
        $enriched = $this->scraper->lookup($first['ArtNr'], $queue_item['parent_sku']);

        if ($queue_item['type'] === 'simple') {
            return $this->map_simple($feed, $first, $enriched);
        }

        return $this->map_variable($feed, $queue_item, $enriched);
    }

    private function build_update_queue(array $rows) {
        $queue = array();

        foreach ($rows as $row) {
            $sku = isset($row['ArtNr']) ? trim((string) $row['ArtNr']) : '';
            if ($sku === '') {
                continue;
            }

            $queue[] = array(
                'type' => 'update_row',
                'sku' => $sku,
                'label' => isset($row['Bezeichnung']) ? $row['Bezeichnung'] : $sku,
                'row' => $row,
            );
        }

        return $queue;
    }

    private function map_update_row(array $feed, array $queue_item) {
        $row = isset($queue_item['row']) ? $queue_item['row'] : array();
        $sku = isset($row['ArtNr']) ? trim((string) $row['ArtNr']) : '';
        if ($sku === '') {
            return null;
        }

        $stock = $this->stock_total($row);

        return array(
            'update_only' => true,
            'sku' => $sku,
            'regular_price' => $this->format_price($row['VK_Brutto'], $feed),
            'stock_quantity' => $stock,
            'stock_status' => $stock > 0 ? 'instock' : 'outofstock',
            'meta' => array(
                '_cost' => $this->format_price($row['EK_Netto'], $feed),
                '_ean' => isset($row['Barcode']) ? $row['Barcode'] : '',
                '_jd_inside_stock' => isset($row['Inside_Warehouse']) ? (int) $row['Inside_Warehouse'] : 0,
                '_jd_outside_stock' => isset($row['Outside_Warehouse']) ? (int) $row['Outside_Warehouse'] : 0,
            ),
        );
    }

    private function map_simple(array $feed, array $row, $enriched) {
        $sku = trim((string) $row['ArtNr']);
        $stock = $this->stock_total($row);
        $name = trim((string) $row['Bezeichnung']);

        return array(
            'is_simple' => true,
            'sku' => $sku,
            'name' => $name,
            'description' => $enriched ? $enriched['description_html'] : '',
            'short_description' => $enriched ? $enriched['short_description'] : '',
            'regular_price' => $this->format_price($row['VK_Brutto'], $feed),
            'stock_quantity' => $stock,
            'stock_status' => $stock > 0 ? 'instock' : 'outofstock',
            'category_ids' => $this->resolve_category_ids($feed, $this->infer_category($name)),
            'brand' => isset($feed['brand']) && $feed['brand'] !== '' ? $feed['brand'] : 'John Doe',
            'images' => $this->map_images($enriched),
            'meta' => $this->row_meta($row, $sku),
        );
    }

    private function map_variable(array $feed, array $queue_item, $enriched) {
        $rows = $queue_item['rows'];
        $first = $rows[0];
        $parent_sku = $queue_item['parent_sku'];
        $sizes = array();

        foreach ($rows as $row) {
            $size = $this->extract_size($row);
            if ($size !== '') {
                $sizes[] = $size;
            }
        }

        $sizes = $this->sort_sizes(array_values(array_unique($sizes)));
        $variations = array();

        foreach ($rows as $row) {
            $stock = $this->stock_total($row);
            $variations[] = array(
                'sku' => trim((string) $row['ArtNr']),
                'regular_price' => $this->format_price($row['VK_Brutto'], $feed),
                'stock_quantity' => $stock,
                'stock_status' => $stock > 0 ? 'instock' : 'outofstock',
                'attributes' => array(
                    array('name' => 'Size', 'option' => $this->extract_size($row)),
                ),
                'meta' => $this->row_meta($row, $parent_sku),
            );
        }

        $name = trim((string) $first['Bezeichnung']);

        return array(
            'is_simple' => false,
            'sku' => $parent_sku,
            'name' => $name,
            'description' => $enriched ? $enriched['description_html'] : '',
            'short_description' => $enriched ? $enriched['short_description'] : '',
            'category_ids' => $this->resolve_category_ids($feed, $this->infer_category($name)),
            'brand' => isset($feed['brand']) && $feed['brand'] !== '' ? $feed['brand'] : 'John Doe',
            'images' => $this->map_images($enriched),
            'attributes' => array(
                array(
                    'name' => 'Size',
                    'options' => $sizes,
                    'visible' => true,
                    'variation' => true,
                ),
            ),
            'variations' => $variations,
            'meta' => array(
                '_supplier_sku' => $parent_sku,
            ),
        );
    }

    private function row_meta(array $row, $supplier_sku) {
        return array(
            '_cost' => $this->format_price($row['EK_Netto'], array('price_multiplier' => 1)),
            '_ean' => isset($row['Barcode']) ? $row['Barcode'] : '',
            '_supplier_sku' => $supplier_sku,
            '_jd_inside_stock' => isset($row['Inside_Warehouse']) ? (int) $row['Inside_Warehouse'] : 0,
            '_jd_outside_stock' => isset($row['Outside_Warehouse']) ? (int) $row['Outside_Warehouse'] : 0,
        );
    }

    private function stock_total(array $row) {
        $inside = isset($row['Inside_Warehouse']) ? (int) $row['Inside_Warehouse'] : 0;
        $outside = isset($row['Outside_Warehouse']) ? (int) $row['Outside_Warehouse'] : 0;
        return max(0, $inside + $outside);
    }

    private function group_rows(array $rows) {
        $simple = array();
        $variable = array();

        foreach ($rows as $row) {
            $art = isset($row['ArtNr']) ? trim((string) $row['ArtNr']) : '';
            if ($art === '') {
                continue;
            }

            $split = $this->split_parent_sku($art);
            if ($split['size'] === '') {
                $simple[] = $row;
                continue;
            }

            $parent = $split['parent'];
            if (!isset($variable[$parent])) {
                $variable[$parent] = array();
            }
            $variable[$parent][] = $row;
        }

        return array(
            'simple' => $simple,
            'variable' => $variable,
        );
    }

    private function split_parent_sku($art_nr) {
        $art_nr = trim((string) $art_nr);

        if (preg_match('/^(.+)-(XS|S|M|L|XL|2XL|3XL|4XL|5XL|6XL|XXL|XXXL|\d{2}(?:\.\d)?)$/i', $art_nr, $match)) {
            return array(
                'parent' => $match[1],
                'size' => strtoupper($match[2]),
            );
        }

        if (preg_match('/^(.+)-(\d{2}\/\d{2}(?:-[A-Z0-9]+)?)$/i', $art_nr, $match)) {
            return array(
                'parent' => $match[1],
                'size' => $match[2],
            );
        }

        return array(
            'parent' => $art_nr,
            'size' => '',
        );
    }

    private function extract_size(array $row) {
        $split = $this->split_parent_sku(isset($row['ArtNr']) ? $row['ArtNr'] : '');
        return $split['size'];
    }

    private function infer_category($name) {
        $checks = array(
            '/jacket|motoshirt|shirt|hoodie|sweat|vest|blouson|windblock|flannel/i' => 'Jackets',
            '/pant|jean|cargo|chino|stroker|ironhead|explorer/i' => 'Pants',
            '/glove/i' => 'Gloves',
            '/boot|shoe|sneaker|shifter|neo/i' => 'Footwear',
            '/protector|protect/i' => 'Protection',
            '/helmet|goggle|mask|hat|trucker|cap|tube|sock|belt|wallet|bag/i' => 'Accessories',
        );

        foreach ($checks as $pattern => $label) {
            if (preg_match($pattern, $name)) {
                return 'John Doe > ' . $label;
            }
        }

        return 'John Doe';
    }

    private function map_images($enriched) {
        if (!$enriched || empty($enriched['images'])) {
            return array();
        }

        $images = array();
        foreach ($enriched['images'] as $url) {
            $images[] = array('src' => $url);
        }

        return $images;
    }

    private function sort_sizes(array $sizes) {
        $order = array('XXS', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '6XL', 'XXL', 'XXXL');
        usort($sizes, function ($left, $right) use ($order) {
            $left_upper = strtoupper($left);
            $right_upper = strtoupper($right);
            $li = array_search($left_upper, $order, true);
            $ri = array_search($right_upper, $order, true);
            if ($li !== false && $ri !== false) {
                return $li - $ri;
            }
            if ($li !== false) {
                return -1;
            }
            if ($ri !== false) {
                return 1;
            }

            if (preg_match('/^(\d{2})\/(\d{2})/', $left, $left_match) && preg_match('/^(\d{2})\/(\d{2})/', $right, $right_match)) {
                $waist_diff = (int) $left_match[1] - (int) $right_match[1];
                if ($waist_diff !== 0) {
                    return $waist_diff;
                }
                return (int) $left_match[2] - (int) $right_match[2];
            }

            return strnatcasecmp($left, $right);
        });
        return $sizes;
    }
}
