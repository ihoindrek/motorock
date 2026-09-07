<?php

if (!defined('ABSPATH')) {
    exit;
}

class Motorock_Catalog_Importer_Product_Video {

    const META_KEY = 'product_video_url';

    /**
     * Normalize a storefront-ready product video URL (Vimeo, YouTube, or direct file).
     */
    public static function sanitize_url($url) {
        $url = trim(html_entity_decode((string) $url, ENT_QUOTES, 'UTF-8'));
        if ($url === '') {
            return '';
        }

        if (preg_match('/^\d+$/', $url)) {
            return 'https://vimeo.com/' . $url;
        }

        if (preg_match('/(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)(\d+)/i', $url, $match)) {
            $normalized = 'https://vimeo.com/' . $match[1];
            if (preg_match('/(?:vimeo\.com\/(?:video\/)?\d+\/|player\.vimeo\.com\/video\/\d+\/)([a-f0-9]+)/i', $url, $hash)) {
                $normalized .= '/' . $hash[1];
            }

            return esc_url_raw($normalized);
        }

        if (preg_match('/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/i', $url, $match)) {
            return esc_url_raw('https://www.youtube.com/watch?v=' . $match[1]);
        }

        if (preg_match('/\.(mp4|webm|mov|m4v|ogv)(?:$|[?#])/i', $url)) {
            return esc_url_raw($url);
        }

        return '';
    }

    /**
     * @return array<string, string>
     */
    public static function meta_from_product_data(array $data) {
        $url = '';

        if (!empty($data['video_url'])) {
            $url = (string) $data['video_url'];
        } elseif (!empty($data['meta'][self::META_KEY])) {
            $url = (string) $data['meta'][self::META_KEY];
        }

        $sanitized = self::sanitize_url($url);
        if ($sanitized === '') {
            return array();
        }

        return array(self::META_KEY => $sanitized);
    }

    /**
     * Read a video URL column from supplier CSV rows.
     */
    public static function url_from_row(array $row) {
        foreach (array('product_video_url', 'Video_URL', 'video_url', 'Video Url', 'video') as $key) {
            if (!empty($row[$key])) {
                return self::sanitize_url($row[$key]);
            }
        }

        return '';
    }
}
