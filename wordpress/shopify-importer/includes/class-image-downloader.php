<?php

if (!defined('ABSPATH')) {
    exit;
}

class Shopify_Importer_Image_Downloader {

    const MAX_IMAGES_PER_PRODUCT = 6;

    private $optimizing = false;

    public function download_image($image_url, $product_id) {
        if (empty($image_url)) {
            return false;
        }

        $existing_id = $this->get_attachment_id_by_url($image_url);
        if ($existing_id) {
            return $existing_id;
        }

        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/media.php';
        require_once ABSPATH . 'wp-admin/includes/image.php';

        $tmp = download_url($image_url, 30);
        if (is_wp_error($tmp)) {
            return false;
        }

        $file_array = array(
            'name' => basename(parse_url($image_url, PHP_URL_PATH)),
            'tmp_name' => $tmp,
        );

        $this->begin_optimizations();
        add_filter('wp_read_image_metadata', '__return_false');
        $attachment_id = media_handle_sideload($file_array, $product_id);
        remove_filter('wp_read_image_metadata', '__return_false');
        $this->end_optimizations();

        if (is_wp_error($attachment_id)) {
            @unlink($file_array['tmp_name']);
            return false;
        }

        update_post_meta($attachment_id, '_shopify_image_url', $image_url);
        return $attachment_id;
    }

    public function set_product_images($product_id, $images) {
        if (empty($images) || !is_array($images)) {
            return false;
        }

        $product = wc_get_product($product_id);
        if (!$product) {
            return false;
        }

        $gallery_ids = array();
        $images = array_slice($images, 0, self::MAX_IMAGES_PER_PRODUCT);

        foreach ($images as $index => $image) {
            $url = isset($image['src']) ? $image['src'] : '';
            if (empty($url)) {
                continue;
            }

            try {
                $attachment_id = $this->download_image($url, $product_id);
            } catch (Throwable $e) {
                continue;
            }

            if (!$attachment_id) {
                continue;
            }

            if ($index === 0) {
                $product->set_image_id($attachment_id);
            } else {
                $gallery_ids[] = $attachment_id;
            }
        }

        if (!empty($gallery_ids)) {
            $product->set_gallery_image_ids($gallery_ids);
        }

        $product->save();
        return true;
    }

    private function begin_optimizations() {
        if ($this->optimizing) {
            return;
        }

        $this->optimizing = true;
        add_filter('intermediate_image_sizes_advanced', array($this, 'skip_intermediate_sizes'), 99);
        add_filter('big_image_size_threshold', '__return_false');
        add_filter('wp_generate_attachment_metadata', array($this, 'minimal_attachment_metadata'), 99, 2);
    }

    private function end_optimizations() {
        if (!$this->optimizing) {
            return;
        }

        remove_filter('intermediate_image_sizes_advanced', array($this, 'skip_intermediate_sizes'), 99);
        remove_filter('big_image_size_threshold', '__return_false');
        remove_filter('wp_generate_attachment_metadata', array($this, 'minimal_attachment_metadata'), 99);
        $this->optimizing = false;
    }

    public function skip_intermediate_sizes($sizes) {
        return array();
    }

    public function minimal_attachment_metadata($metadata, $attachment_id) {
        $file = get_attached_file($attachment_id);
        if (!$file || !file_exists($file)) {
            return is_array($metadata) ? $metadata : array();
        }

        $size = @getimagesize($file);
        if (!$size) {
            return array(
                'file' => _wp_relative_upload_path($file),
            );
        }

        return array(
            'width' => (int) $size[0],
            'height' => (int) $size[1],
            'file' => _wp_relative_upload_path($file),
            'sizes' => array(),
        );
    }

    private function get_attachment_id_by_url($url) {
        global $wpdb;

        $attachment = $wpdb->get_col($wpdb->prepare(
            "SELECT post_id FROM $wpdb->postmeta WHERE meta_key='_shopify_image_url' AND meta_value=%s LIMIT 1",
            $url
        ));

        return !empty($attachment) ? (int) $attachment[0] : false;
    }
}
