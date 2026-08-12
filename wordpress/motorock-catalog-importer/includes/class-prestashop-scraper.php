<?php

if (!defined('ABSPATH')) {
    exit;
}

class Motorock_Catalog_Importer_Prestashop_Scraper {

    /** @var string */
    private $cache_dir;

    public function __construct() {
        $upload_dir = wp_upload_dir();
        $this->cache_dir = trailingslashit($upload_dir['basedir']) . 'motorock-catalog-importer/cache';
        if (!file_exists($this->cache_dir)) {
            wp_mkdir_p($this->cache_dir);
        }
    }

    public function scrape($url) {
        $page_url = $this->normalize_url($url);
        $cache_file = $this->cache_dir . '/' . sha1($page_url) . '.json';

        if (file_exists($cache_file)) {
            $cached = json_decode(file_get_contents($cache_file), true);
            if (is_array($cached)) {
                return $cached;
            }
        }

        $response = wp_remote_get($page_url, array(
            'timeout' => 30,
            'user-agent' => 'MotorockCatalogImporter/0.1 (+https://motorock.eu)',
        ));

        if (is_wp_error($response)) {
            throw new RuntimeException($response->get_error_message());
        }

        $code = (int) wp_remote_retrieve_response_code($response);
        if ($code < 200 || $code >= 300) {
            throw new RuntimeException('HTTP ' . $code . ' for ' . $page_url);
        }

        $html = wp_remote_retrieve_body($response);
        $payload = array(
            'url' => $page_url,
            'images' => $this->extract_images($html),
            'short_description' => $this->extract_short_description($html),
            'description_html' => $this->extract_description_html($html),
        );

        file_put_contents($cache_file, wp_json_encode($payload));
        return $payload;
    }

    private function normalize_url($url) {
        $url = trim((string) $url);
        $url = preg_replace('/#.*$/', '', $url);
        return rtrim($url, '#');
    }

    private function extract_images($html) {
        $matches = array();
        preg_match_all(
            '/content="(https:\/\/www\.holyfreedom\.com\/\d+-large_default\/[^"]+)"/',
            $html,
            $matches
        );

        if (empty($matches[1])) {
            return array();
        }

        return array_values(array_unique($matches[1]));
    }

    private function extract_short_description($html) {
        if (preg_match('/property="og:description"\s+content="([^"]+)"/i', $html, $match)) {
            return $this->sanitize_short_description(
                html_entity_decode($match[1], ENT_QUOTES, 'UTF-8')
            );
        }

        if (preg_match('/class="rte-content product-description"[^>]*>(.*?)<\/div>/is', $html, $match)) {
            return $this->sanitize_short_description(
                wp_trim_words(wp_strip_all_tags($match[1]), 40, '…')
            );
        }

        return '';
    }

    private function sanitize_short_description($text) {
        $text = trim(preg_replace('/\s+/u', ' ', (string) $text));
        if ($text === '') {
            return '';
        }

        $pattern = '/[\s,]+(?:Discover|Shop(?:\s+now)?|Learn\s+more|Read\s+more)\.?$/iu';

        while (preg_match($pattern, $text)) {
            $text = trim(preg_replace($pattern, '', $text));
        }

        return rtrim($text, ', ');
    }

    private function extract_description_html($html) {
        if (preg_match('/id="description"[\s\S]*?<div class="product-description">([\s\S]*?)<\/div>\s*<\/div>/i', $html, $match)) {
            return wp_kses_post($this->sanitize_description_html($match[1]));
        }

        $short = $this->extract_short_description($html);
        return $short !== '' ? '<p>' . esc_html($short) . '</p>' : '';
    }

    private function sanitize_description_html($html) {
        $allowed = array(
            'p' => array(),
            'br' => array(),
            'strong' => array(),
            'em' => array(),
            'ul' => array(),
            'ol' => array(),
            'li' => array(),
            'h3' => array(),
            'h4' => array(),
            'a' => array('href' => array(), 'target' => array(), 'rel' => array()),
        );

        return wp_kses($html, $allowed);
    }
}
