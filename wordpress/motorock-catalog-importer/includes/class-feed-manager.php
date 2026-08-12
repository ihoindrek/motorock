<?php

if (!defined('ABSPATH')) {
    exit;
}

class Motorock_Catalog_Importer_Feed_Manager {

    /** @var array<string, Motorock_Catalog_Importer_Feed_Adapter> */
    private static $adapters = null;

    public static function get_all_feeds() {
        $feeds = get_option(MOTOROCK_CATALOG_IMPORTER_OPTION, array());
        return is_array($feeds) ? $feeds : array();
    }

    public static function get_feed($feed_id) {
        $feeds = self::get_all_feeds();
        return isset($feeds[$feed_id]) ? $feeds[$feed_id] : null;
    }

    public static function save_feed($feed_id, array $data) {
        $feeds = self::get_all_feeds();
        $existing = isset($feeds[$feed_id]) ? $feeds[$feed_id] : array();

        $feeds[$feed_id] = array_merge(array(
            'id' => $feed_id,
            'name' => '',
            'adapter' => 'holyfreedom',
            'brand' => '',
            'price_multiplier' => 1,
            'category_mappings' => array(),
            'column_map' => Motorock_Catalog_Importer_Generic_Csv_Adapter::default_column_map(),
            'default_import_mode' => 'full',
            'csv_file' => '',
            'csv_original_name' => '',
            'csv_uploaded_at' => '',
            'last_import_at' => '',
            'last_import_stats' => array(),
            'created_at' => current_time('mysql'),
        ), $existing, $data, array('id' => $feed_id));

        update_option(MOTOROCK_CATALOG_IMPORTER_OPTION, $feeds);
        return $feeds[$feed_id];
    }

    public static function delete_feed($feed_id) {
        $feeds = self::get_all_feeds();
        unset($feeds[$feed_id]);
        update_option(MOTOROCK_CATALOG_IMPORTER_OPTION, $feeds);
    }

    public static function generate_id($seed) {
        return sanitize_key(substr(md5($seed . microtime(true)), 0, 12));
    }

    public static function get_adapters() {
        if (self::$adapters !== null) {
            return self::$adapters;
        }

        self::$adapters = array(
            'holyfreedom' => new Motorock_Catalog_Importer_Holyfreedom_Adapter(),
            'generic_csv' => new Motorock_Catalog_Importer_Generic_Csv_Adapter(),
        );

        return self::$adapters;
    }

    public static function get_adapter(array $feed) {
        $adapters = self::get_adapters();
        $slug = isset($feed['adapter']) ? $feed['adapter'] : 'holyfreedom';

        if (!isset($adapters[$slug])) {
            throw new RuntimeException('Unknown adapter: ' . $slug);
        }

        return $adapters[$slug];
    }

    public static function get_adapter_choices() {
        $choices = array();
        foreach (self::get_adapters() as $slug => $adapter) {
            $choices[$slug] = $adapter->get_label();
        }
        return $choices;
    }

    public static function store_csv_upload($feed_id, array $file) {
        if (!empty($file['error'])) {
            return new WP_Error('upload_error', 'Upload failed.');
        }

        $upload_dir = wp_upload_dir();
        $target_dir = trailingslashit($upload_dir['basedir']) . 'motorock-catalog-importer/csv';

        if (!file_exists($target_dir)) {
            wp_mkdir_p($target_dir);
        }

        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if ($ext !== 'csv') {
            return new WP_Error('invalid_type', 'Only CSV files are supported.');
        }

        $filename = sanitize_file_name($feed_id . '-' . date('Ymd-His') . '.csv');
        $target = trailingslashit($target_dir) . $filename;

        if (!move_uploaded_file($file['tmp_name'], $target)) {
            return new WP_Error('move_failed', 'Could not store uploaded CSV.');
        }

        return array(
            'file' => $target,
            'original_name' => sanitize_file_name($file['name']),
        );
    }

    public static function get_motorock_categories() {
        $terms = get_terms(array(
            'taxonomy' => 'product_cat',
            'hide_empty' => false,
            'orderby' => 'name',
        ));

        if (is_wp_error($terms)) {
            return array();
        }

        $categories = array();
        foreach ($terms as $term) {
            $categories[] = array(
                'id' => (int) $term->term_id,
                'name' => $term->name,
                'slug' => $term->slug,
            );
        }

        return $categories;
    }

    public static function collect_source_categories(array $rows, $column = 'category_name') {
        $names = array();
        foreach ($rows as $row) {
            $name = isset($row[$column]) ? trim((string) $row[$column]) : '';
            if ($name !== '') {
                $names[$name] = true;
            }
        }

        $list = array_keys($names);
        sort($list);
        return $list;
    }
}
