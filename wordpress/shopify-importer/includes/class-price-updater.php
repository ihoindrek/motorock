<?php

if (!defined('ABSPATH')) {
    exit;
}

class Shopify_Importer_Price_Updater {

    const BATCH_SIZE = 10;

    private $site;
    private $site_id;
    private $api;
    private $logger;
    private $price_multiplier;
    private $batch_log = array();

    public function __construct($site) {
        $this->site = $site;
        $this->site_id = $site['id'];
        $this->api = new Shopify_Importer_API($site['url']);
        $this->price_multiplier = Shopify_Importer_Price_Helper::get_multiplier($site);
    }

    public function update_batch($page = 1, $batch = 0, $session_key = '') {
        if (function_exists('wc_set_time_limit')) {
            wc_set_time_limit(120);
        } else {
            @set_time_limit(120);
        }

        if (empty($session_key)) {
            $session_key = 'shopify_prices_' . $this->site_id . '_' . wp_generate_password(8, false);
        }

        $session = $this->get_session($session_key);

        if ($page === 1 && $batch === 0 && empty($session['started'])) {
            $logger = new Shopify_Importer_Logger($this->site_id . '-prices');
            $session = array(
                'started' => true,
                'pages' => array(),
                'stats' => array(
                    'updated' => 0,
                    'skipped' => 0,
                    'unchanged' => 0,
                    'processed' => 0,
                ),
                'log_file' => $logger->get_log_file(),
            );
            $this->logger = $logger;
            $this->log_line(
                'Starting price update for site: ' . $this->site['name'] .
                ' (multiplier: ' . $this->price_multiplier . ')'
            );
        } else {
            $log_file = isset($session['log_file']) ? $session['log_file'] : '';
            $this->logger = new Shopify_Importer_Logger($this->site_id . '-prices', $log_file);
        }

        $stats = isset($session['stats']) ? $session['stats'] : array(
            'updated' => 0,
            'skipped' => 0,
            'unchanged' => 0,
            'processed' => 0,
        );

        $this->batch_log = array();
        $products = $this->get_products_page($page, $session_key, $session);
        $offset = $batch * self::BATCH_SIZE;
        $batch_products = array_slice($products, $offset, self::BATCH_SIZE);

        foreach ($batch_products as $shopify_product) {
            $stats['processed']++;
            try {
                $this->process_product_prices($shopify_product, $stats);
            } catch (Throwable $e) {
                $stats['skipped']++;
                $title = isset($shopify_product['title']) ? $shopify_product['title'] : 'unknown';
                $this->log_line('Failed ' . $title . ': ' . $e->getMessage(), 'ERROR');
            }
        }

        $session['stats'] = $stats;
        $this->save_session($session_key, $session);

        $page_count = count($products);
        $api_has_more = !empty($session['pages'][$page]['has_more']);
        $has_more_in_page = ($offset + self::BATCH_SIZE) < $page_count;
        $has_more = $has_more_in_page || (!$has_more_in_page && $api_has_more);

        $response = array(
            'session_key' => $session_key,
            'page' => $page,
            'batch' => $batch,
            'updated' => $stats['updated'],
            'skipped' => $stats['skipped'],
            'unchanged' => $stats['unchanged'],
            'processed' => $stats['processed'],
            'has_more' => $has_more,
            'next_page' => $has_more_in_page ? $page : ($api_has_more ? $page + 1 : $page),
            'next_batch' => $has_more_in_page ? $batch + 1 : 0,
            'log' => $this->batch_log,
            'log_url' => $this->logger->get_log_url(),
        );

        if (!$has_more) {
            $this->log_line(
                'Price update complete. Updated: ' . $stats['updated'] .
                ', Unchanged: ' . $stats['unchanged'] .
                ', Skipped: ' . $stats['skipped']
            );

            Shopify_Importer_Site_Manager::update_site($this->site_id, array(
                'last_price_update_at' => current_time('mysql'),
                'last_price_update_stats' => $stats,
            ));

            $this->delete_session($session_key, $session);
            $response['complete'] = true;
        }

        return $response;
    }

    private function process_product_prices($shopify_product, &$stats) {
        $sku_prices = $this->extract_sku_prices($shopify_product);
        if (empty($sku_prices)) {
            $stats['skipped']++;
            return;
        }

        $updated_count = 0;
        $unchanged_count = 0;
        $skipped_count = 0;
        $parent_ids = array();

        foreach ($sku_prices as $sku => $price) {
            $result = $this->update_price_for_sku($sku, $price, $parent_ids);

            if ($result === 'updated') {
                $updated_count++;
            } elseif ($result === 'unchanged') {
                $unchanged_count++;
            } else {
                $skipped_count++;
            }
        }

        foreach (array_keys($parent_ids) as $parent_id) {
            WC_Product_Variable::sync($parent_id);
            $parent = wc_get_product($parent_id);
            if ($parent) {
                $parent->save();
            }
        }

        $stats['updated'] += $updated_count;
        $stats['unchanged'] += $unchanged_count;
        $stats['skipped'] += $skipped_count > 0 && $updated_count === 0 && $unchanged_count === 0 ? 1 : 0;
    }

    private function extract_sku_prices($shopify_product) {
        $sku_prices = array();

        if (empty($shopify_product['variants']) || !is_array($shopify_product['variants'])) {
            return $sku_prices;
        }

        foreach ($shopify_product['variants'] as $variant) {
            if (empty($variant['sku']) || !isset($variant['price'])) {
                continue;
            }

            $sku_prices[$variant['sku']] = Shopify_Importer_Price_Helper::convert(
                $variant['price'],
                $this->price_multiplier
            );
        }

        return $sku_prices;
    }

    private function update_price_for_sku($sku, $price, &$parent_ids) {
        $product_id = $this->get_product_id_by_sku($sku);
        if (!$product_id) {
            return 'skipped';
        }

        $product = wc_get_product($product_id);
        if (!$product) {
            return 'skipped';
        }

        $old_price = wc_format_decimal($product->get_regular_price(), wc_get_price_decimals());
        $new_price = wc_format_decimal($price, wc_get_price_decimals());

        if ($old_price !== $new_price) {
            $product->set_regular_price($new_price);
            $product->set_price($new_price);
            $product->save();
            update_post_meta($product_id, '_recommended_price', $new_price);
            $this->log_line('Updated ' . $sku . ': ' . $old_price . ' → ' . $new_price, 'OK');
        }

        $synced = Shopify_Importer_WPML_Helper::sync_product_price($product_id, $new_price);
        if ($old_price === $new_price && !empty($synced)) {
            $this->log_line('Synced translations for ' . $sku . ' → ' . $new_price, 'OK');
        }

        if ($old_price === $new_price && empty($synced)) {
            return 'unchanged';
        }

        if ($product->is_type('variation')) {
            $parent_ids[(int) $product->get_parent_id()] = true;
        }

        return 'updated';
    }

    private function get_product_id_by_sku($sku) {
        global $wpdb;

        return (int) $wpdb->get_var($wpdb->prepare(
            "SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key='_sku' AND meta_value=%s LIMIT 1",
            $sku
        ));
    }

    private function get_page_cache_dir() {
        $upload_dir = wp_upload_dir();
        $cache_dir = $upload_dir['basedir'] . '/shopify-importer/cache';

        if (!file_exists($cache_dir)) {
            wp_mkdir_p($cache_dir);
        }

        return $cache_dir;
    }

    private function get_page_cache_file($session_key, $page) {
        return $this->get_page_cache_dir() . '/' . sanitize_file_name($session_key . '-page-' . $page . '.json');
    }

    private function load_page_products($cache_file) {
        if (!file_exists($cache_file)) {
            return null;
        }

        $json = file_get_contents($cache_file);
        if ($json === false) {
            return null;
        }

        $products = json_decode($json, true);
        return is_array($products) ? $products : null;
    }

    private function save_page_products($cache_file, $products) {
        file_put_contents($cache_file, wp_json_encode($products));
    }

    private function get_products_page($page, $session_key, &$session) {
        if (!isset($session['pages'][$page])) {
            $result = $this->api->fetch_products_page($page);
            $cache_file = $this->get_page_cache_file($session_key, $page);
            $this->save_page_products($cache_file, $result['products']);
            $session['pages'][$page] = array(
                'cache_file' => $cache_file,
                'has_more' => $result['has_more'],
            );
            $this->save_session($session_key, $session);
        }

        $cache_file = isset($session['pages'][$page]['cache_file'])
            ? $session['pages'][$page]['cache_file']
            : $this->get_page_cache_file($session_key, $page);

        $products = $this->load_page_products($cache_file);
        if ($products === null) {
            $result = $this->api->fetch_products_page($page);
            $this->save_page_products($cache_file, $result['products']);
            $session['pages'][$page]['cache_file'] = $cache_file;
            $session['pages'][$page]['has_more'] = $result['has_more'];
            $this->save_session($session_key, $session);
            $products = $result['products'];
        }

        return $products;
    }

    private function get_session($session_key) {
        $session = get_transient('shopify_import_' . $session_key);
        return is_array($session) ? $session : array();
    }

    private function save_session($session_key, $session) {
        set_transient('shopify_import_' . $session_key, $session, DAY_IN_SECONDS);
    }

    private function delete_session($session_key, $session) {
        delete_transient('shopify_import_' . $session_key);

        if (empty($session['pages']) || !is_array($session['pages'])) {
            return;
        }

        foreach ($session['pages'] as $page_data) {
            if (!empty($page_data['cache_file']) && file_exists($page_data['cache_file'])) {
                @unlink($page_data['cache_file']);
            }
        }
    }

    private function log_line($message, $level = 'INFO') {
        $this->batch_log[] = $this->logger->log($message, $level);
    }
}
