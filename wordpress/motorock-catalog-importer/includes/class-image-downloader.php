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
                $product->set_image_id($attachment_id);
            } else {
                $gallery[] = $attachment_id;
            }
        }

        if (!empty($gallery)) {
            $product->set_gallery_image_ids($gallery);
        }

        $product->save();
        return true;
    }

    private function download_image($url, $product_id) {
        $existing = $this->find_attachment_by_source_url($url);
        if ($existing) {
            return $existing;
        }

        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/media.php';
        require_once ABSPATH . 'wp-admin/includes/image.php';

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

        update_post_meta($attachment_id, '_catalog_source_image_url', esc_url_raw($url));
        return (int) $attachment_id;
    }

    private function find_attachment_by_source_url($url) {
        global $wpdb;
        $id = $wpdb->get_var($wpdb->prepare(
            "SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key='_catalog_source_image_url' AND meta_value=%s LIMIT 1",
            esc_url_raw($url)
        ));
        return $id ? (int) $id : 0;
    }
}
