<?php

if (!defined('ABSPATH')) {
    exit;
}

class Motorock_Catalog_Importer_Image_Downloader {

    const MAX_IMAGES = 6;

    public function set_product_images($product_id, array $images) {
        if (empty($images)) {
            return false;
        }

        $product = wc_get_product($product_id);
        if (!$product) {
            return false;
        }

        $gallery = array();
        $featured_id = 0;
        $images = array_slice($images, 0, self::MAX_IMAGES);

        foreach ($images as $index => $image) {
            $url = isset($image['src']) ? $image['src'] : '';
            if ($url === '') {
                continue;
            }

            $attachment_id = $this->download_image($url, $product_id);
            if (!$attachment_id) {
                continue;
            }

            if ($index === 0) {
                $featured_id = $attachment_id;
            } else {
                $gallery[] = $attachment_id;
            }
        }

        if (!$featured_id) {
            return false;
        }

        $product->set_image_id($featured_id);
        $product->set_gallery_image_ids($gallery);
        $product->save();

        return true;
    }

    public function set_product_images_if_missing($product_id, array $images) {
        $product = wc_get_product($product_id);
        if (!$product || $product->get_image_id()) {
            return false;
        }

        return $this->set_product_images($product_id, $images);
    }

    /**
     * Import a product video into the Media Library and return a public URL.
     */
    public function import_video_url($url, $product_id) {
        $url = trim(html_entity_decode((string) $url, ENT_QUOTES, 'UTF-8'));
        if ($url === '') {
            return '';
        }

        if ($this->is_public_video_url($url)) {
            return esc_url_raw($url);
        }

        $attachment_id = $this->download_video($url, $product_id);
        if (!$attachment_id) {
            $sanitized = Motorock_Catalog_Importer_Product_Video::sanitize_url($url);
            return $sanitized !== '' && $this->is_public_video_url($sanitized) ? $sanitized : '';
        }

        $public_url = wp_get_attachment_url($attachment_id);
        if (!$public_url) {
            return '';
        }

        return esc_url_raw($public_url);
    }

    public function is_blocked_medienpaket_video_url($url) {
        $url = (string) $url;
        if ($url === '') {
            return false;
        }

        return strpos($url, 'motorock-catalog-importer/medienpaket') !== false
            || strpos($url, Motorock_Catalog_Importer_Medienpaket_Index::SCHEME) === 0;
    }

    private function is_public_video_url($url) {
        $url = (string) $url;
        if ($url === '' || !preg_match('#^https?://#i', $url)) {
            return false;
        }

        return !$this->is_blocked_medienpaket_video_url($url);
    }

    private function download_video($url, $product_id) {
        $existing = $this->find_attachment_by_source_url($url);
        if ($existing) {
            return $existing;
        }

        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/media.php';

        $local_path = $this->resolve_local_medienpaket_path($url);
        if ($local_path === '' && preg_match('#motorock-catalog-importer/medienpaket/(.+)$#', $url, $match)) {
            $candidates = array(
                Motorock_Catalog_Importer_Medienpaket_Index::base_dir() . '/' . $match[1],
                Motorock_Catalog_Importer_Medienpaket_Index::base_dir() . '/' . rawurldecode($match[1]),
            );

            foreach ($candidates as $candidate) {
                if (file_exists($candidate)) {
                    $local_path = $candidate;
                    break;
                }
            }
        }

        if ($local_path !== '') {
            return $this->import_local_file($local_path, $url, $product_id);
        }

        if (!preg_match('#^https?://#i', $url)) {
            return false;
        }

        $tmp = download_url($url, 120);
        if (is_wp_error($tmp)) {
            return false;
        }

        $file_array = array(
            'name' => basename(parse_url($url, PHP_URL_PATH)),
            'tmp_name' => $tmp,
        );

        $attachment_id = media_handle_sideload($file_array, $product_id);
        if (is_wp_error($attachment_id)) {
            @unlink($file_array['tmp_name']);
            return false;
        }

        update_post_meta($attachment_id, '_catalog_source_image_url', $this->store_source_image_url($url));
        return (int) $attachment_id;
    }

    private function download_image($url, $product_id) {
        $existing = $this->find_attachment_by_source_url($url);
        if ($existing) {
            return $existing;
        }

        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/media.php';
        require_once ABSPATH . 'wp-admin/includes/image.php';

        $local_path = $this->resolve_local_medienpaket_path($url);
        if ($local_path) {
            return $this->import_local_file($local_path, $url, $product_id);
        }

        $tmp = download_url($url, 30);
        if (is_wp_error($tmp)) {
            return false;
        }

        $file_array = array(
            'name' => basename(parse_url($url, PHP_URL_PATH)),
            'tmp_name' => $tmp,
        );

        $attachment_id = media_handle_sideload($file_array, $product_id);
        if (is_wp_error($attachment_id)) {
            @unlink($file_array['tmp_name']);
            return false;
        }

        update_post_meta($attachment_id, '_catalog_source_image_url', $this->store_source_image_url($url));
        return (int) $attachment_id;
    }

    private function import_local_file($path, $source_key, $product_id) {
        $tmp = wp_tempnam(basename($path));
        if (!$tmp || !copy($path, $tmp)) {
            if ($tmp) {
                @unlink($tmp);
            }
            return false;
        }

        $file_array = array(
            'name' => basename($path),
            'tmp_name' => $tmp,
        );

        $attachment_id = media_handle_sideload($file_array, $product_id);
        if (is_wp_error($attachment_id)) {
            @unlink($file_array['tmp_name']);
            return false;
        }

        update_post_meta($attachment_id, '_catalog_source_image_url', $this->store_source_image_url($source_key));
        return (int) $attachment_id;
    }

    private function resolve_local_medienpaket_path($url) {
        $scheme = Motorock_Catalog_Importer_Medienpaket_Index::SCHEME;
        if (strpos($url, $scheme) !== 0) {
            return '';
        }

        $relative = ltrim(substr($url, strlen($scheme)), '/');
        $path = Motorock_Catalog_Importer_Medienpaket_Index::base_dir() . '/' . $relative;

        return file_exists($path) ? $path : '';
    }

    private function store_source_image_url($url) {
        $url = (string) $url;
        if ($url === '') {
            return '';
        }

        if (strpos($url, Motorock_Catalog_Importer_Medienpaket_Index::SCHEME) === 0) {
            return $url;
        }

        return esc_url_raw($url);
    }

    private function find_attachment_by_source_url($url) {
        global $wpdb;

        $url = (string) $url;
        if ($url === '') {
            return 0;
        }

        $stored = $this->store_source_image_url($url);
        $id = $wpdb->get_var($wpdb->prepare(
            "SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key='_catalog_source_image_url' AND meta_value=%s LIMIT 1",
            $stored
        ));

        return $id ? (int) $id : 0;
    }
}
