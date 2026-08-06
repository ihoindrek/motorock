<?php

if (!defined('ABSPATH')) {
    exit;
}

class Shopify_Importer_Site_Manager {

    public static function get_all_sites() {
        $sites = get_option(SHOPIFY_IMPORTER_OPTION, array());
        return is_array($sites) ? $sites : array();
    }

    public static function get_site($site_id) {
        $sites = self::get_all_sites();
        return isset($sites[$site_id]) ? $sites[$site_id] : null;
    }

    public static function save_site($site_id, $data) {
        $sites = self::get_all_sites();
        $existing = isset($sites[$site_id]) ? $sites[$site_id] : array();

        $sites[$site_id] = array_merge(array(
            'id' => $site_id,
            'name' => '',
            'url' => '',
            'brand' => '',
            'price_multiplier' => 1,
            'category_mappings' => array(),
            'collections' => array(),
            'product_collection_map' => array(),
            'collections_scanned_at' => '',
            'cron_enabled' => false,
            'cron_interval' => 'daily',
            'last_import_at' => '',
            'last_import_stats' => array(),
            'last_price_update_at' => '',
            'last_price_update_stats' => array(),
            'last_category_update_at' => '',
            'last_category_update_stats' => array(),
            'created_at' => current_time('mysql'),
        ), $existing, $data, array('id' => $site_id));

        update_option(SHOPIFY_IMPORTER_OPTION, $sites);
        return $sites[$site_id];
    }

    public static function update_site($site_id, $data) {
        return self::save_site($site_id, $data);
    }

    public static function delete_site($site_id) {
        $sites = self::get_all_sites();
        unset($sites[$site_id]);
        update_option(SHOPIFY_IMPORTER_OPTION, $sites);
    }

    public static function generate_id($url) {
        $host = wp_parse_url($url, PHP_URL_HOST);
        $host = str_replace('.', '-', strtolower($host));
        return sanitize_key($host);
    }

    public static function get_default_category_id() {
        $default_id = (int) get_option('default_product_cat', 0);
        if ($default_id > 0 && term_exists($default_id, 'product_cat')) {
            return $default_id;
        }

        foreach (array('Uncategorized', 'Other') as $name) {
            $term = get_term_by('name', $name, 'product_cat');
            if ($term && !is_wp_error($term)) {
                return (int) $term->term_id;
            }
        }

        foreach (array('uncategorized', 'other') as $slug) {
            $term = get_term_by('slug', $slug, 'product_cat');
            if ($term && !is_wp_error($term)) {
                return (int) $term->term_id;
            }
        }

        return 0;
    }

    public static function get_default_category_label() {
        $term_id = self::get_default_category_id();
        if (!$term_id) {
            return 'none configured';
        }

        $term = get_term($term_id, 'product_cat');
        if ($term && !is_wp_error($term)) {
            return $term->name;
        }

        return 'ID ' . $term_id;
    }

    public static function is_catch_all_collection($collection) {
        if (empty($collection['handle'])) {
            return false;
        }

        $handle = strtolower($collection['handle']);

        $excluded_handles = apply_filters('shopify_importer_catch_all_handles', array(
            'all-products',
            'all-excluding-core',
            'all-lifestyle-apparel',
            'full-price-items',
            'apparel-footwear-accessories',
            'frontpage',
        ));

        if (in_array($handle, $excluded_handles, true)) {
            return true;
        }

        $patterns = apply_filters('shopify_importer_catch_all_handle_patterns', array(
            '/^gifts-under-/',
            '/^shop-under-/',
            '/-sale$/',
            '/^boxing-day/',
            '/^fathers-day/',
            '/^mothers-day/',
        ));

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $handle)) {
                return true;
            }
        }

        return false;
    }

    public static function get_motorock_categories() {
        $terms = get_terms(array(
            'taxonomy' => 'product_cat',
            'hide_empty' => false,
            'orderby' => 'name',
            'order' => 'ASC',
        ));

        if (is_wp_error($terms)) {
            return array();
        }

        $categories = array();
        foreach ($terms as $term) {
            $categories[] = array(
                'id' => $term->term_id,
                'name' => $term->name,
                'parent' => $term->parent,
            );
        }

        return $categories;
    }

    public static function get_category_dropdown_options($saved_mappings = array()) {
        return self::get_motorock_categories();
    }

    public static function build_category_tree($categories, $parent_id = 0) {
        $tree = array();

        foreach ($categories as $category) {
            if ((int) $category['parent'] === (int) $parent_id) {
                $tree[] = array(
                    'id' => $category['id'],
                    'name' => $category['name'],
                    'children' => self::build_category_tree($categories, $category['id']),
                );
            }
        }

        return $tree;
    }

    public static function render_category_dropdown($collection_id, $selected_value, $categories) {
        $tree = self::build_category_tree($categories);
        $html = '<select class="shopify-category-mapping-select" name="category_mappings[' . esc_attr($collection_id) . ']">';
        $html .= '<option value="">— Default (' . esc_html(self::get_default_category_label()) . ') —</option>';
        $html .= self::generate_options($tree, 0, $selected_value);
        $html .= '</select>';
        return $html;
    }

    private static function generate_options($tree, $level, $selected_value) {
        $html = '';
        $indent = str_repeat('&nbsp;&nbsp;&nbsp;', $level);

        foreach ($tree as $item) {
            $selected = ((string) $item['id'] === (string) $selected_value) ? 'selected' : '';
            $html .= '<option value="' . esc_attr($item['id']) . '" ' . $selected . '>';
            $html .= $indent . esc_html($item['name']);
            $html .= '</option>';

            if (!empty($item['children'])) {
                $html .= self::generate_options($item['children'], $level + 1, $selected_value);
            }
        }

        return $html;
    }

    public static function get_cron_sites() {
        $sites = self::get_all_sites();
        $enabled = array();

        foreach ($sites as $site_id => $site) {
            if (!empty($site['cron_enabled'])) {
                $enabled[$site_id] = $site;
            }
        }

        return $enabled;
    }
}
