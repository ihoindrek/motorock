<?php

if (!defined('ABSPATH')) {
    exit;
}

class Motorock_Catalog_Importer_Holyfreedom_Adapter extends Motorock_Catalog_Importer_Adapter_Base {

    /** @var Motorock_Catalog_Importer_Prestashop_Scraper */
    private $scraper;

    public function __construct() {
        $this->scraper = new Motorock_Catalog_Importer_Prestashop_Scraper();
    }

    public function get_slug() {
        return 'holyfreedom';
    }

    public function get_label() {
        return 'Holy Freedom (CSV + PrestaShop)';
    }

    public function build_queue(array $feed, array $context = array()) {
        if (empty($feed['csv_file'])) {
            throw new RuntimeException('CSV file missing.');
        }

        $rows = Motorock_Catalog_Importer_Csv_Parser::parse_file($feed['csv_file']);
        $mode = $this->get_import_mode($feed, $context);

        if ($mode === 'update_only') {
            return $this->build_holyfreedom_update_queue($rows);
        }

        $queue = array();

        foreach ($this->group_simple_rows($rows) as $row) {
            $queue[] = array(
                'type' => 'simple',
                'parent_sku' => $row['reference'],
                'rows' => array($row),
                'page_url' => $this->base_url($row['product_link']),
                'category_name' => $row['category_name'],
            );
        }

        foreach ($this->group_variable_rows($rows) as $parent_sku => $group_rows) {
            $queue[] = array(
                'type' => 'variable',
                'parent_sku' => $parent_sku,
                'rows' => $group_rows,
                'page_url' => $this->base_url($group_rows[0]['product_link']),
                'category_name' => $group_rows[0]['category_name'],
            );
        }

        return $queue;
    }

    public function map_queue_item(array $feed, array $queue_item, array $context = array()) {
        $mode = $this->get_import_mode($feed, $context);

        if ($mode === 'update_only' || (isset($queue_item['type']) && $queue_item['type'] === 'update_row')) {
            return $this->map_update_row($feed, $queue_item);
        }

        $scraped = $this->scraper->scrape($queue_item['page_url']);

        if ($queue_item['type'] === 'simple') {
            return $this->map_simple($feed, $queue_item['rows'][0], $scraped);
        }

        return $this->map_variable($feed, $queue_item, $scraped);
    }

    private function build_holyfreedom_update_queue(array $rows) {
        $queue = array();

        foreach ($rows as $row) {
            $sku = $this->variation_sku($row);
            if ($sku === '') {
                continue;
            }

            $queue[] = array(
                'type' => 'update_row',
                'sku' => $sku,
                'label' => $row['name'],
                'row' => $row,
            );
        }

        return $queue;
    }

    private function map_update_row(array $feed, array $queue_item) {
        $row = isset($queue_item['row']) ? $queue_item['row'] : array();
        $sku = $this->variation_sku($row);
        if ($sku === '') {
            return null;
        }

        $stock = (int) $row['quantity'];

        return array(
            'update_only' => true,
            'sku' => $sku,
            'regular_price' => $this->format_price($row['Retail_Price'], $feed),
            'stock_quantity' => $stock,
            'stock_status' => $stock > 0 ? 'instock' : 'outofstock',
            'meta' => array(
                '_cost' => $row['Dedicated_Price'],
                '_ean' => $row['ean13'],
            ),
        );
    }

    private function map_simple(array $feed, array $row, array $scraped) {
        $sku = $this->row_sku($row);
        $stock = (int) $row['quantity'];

        return array(
            'is_simple' => true,
            'sku' => $sku,
            'name' => trim($row['name']),
            'description' => isset($scraped['description_html']) ? $scraped['description_html'] : '',
            'short_description' => isset($scraped['short_description']) ? $scraped['short_description'] : '',
            'regular_price' => $this->format_price($row['Retail_Price'], $feed),
            'stock_quantity' => $stock,
            'stock_status' => $stock > 0 ? 'instock' : 'outofstock',
            'category_ids' => $this->resolve_category_ids($feed, $row['category_name']),
            'brand' => isset($feed['brand']) ? $feed['brand'] : 'Holyfreedom',
            'images' => $this->map_images($scraped),
            'meta' => array(
                '_cost' => $row['Dedicated_Price'],
                '_ean' => $row['ean13'],
                '_supplier_sku' => $row['reference'] !== '' ? $row['reference'] : $sku,
            ),
        );
    }

    private function map_variable(array $feed, array $queue_item, array $scraped) {
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
            $stock = (int) $row['quantity'];
            $variations[] = array(
                'sku' => $this->variation_sku($row, $parent_sku),
                'regular_price' => $this->format_price($row['Retail_Price'], $feed),
                'stock_quantity' => $stock,
                'stock_status' => $stock > 0 ? 'instock' : 'outofstock',
                'attributes' => array(
                    array('name' => 'Size', 'option' => $this->extract_size($row)),
                ),
                'meta' => array(
                    '_cost' => $row['Dedicated_Price'],
                    '_ean' => $row['ean13'],
                    '_supplier_sku' => $parent_sku,
                ),
            );
        }

        return array(
            'is_simple' => false,
            'sku' => $parent_sku,
            'name' => $this->clean_product_name($first['name']),
            'description' => isset($scraped['description_html']) ? $scraped['description_html'] : '',
            'short_description' => isset($scraped['short_description']) ? $scraped['short_description'] : '',
            'category_ids' => $this->resolve_category_ids($feed, $queue_item['category_name']),
            'brand' => isset($feed['brand']) ? $feed['brand'] : 'Holyfreedom',
            'images' => $this->map_images($scraped),
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

    private function group_simple_rows(array $rows) {
        $simple = array();
        foreach ($rows as $row) {
            if ($row['reference_product'] !== '') {
                continue;
            }
            if ($row['reference'] === '' && $row['ean13'] === '') {
                continue;
            }
            $simple[] = $row;
        }
        return $simple;
    }

    private function group_variable_rows(array $rows) {
        $groups = array();
        foreach ($rows as $row) {
            if ($row['reference_product'] === '') {
                continue;
            }
            $key = $row['reference_product'];
            if (!isset($groups[$key])) {
                $groups[$key] = array();
            }
            $groups[$key][] = $row;
        }
        return $groups;
    }

    private function row_sku(array $row) {
        if ($row['reference'] !== '') {
            return $row['reference'];
        }
        if ($row['ean13'] !== '') {
            return $row['ean13'];
        }
        return 'HF-' . substr(sha1($row['product_link']), 0, 8);
    }

    private function variation_sku(array $row, $parent_sku = '') {
        if ($row['ean13'] !== '') {
            return $row['ean13'];
        }
        if ($row['reference'] !== '' && $row['reference_product'] === '') {
            return $row['reference'];
        }
        if ($parent_sku !== '') {
            $size = $this->extract_size($row);
            if ($size !== '') {
                return $parent_sku . '-' . sanitize_title($size);
            }
        }
        return $this->row_sku($row);
    }

    private function base_url($url) {
        $url = preg_replace('/#.*$/', '', trim((string) $url));
        return rtrim($url, '#');
    }

    private function extract_size(array $row) {
        if ($row['Size'] !== '') {
            return $row['Size'];
        }
        if (preg_match('/\(Size:\s*([^)]+)\)/i', $row['name'], $match)) {
            return trim($match[1]);
        }
        if (preg_match('/\(Jeans Size:\s*([^)]+)\)/i', $row['name'], $match)) {
            return trim($match[1]);
        }
        return '';
    }

    private function clean_product_name($name) {
        return preg_replace('/\s*\((Size|Jeans Size):\s*[^)]+\)\s*$/i', '', trim($name));
    }

    private function map_images(array $scraped) {
        $images = array();
        foreach (isset($scraped['images']) ? $scraped['images'] : array() as $url) {
            $images[] = array('src' => $url);
        }
        return $images;
    }

    private function sort_sizes(array $sizes) {
        $order = array('XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL');
        usort($sizes, function ($left, $right) use ($order) {
            $li = array_search(strtoupper($left), $order, true);
            $ri = array_search(strtoupper($right), $order, true);
            if ($li !== false && $ri !== false) {
                return $li - $ri;
            }
            return strnatcasecmp($left, $right);
        });
        return $sizes;
    }
}
