<?php

if (!defined('ABSPATH')) {
    exit;
}

class Shopify_Importer_Product_Importer {

    const BATCH_SIZE = 1;

    private $site;
    private $site_id;
    private $api;
    private $logger;
    private $brand_handler;
    private $attribute_handler;
    private $variation_creator;
    private $image_downloader;
    private $category_mappings;
    private $product_collection_map;
    private $default_category_id;
    private $brand_name;
    private $price_multiplier;
    private $batch_log = array();
    private $collections_by_id = array();

    public function __construct($site) {
        $this->site = $site;
        $this->site_id = $site['id'];
        $this->api = new Shopify_Importer_API($site['url']);
        $this->brand_handler = new Shopify_Importer_Brand_Handler();
        $this->attribute_handler = new Shopify_Importer_Attribute_Handler();
        $this->variation_creator = new Shopify_Importer_Variation_Creator();
        $this->image_downloader = new Shopify_Importer_Image_Downloader();
        $this->category_mappings = isset($site['category_mappings']) ? $site['category_mappings'] : array();
        $this->product_collection_map = isset($site['product_collection_map']) ? $site['product_collection_map'] : array();
        $this->default_category_id = Shopify_Importer_Site_Manager::get_default_category_id();
        $this->brand_name = isset($site['brand']) ? $site['brand'] : '';
        $this->price_multiplier = Shopify_Importer_Price_Helper::get_multiplier($site);

        foreach (isset($site['collections']) ? $site['collections'] : array() as $collection) {
            if (!empty($collection['id'])) {
                $this->collections_by_id[(string) $collection['id']] = $collection;
            }
        }
    }

    public function import_batch($page = 1, $batch = 0, $session_key = '') {
        if (function_exists('wc_set_time_limit')) {
            wc_set_time_limit(120);
        } else {
            @set_time_limit(120);
        }

        if (empty($session_key)) {
            $session_key = 'shopify_import_' . $this->site_id . '_' . wp_generate_password(8, false);
        }

        $session = $this->get_session($session_key);

        if ($page === 1 && $batch === 0 && empty($session['started'])) {
            $logger = new Shopify_Importer_Logger($this->site_id);
            $session = array(
                'started' => true,
                'pages' => array(),
                'stats' => array(
                    'imported' => 0,
                    'skipped' => 0,
                    'failed' => 0,
                    'processed' => 0,
                ),
                'log_file' => $logger->get_log_file(),
            );
            $this->logger = $logger;
            $this->log_line('Starting import for site: ' . $this->site['name']);
        } else {
            $log_file = isset($session['log_file']) ? $session['log_file'] : '';
            $this->logger = new Shopify_Importer_Logger($this->site_id, $log_file);
        }

        $stats = isset($session['stats']) ? $session['stats'] : array(
            'imported' => 0,
            'skipped' => 0,
            'failed' => 0,
            'processed' => 0,
        );

        $this->batch_log = array();
        $products = $this->get_products_page($page, $session_key, $session);
        $offset = $batch * self::BATCH_SIZE;
        $batch_products = array_slice($products, $offset, self::BATCH_SIZE);

        foreach ($batch_products as $shopify_product) {
            $stats['processed']++;
            try {
                $this->process_product($shopify_product, $stats);
            } catch (Throwable $e) {
                $stats['failed']++;
                $label = isset($shopify_product['title']) ? $shopify_product['title'] : 'unknown';
                $this->log_line('Failed ' . $label . ': ' . $e->getMessage(), 'ERROR');
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
            'imported' => $stats['imported'],
            'skipped' => $stats['skipped'],
            'failed' => $stats['failed'],
            'processed' => $stats['processed'],
            'has_more' => $has_more,
            'next_page' => $has_more_in_page ? $page : ($api_has_more ? $page + 1 : $page),
            'next_batch' => $has_more_in_page ? $batch + 1 : 0,
            'log' => $this->batch_log,
            'log_url' => $this->logger->get_log_url(),
        );

        if (!$has_more) {
            $drafted = Shopify_Importer_Product_Sync::draft_stale_products($this->site_id);
            $this->log_line('Import complete. Imported: ' . $stats['imported'] . ', Skipped: ' . $stats['skipped'] . ', Failed: ' . $stats['failed'] . ', Drafted stale: ' . $drafted);

            Shopify_Importer_Site_Manager::update_site($this->site_id, array(
                'last_import_at' => current_time('mysql'),
                'last_import_stats' => $stats,
                'last_stale_drafted' => $drafted,
            ));

            $this->delete_session($session_key, $session);
            $response['complete'] = true;
        }

        return $response;
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

    public function run_full_import() {
        $page = 1;
        $batch = 0;
        $session_key = 'cron_' . $this->site_id . '_' . time();
        $has_more = true;
        $result = array();

        while ($has_more) {
            $result = $this->import_batch($page, $batch, $session_key);
            $has_more = !empty($result['has_more']);
            $page = $result['next_page'];
            $batch = $result['next_batch'];
        }

        return $result;
    }

    private function process_product($shopify_product, &$stats) {
        $collection_ids = $this->get_product_collection_ids($shopify_product['id']);
        $product_data = Shopify_Importer_JSON_Mapper::map_product($shopify_product, $collection_ids);
        $product_data = Shopify_Importer_Price_Helper::apply_to_product_data($product_data, $this->price_multiplier);
        $sku_label = $this->get_product_sku_label($shopify_product, $product_data);

        if (!$product_data) {
            $stats['skipped']++;
            $this->log_line('Skipped ' . $sku_label . ' - ' . $shopify_product['title'] . ' (unpublished/unavailable/no SKU)', 'SKIP');
            return;
        }

        $sku_label = $this->get_product_sku_label($shopify_product, $product_data);

        if ($this->any_sku_exists($product_data)) {
            $existing_id = $this->find_existing_product_id($product_data);
            if ($existing_id) {
                $this->tag_existing_product($existing_id, $product_data);
                $this->log_line('Tagged existing ' . $sku_label . ' - ' . $product_data['name'], 'INFO');
            }

            $stats['skipped']++;
            $this->log_line('Skipped ' . $sku_label . ' - ' . $product_data['name'] . ' (SKU exists)', 'SKIP');
            return;
        }

        if (!$product_data['is_simple'] && !empty($product_data['sku']) && $this->parent_sku_exists($product_data['sku'])) {
            $existing_id = $this->get_product_id_by_sku($product_data['sku']);
            if ($existing_id) {
                $this->tag_existing_product($existing_id, $product_data);
                $this->log_line('Tagged existing ' . $sku_label . ' - ' . $product_data['name'], 'INFO');
            }

            $stats['skipped']++;
            $this->log_line('Skipped ' . $sku_label . ' - ' . $product_data['name'] . ' (parent SKU exists)', 'SKIP');
            return;
        }

        $this->log_line('Importing ' . $sku_label . ' - ' . $product_data['name']);

        try {
            $product_id = $product_data['is_simple']
                ? $this->create_simple_product($product_data)
                : $this->create_variable_product($product_data);

            if ($product_id) {
                $stats['imported']++;
                $this->log_line('Imported ' . $sku_label . ' - ' . $product_data['name'] . ' (ID ' . $product_id . ')', 'OK');
            } else {
                $stats['failed']++;
                $this->log_line('Failed ' . $sku_label . ' - ' . $product_data['name'], 'ERROR');
            }
        } catch (Throwable $e) {
            $stats['failed']++;
            $this->log_line('Failed ' . $sku_label . ' - ' . $product_data['name'] . ': ' . $e->getMessage(), 'ERROR');
        }
    }

    private function parent_sku_exists($sku) {
        return $this->sku_exists($sku);
    }

    private function log_line($message, $level = 'INFO') {
        $this->batch_log[] = $this->logger->log($message, $level);
    }

    private function get_product_sku_label($shopify_product, $product_data = null) {
        if (!empty($product_data['sku'])) {
            return $product_data['sku'];
        }

        if (!empty($product_data['variations'][0]['sku'])) {
            return $product_data['variations'][0]['sku'];
        }

        if (!empty($shopify_product['variants'][0]['sku'])) {
            return $shopify_product['variants'][0]['sku'];
        }

        return 'ID:' . $shopify_product['id'];
    }

    private function get_product_collection_ids($product_id) {
        if (isset($this->product_collection_map[$product_id])) {
            return $this->product_collection_map[$product_id];
        }

        $key = (string) $product_id;
        if (isset($this->product_collection_map[$key])) {
            return $this->product_collection_map[$key];
        }

        return array();
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

    private function any_sku_exists($product_data) {
        if ($product_data['is_simple']) {
            return $this->sku_exists($product_data['sku']);
        }

        foreach ($product_data['variations'] as $variation) {
            if ($this->sku_exists($variation['sku'])) {
                return true;
            }
        }

        return false;
    }

    private function sku_exists($sku) {
        if (empty($sku)) {
            return false;
        }

        return !empty($this->get_product_id_by_sku($sku));
    }

    private function get_product_id_by_sku($sku) {
        if (empty($sku)) {
            return 0;
        }

        global $wpdb;
        return (int) $wpdb->get_var($wpdb->prepare(
            "SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key='_sku' AND meta_value=%s LIMIT 1",
            $sku
        ));
    }

    private function find_existing_product_id($product_data) {
        if ($product_data['is_simple']) {
            return $this->get_product_id_by_sku($product_data['sku']);
        }

        foreach ($product_data['variations'] as $variation) {
            $product_id = $this->get_product_id_by_sku($variation['sku']);
            if ($product_id) {
                $product = wc_get_product($product_id);
                if ($product && $product->get_parent_id()) {
                    return (int) $product->get_parent_id();
                }
                return $product_id;
            }
        }

        if (!empty($product_data['sku'])) {
            return $this->get_product_id_by_sku($product_data['sku']);
        }

        return 0;
    }

    private function get_collection_meta($collection_id) {
        $key = (string) $collection_id;
        return isset($this->collections_by_id[$key]) ? $this->collections_by_id[$key] : null;
    }

    private function is_catch_all_collection($collection_id) {
        $meta = $this->get_collection_meta($collection_id);
        if (!$meta) {
            return false;
        }

        return Shopify_Importer_Site_Manager::is_catch_all_collection($meta);
    }

    private function get_mapped_category_id($collection_id) {
        $key = (string) $collection_id;

        if (isset($this->category_mappings[$collection_id]) && !empty($this->category_mappings[$collection_id])) {
            return (int) $this->category_mappings[$collection_id];
        }

        if (isset($this->category_mappings[$key]) && !empty($this->category_mappings[$key])) {
            return (int) $this->category_mappings[$key];
        }

        return 0;
    }

    private function get_category_label($category_ids) {
        $labels = array();

        foreach ($category_ids as $category_id) {
            $term = get_term((int) $category_id, 'product_cat');
            if ($term && !is_wp_error($term)) {
                $labels[] = $term->name;
            } else {
                $labels[] = 'ID ' . $category_id;
            }
        }

        return implode(', ', $labels);
    }

    private function resolve_category_ids($collection_ids) {
        $category_ids = array();
        $sources = array();

        foreach ($collection_ids as $collection_id) {
            if ($this->is_catch_all_collection($collection_id)) {
                continue;
            }

            $mapped_id = $this->get_mapped_category_id($collection_id);
            if (!$mapped_id) {
                continue;
            }

            $category_ids[] = $mapped_id;

            $meta = $this->get_collection_meta($collection_id);
            $sources[] = $meta ? $meta['title'] : (string) $collection_id;
        }

        $category_ids = array_values(array_unique(array_filter($category_ids)));
        $used_default = false;

        if (empty($category_ids) && $this->default_category_id) {
            $category_ids[] = $this->default_category_id;
            $used_default = true;
        }

        return array(
            'category_ids' => $category_ids,
            'sources' => $sources,
            'used_default' => $used_default,
        );
    }

    private function set_categories($product_id, $product_data) {
        $result = $this->resolve_category_ids($product_data['collection_ids']);
        $category_ids = $result['category_ids'];

        if (!empty($category_ids)) {
            wp_set_object_terms($product_id, $category_ids, 'product_cat');
        }

        if ($result['used_default']) {
            $this->log_line('Category: ' . $this->get_category_label($category_ids) . ' (default)', 'INFO');
        } elseif (!empty($result['sources'])) {
            $this->log_line(
                'Category: ' . $this->get_category_label($category_ids) . ' via ' . implode(', ', $result['sources']),
                'INFO'
            );
        }
    }

    private function set_import_meta($product_id, $product_data) {
        update_post_meta($product_id, '_import_source', 'shopify');
        update_post_meta($product_id, '_shopify_product_id', $product_data['id']);
        update_post_meta($product_id, '_shopify_site_id', $this->site_id);
        update_post_meta($product_id, '_shopify_import_date', current_time('mysql'));
        Shopify_Importer_Product_Sync::mark_product_seen($product_id);
    }

    private function apply_product_brand($product_id, $product_data, $force = false) {
        $brand_name = $this->brand_handler->resolve_brand_for_import(
            $this->brand_name,
            isset($product_data['name']) ? $product_data['name'] : '',
            isset($product_data['sku']) ? $product_data['sku'] : '',
            isset($product_data['handle']) ? $product_data['handle'] : ''
        );

        if ($brand_name === null && $product_id) {
            $product = wc_get_product($product_id);
            if ($product) {
                $brand_name = $this->brand_handler->infer_brand_from_product_data(
                    $product->get_name(),
                    $product->get_sku(),
                    $product->get_slug(),
                    $product_id
                );
            }
        }

        if ($brand_name === null) {
            return false;
        }

        return $this->brand_handler->ensure_product_brand(
            $product_id,
            $brand_name,
            $this->logger,
            $force
        );
    }

    private function tag_existing_product($product_id, $product_data) {
        $product_id = $this->normalize_product_id_for_meta($product_id);
        if (!$product_id) {
            return;
        }

        $this->apply_product_brand($product_id, $product_data);

        update_post_meta($product_id, '_import_source', 'shopify');
        update_post_meta($product_id, '_shopify_product_id', $product_data['id']);
        update_post_meta($product_id, '_shopify_site_id', $this->site_id);

        if (!get_post_meta($product_id, '_shopify_import_date', true)) {
            update_post_meta($product_id, '_shopify_import_date', current_time('mysql'));
        }

        Shopify_Importer_Product_Sync::mark_product_seen($product_id);
    }

    private function normalize_product_id_for_meta($product_id) {
        $product_id = (int) $product_id;
        if (!$product_id) {
            return 0;
        }

        $product = wc_get_product($product_id);
        if ($product && $product->is_type('variation')) {
            return (int) $product->get_parent_id();
        }

        return $product_id;
    }

    private function mark_shopify_product_seen($product_id) {
        $product_id = (int) $product_id;
        if (!$product_id) {
            return;
        }

        $source = get_post_meta($product_id, '_import_source', true);
        if ($source && $source !== 'shopify') {
            return;
        }

        $site_id = get_post_meta($product_id, '_shopify_site_id', true);
        if ($site_id && $site_id !== $this->site_id) {
            return;
        }

        Shopify_Importer_Product_Sync::mark_product_seen($product_id);
    }

    private function create_simple_product($product_data) {
        $product = new WC_Product_Simple();
        $product->set_name($product_data['name']);
        $product->set_description($product_data['description']);
        $product->set_status('publish');
        $product->set_sku($product_data['sku']);
        $product->set_regular_price($product_data['price']);
        $product->set_price($product_data['price']);
        $product->set_stock_status('instock');
        $product->set_manage_stock(false);

        $product_id = $product->save();
        if (!$product_id) {
            return false;
        }

        $this->set_categories($product_id, $product_data);
        $this->apply_product_brand($product_id, $product_data, true);
        $this->image_downloader->set_product_images($product_id, $product_data['images']);
        update_post_meta($product_id, '_recommended_price', $product_data['price']);
        $this->set_import_meta($product_id, $product_data);

        return $product_id;
    }

    private function create_variable_product($product_data) {
        $product = new WC_Product_Variable();
        $product->set_name($product_data['name']);
        $product->set_description($product_data['description']);
        $product->set_status('publish');

        if (!empty($product_data['sku'])) {
            $product->set_sku($product_data['sku']);
        }

        $product->set_stock_status('instock');
        $product->set_manage_stock(false);

        $product_id = $product->save();
        if (!$product_id) {
            return false;
        }

        wp_set_object_terms($product_id, 'variable', 'product_type');

        $this->set_categories($product_id, $product_data);
        $this->apply_product_brand($product_id, $product_data, true);

        if (!empty($product_data['images'])) {
            $this->image_downloader->set_product_images($product_id, $product_data['images']);
        }

        $attribute_data = array();
        foreach ($product_data['variations'] as $variation) {
            if (empty($variation['attributes'])) {
                continue;
            }
            foreach ($variation['attributes'] as $attr) {
                if (!isset($attribute_data[$attr['name']])) {
                    $attribute_data[$attr['name']] = array();
                }
                if (!in_array($attr['option'], $attribute_data[$attr['name']], true)) {
                    $attribute_data[$attr['name']][] = $attr['option'];
                }
            }
        }

        if (!empty($attribute_data)) {
            $this->attribute_handler->set_product_attributes($product_id, $attribute_data);
            $this->apply_product_brand($product_id, $product_data, true);
        }

        $created_variations = $this->variation_creator->create_variations_from_data($product_id, $product_data['variations']);

        if (empty($created_variations)) {
            wp_delete_post($product_id, true);
            throw new Exception('No variations could be created.');
        }

        $this->set_import_meta($product_id, $product_data);

        WC_Product_Variable::sync($product_id);
        $product = wc_get_product($product_id);
        if ($product) {
            $product->save();
        }

        return $product_id;
    }
}
