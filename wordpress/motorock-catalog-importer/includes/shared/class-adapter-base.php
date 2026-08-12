<?php

if (!defined('ABSPATH')) {
    exit;
}

abstract class Motorock_Catalog_Importer_Adapter_Base implements Motorock_Catalog_Importer_Feed_Adapter {

    protected function get_import_mode(array $feed, array $context = array()) {
        if (!empty($context['mode'])) {
            return $context['mode'] === 'update_only' ? 'update_only' : 'full';
        }

        return !empty($feed['default_import_mode']) && $feed['default_import_mode'] === 'update_only'
            ? 'update_only'
            : 'full';
    }

    protected function format_price($value, array $feed) {
        $multiplier = isset($feed['price_multiplier']) ? (float) $feed['price_multiplier'] : 1;
        if ($multiplier <= 0) {
            $multiplier = 1;
        }

        $number = (float) str_replace(',', '.', (string) $value);
        return wc_format_decimal($number * $multiplier, wc_get_price_decimals());
    }

    protected function resolve_category_ids(array $feed, $source_category) {
        $source = trim((string) $source_category);
        $mappings = isset($feed['category_mappings']) ? $feed['category_mappings'] : array();

        if ($source !== '' && isset($mappings[$source]) && (int) $mappings[$source] > 0) {
            return array((int) $mappings[$source]);
        }

        $default = (int) get_option('default_product_cat', 0);
        return $default > 0 ? array($default) : array();
    }

    protected function map_images_from_string($value) {
        $value = trim((string) $value);
        if ($value === '') {
            return array();
        }

        $parts = preg_split('/\s*[|,]\s*/', $value);
        $images = array();
        foreach ($parts as $part) {
            $url = trim($part);
            if ($url !== '') {
                $images[] = array('src' => $url);
            }
        }

        return $images;
    }

    /**
     * @param array<int, array<string, string>> $rows
     * @return array<int, array<string, mixed>>
     */
    protected function build_flat_update_queue(array $rows, $sku_column, $label_column = 'name') {
        $queue = array();

        foreach ($rows as $row) {
            $sku = isset($row[$sku_column]) ? trim((string) $row[$sku_column]) : '';
            if ($sku === '') {
                continue;
            }

            $queue[] = array(
                'type' => 'update_row',
                'sku' => $sku,
                'label' => isset($row[$label_column]) ? $row[$label_column] : $sku,
                'row' => $row,
            );
        }

        return $queue;
    }
}
