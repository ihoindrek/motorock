<?php

if (!defined('ABSPATH')) {
    exit;
}

class Shopify_Importer_API {

    private $base_url;

    public function __construct($base_url) {
        $this->base_url = rtrim($base_url, '/');
    }

    public static function normalize_url($url) {
        $url = trim($url);
        if (empty($url)) {
            return false;
        }

        if (!preg_match('#^https?://#i', $url)) {
            $url = 'https://' . $url;
        }

        $parts = wp_parse_url($url);
        if (empty($parts['host'])) {
            return false;
        }

        return 'https://' . $parts['host'];
    }

    public function test_connection() {
        $response = $this->request($this->base_url . '/collections.json?limit=1');
        return !empty($response) && isset($response['collections']);
    }

    public function fetch_all_collections() {
        $all = array();
        $page = 1;

        while (true) {
            $response = $this->request($this->base_url . '/collections.json?limit=250&page=' . $page);
            if (empty($response) || empty($response['collections'])) {
                break;
            }

            foreach ($response['collections'] as $collection) {
                $all[] = array(
                    'id' => $collection['id'],
                    'title' => $collection['title'],
                    'handle' => $collection['handle'],
                    'products_count' => isset($collection['products_count']) ? (int) $collection['products_count'] : 0,
                );
            }

            if (count($response['collections']) < 250) {
                break;
            }

            $page++;
        }

        usort($all, function ($a, $b) {
            return strcasecmp($a['title'], $b['title']);
        });

        return $all;
    }

    public function fetch_products_page($page = 1) {
        $response = $this->request($this->base_url . '/products.json?limit=250&page=' . $page);
        if (empty($response) || !isset($response['products'])) {
            return array('products' => array(), 'has_more' => false);
        }

        return array(
            'products' => $response['products'],
            'has_more' => count($response['products']) === 250,
        );
    }

    public function build_product_collection_map($collections) {
        $map = array();

        foreach ($collections as $collection) {
            if (empty($collection['handle']) || empty($collection['products_count'])) {
                continue;
            }

            $page = 1;
            while (true) {
                $url = $this->base_url . '/collections/' . rawurlencode($collection['handle']) . '/products.json?limit=250&page=' . $page;
                $response = $this->request($url);

                if (empty($response) || empty($response['products'])) {
                    break;
                }

                foreach ($response['products'] as $product) {
                    $product_id = $product['id'];
                    if (!isset($map[$product_id])) {
                        $map[$product_id] = array();
                    }
                    if (!in_array($collection['id'], $map[$product_id], true)) {
                        $map[$product_id][] = $collection['id'];
                    }
                }

                if (count($response['products']) < 250) {
                    break;
                }

                $page++;
            }
        }

        return $map;
    }

    private function request($url) {
        $response = wp_remote_get($url, array(
            'timeout' => 60,
            'headers' => array(
                'Accept' => 'application/json',
                'User-Agent' => 'ShopifyImporter/1.0',
            ),
        ));

        if (is_wp_error($response)) {
            return false;
        }

        $code = wp_remote_retrieve_response_code($response);
        if ($code !== 200) {
            return false;
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        return is_array($data) ? $data : false;
    }
}
