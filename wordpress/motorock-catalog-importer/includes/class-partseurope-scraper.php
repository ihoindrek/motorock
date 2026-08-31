<?php

if (!defined('ABSPATH')) {
    exit;
}

class Motorock_Catalog_Importer_PartsEurope_Scraper {

    /** @var array<string, array>|null */
    private static $index = null;

    /** @var string */
    private $cache_file;

    public function __construct() {
        $upload_dir = wp_upload_dir();
        $cache_dir = trailingslashit($upload_dir['basedir']) . 'motorock-catalog-importer/cache';
        if (!file_exists($cache_dir)) {
            wp_mkdir_p($cache_dir);
        }
        $this->cache_file = trailingslashit($cache_dir) . 'johndoe-partseurope-index.json';
    }

    /**
     * @return array<string, array>
     */
    public function get_index() {
        if (self::$index !== null) {
            return self::$index;
        }

        if (!file_exists($this->cache_file)) {
            self::$index = array();
            return self::$index;
        }

        $decoded = json_decode((string) file_get_contents($this->cache_file), true);
        self::$index = is_array($decoded) ? $decoded : array();
        return self::$index;
    }

    /**
     * @return array{images: string[], short_description: string, description_html: string}|null
     */
    public function lookup($art_nr, $parent_sku = '') {
        $index = $this->get_index();
        $keys = array_filter(array(strtoupper((string) $art_nr), strtoupper((string) $parent_sku)));

        foreach ($keys as $key) {
            if ($key !== '' && isset($index[$key])) {
                return $this->normalize_payload($index[$key]);
            }
        }

        foreach ($index as $indexed_part => $payload) {
            foreach ($keys as $key) {
                if ($key !== '' && (strpos($indexed_part, $key) === 0 || strpos($key, $indexed_part) === 0)) {
                    return $this->normalize_payload($payload);
                }
            }
        }

        return null;
    }

    private function normalize_payload(array $payload) {
        $images = isset($payload['images']) && is_array($payload['images']) ? $payload['images'] : array();
        $description = isset($payload['description']) ? (string) $payload['description'] : '';
        $short = isset($payload['shortDescription']) ? (string) $payload['shortDescription'] : $description;

        return array(
            'images' => $images,
            'short_description' => wp_strip_all_tags($short),
            'description_html' => $description !== '' ? wpautop(esc_html($description)) : '',
        );
    }
}
