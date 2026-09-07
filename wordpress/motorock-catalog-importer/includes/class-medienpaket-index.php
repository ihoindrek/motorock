<?php

if (!defined('ABSPATH')) {
    exit;
}

class Motorock_Catalog_Importer_Medienpaket_Index {

    const SCHEME = 'motorock-medienpaket://';

    /** @var array<string, array>|null */
    private static $index = null;

    /** @var string */
    private $cache_file;

    /** @var string */
    private $base_dir;

    public function __construct() {
        $upload_dir = wp_upload_dir();
        $base = trailingslashit($upload_dir['basedir']) . 'motorock-catalog-importer';
        $this->base_dir = trailingslashit($base) . 'medienpaket';
        $cache_dir = trailingslashit($base) . 'cache';

        if (!file_exists($cache_dir)) {
            wp_mkdir_p($cache_dir);
        }

        $this->cache_file = trailingslashit($cache_dir) . 'johndoe-medienpaket-index.json';
    }

    public static function base_dir() {
        $upload_dir = wp_upload_dir();
        return trailingslashit($upload_dir['basedir']) . 'motorock-catalog-importer/medienpaket';
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
     * @return array{images: string[], short_description: string, description_html: string, video_url: string}|null
     */
    public function lookup($art_nr, $parent_sku = '') {
        $index = $this->get_index();
        $keys = array_filter(array(strtoupper((string) $art_nr), strtoupper((string) $parent_sku)));

        foreach ($keys as $key) {
            if ($key !== '' && isset($index[$key])) {
                return $this->normalize_payload($index[$key]);
            }
        }

        foreach ($index as $indexed_key => $payload) {
            foreach ($keys as $key) {
                if ($key !== '' && (strpos($indexed_key, $key) === 0 || strpos($key, $indexed_key) === 0)) {
                    return $this->normalize_payload($payload);
                }
            }
        }

        return null;
    }

    public function to_image_src($relative_path) {
        $relative_path = ltrim(str_replace('\\', '/', (string) $relative_path), '/');
        if ($relative_path === '') {
            return '';
        }

        return self::SCHEME . $relative_path;
    }

    private function normalize_payload(array $payload) {
        $images = isset($payload['images']) && is_array($payload['images']) ? $payload['images'] : array();
        $image_srcs = array();

        foreach ($images as $relative_path) {
            $src = $this->to_image_src($relative_path);
            if ($src !== '') {
                $image_srcs[] = $src;
            }
        }

        $video_url = '';
        if (!empty($payload['videoUrl'])) {
            $video_url = $this->resolve_video_url((string) $payload['videoUrl']);
        } elseif (!empty($payload['video_url'])) {
            $video_url = $this->resolve_video_url((string) $payload['video_url']);
        }

        return array(
            'images' => $image_srcs,
            'short_description' => '',
            'description_html' => '',
            'video_url' => $video_url,
        );
    }

    private function resolve_video_url($raw) {
        $raw = trim(html_entity_decode((string) $raw, ENT_QUOTES, 'UTF-8'));
        if ($raw === '') {
            return '';
        }

        $is_http = (bool) preg_match('#^https?://#i', $raw);
        if ($is_http) {
            $sanitized = Motorock_Catalog_Importer_Product_Video::sanitize_url($raw);
            if ($sanitized !== '') {
                return $sanitized;
            }
        }

        $normalized = str_replace('\\', '/', $raw);
        $relative = '';

        if (preg_match('#(ridejohndoe_[^/]+/[^/]+/03_Video/.+)$#', $normalized, $match)) {
            $relative = $match[1];
        } elseif (preg_match('#([A-Z0-9-]+_[^/]+/03_Video/.+)$#', $normalized, $match)) {
            $relative = $match[1];
        } elseif (preg_match('#motorock-catalog-importer/medienpaket/(.+)$#', $normalized, $match)) {
            $relative = $match[1];
        }

        $relative = ltrim($relative, '/');
        if ($relative === '') {
            return '';
        }

        $path = trailingslashit(self::base_dir()) . $relative;
        if (!file_exists($path)) {
            return '';
        }

        $upload_dir = wp_upload_dir();
        $public_url = trailingslashit($upload_dir['baseurl']) . 'motorock-catalog-importer/medienpaket/' . $relative;

        return Motorock_Catalog_Importer_Product_Video::sanitize_url($public_url);
    }
}
