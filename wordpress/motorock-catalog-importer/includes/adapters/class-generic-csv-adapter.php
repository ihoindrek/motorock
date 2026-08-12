<?php

if (!defined('ABSPATH')) {
    exit;
}

class Motorock_Catalog_Importer_Generic_Csv_Adapter extends Motorock_Catalog_Importer_Adapter_Base {

    public static function default_column_map() {
        return array(
            'sku' => 'sku',
            'name' => 'name',
            'parent_sku' => 'parent_sku',
            'regular_price' => 'regular_price',
            'cost' => 'cost',
            'stock' => 'stock',
            'ean' => 'ean',
            'category' => 'category',
            'description' => 'description',
            'short_description' => 'short_description',
            'images' => 'images',
            'size' => 'size',
        );
    }

    public function get_slug() {
        return 'generic_csv';
    }

    public function get_label() {
        return 'Generic CSV (images & descriptions in file)';
    }

    public function build_queue(array $feed, array $context = array()) {
        if (empty($feed['csv_file'])) {
            throw new RuntimeException('CSV file missing.');
        }

        $rows = Motorock_Catalog_Importer_Csv_Parser::parse_file($feed['csv_file']);
        $mode = $this->get_import_mode($feed, $context);

        if ($mode === 'update_only') {
            return $this->build_flat_update_queue($rows, $this->column_key($feed, 'sku'), $this->column_key($feed, 'name'));
        }

        $queue = array();
        $simple_rows = array();
        $groups = array();

        foreach ($rows as $row) {
            $parent_sku = trim((string) $this->row_value($row, $feed, 'parent_sku'));
            if ($parent_sku !== '') {
                if (!isset($groups[$parent_sku])) {
                    $groups[$parent_sku] = array();
                }
                $groups[$parent_sku][] = $row;
                continue;
            }

            $sku = trim((string) $this->row_value($row, $feed, 'sku'));
            if ($sku === '') {
                continue;
            }

            $simple_rows[] = $row;
        }

        foreach ($simple_rows as $row) {
            $queue[] = array(
                'type' => 'simple',
                'parent_sku' => $this->row_value($row, $feed, 'sku'),
                'rows' => array($row),
            );
        }

        foreach ($groups as $parent_sku => $group_rows) {
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

        if ($queue_item['type'] === 'simple') {
            return $this->map_simple($feed, $queue_item['rows'][0]);
        }

        return $this->map_variable($feed, $queue_item);
    }

    private function map_update_row(array $feed, array $queue_item) {
        $row = isset($queue_item['row']) ? $queue_item['row'] : array();
        $sku = trim((string) $this->row_value($row, $feed, 'sku'));
        if ($sku === '') {
            return null;
        }

        $stock = (int) $this->row_value($row, $feed, 'stock');
        $meta = array();
        $cost = $this->row_value($row, $feed, 'cost');
        $ean = $this->row_value($row, $feed, 'ean');

        if ($cost !== '') {
            $meta['_cost'] = $cost;
        }
        if ($ean !== '') {
            $meta['_ean'] = $ean;
        }

        return array(
            'update_only' => true,
            'sku' => $sku,
            'regular_price' => $this->format_price($this->row_value($row, $feed, 'regular_price'), $feed),
            'stock_quantity' => $stock,
            'stock_status' => $stock > 0 ? 'instock' : 'outofstock',
            'meta' => $meta,
        );
    }

    private function map_simple(array $feed, array $row) {
        $sku = trim((string) $this->row_value($row, $feed, 'sku'));
        $stock = (int) $this->row_value($row, $feed, 'stock');

        return array(
            'is_simple' => true,
            'sku' => $sku,
            'name' => trim((string) $this->row_value($row, $feed, 'name')),
            'description' => (string) $this->row_value($row, $feed, 'description'),
            'short_description' => (string) $this->row_value($row, $feed, 'short_description'),
            'regular_price' => $this->format_price($this->row_value($row, $feed, 'regular_price'), $feed),
            'stock_quantity' => $stock,
            'stock_status' => $stock > 0 ? 'instock' : 'outofstock',
            'category_ids' => $this->resolve_category_ids($feed, $this->row_value($row, $feed, 'category')),
            'brand' => isset($feed['brand']) ? $feed['brand'] : '',
            'images' => $this->map_images_from_string($this->row_value($row, $feed, 'images')),
            'meta' => $this->build_meta($row, $feed),
        );
    }

    private function map_variable(array $feed, array $queue_item) {
        $rows = $queue_item['rows'];
        $first = $rows[0];
        $parent_sku = $queue_item['parent_sku'];
        $sizes = array();

        foreach ($rows as $row) {
            $size = trim((string) $this->row_value($row, $feed, 'size'));
            if ($size !== '') {
                $sizes[] = $size;
            }
        }

        $sizes = array_values(array_unique($sizes));
        $variations = array();

        foreach ($rows as $row) {
            $size = trim((string) $this->row_value($row, $feed, 'size'));
            $variation_sku = trim((string) $this->row_value($row, $feed, 'sku'));
            if ($variation_sku === '') {
                $variation_sku = $parent_sku . ($size !== '' ? '-' . sanitize_title($size) : '');
            }

            $stock = (int) $this->row_value($row, $feed, 'stock');
            $variation = array(
                'sku' => $variation_sku,
                'regular_price' => $this->format_price($this->row_value($row, $feed, 'regular_price'), $feed),
                'stock_quantity' => $stock,
                'stock_status' => $stock > 0 ? 'instock' : 'outofstock',
                'meta' => $this->build_meta($row, $feed),
            );

            if ($size !== '') {
                $variation['attributes'] = array(
                    array('name' => 'Size', 'option' => $size),
                );
            }

            $variations[] = $variation;
        }

        $attributes = array();
        if (!empty($sizes)) {
            $attributes[] = array(
                'name' => 'Size',
                'options' => $sizes,
                'visible' => true,
                'variation' => true,
            );
        }

        return array(
            'is_simple' => false,
            'sku' => $parent_sku,
            'name' => trim((string) $this->row_value($first, $feed, 'name')),
            'description' => (string) $this->row_value($first, $feed, 'description'),
            'short_description' => (string) $this->row_value($first, $feed, 'short_description'),
            'category_ids' => $this->resolve_category_ids($feed, $this->row_value($first, $feed, 'category')),
            'brand' => isset($feed['brand']) ? $feed['brand'] : '',
            'images' => $this->map_images_from_string($this->row_value($first, $feed, 'images')),
            'attributes' => $attributes,
            'variations' => $variations,
        );
    }

    private function build_meta(array $row, array $feed) {
        $meta = array();
        $cost = $this->row_value($row, $feed, 'cost');
        $ean = $this->row_value($row, $feed, 'ean');

        if ($cost !== '') {
            $meta['_cost'] = $cost;
        }
        if ($ean !== '') {
            $meta['_ean'] = $ean;
        }

        return $meta;
    }

    private function column_map(array $feed) {
        $defaults = self::default_column_map();
        $custom = isset($feed['column_map']) && is_array($feed['column_map']) ? $feed['column_map'] : array();

        return array_merge($defaults, $custom);
    }

    private function column_key(array $feed, $field) {
        $map = $this->column_map($feed);
        return isset($map[$field]) ? $map[$field] : $field;
    }

    private function row_value(array $row, array $feed, $field) {
        $column = $this->column_key($feed, $field);
        return isset($row[$column]) ? $row[$column] : '';
    }
}
