<?php

if (!defined('ABSPATH')) {
    exit;
}

class Shopify_Importer_Product_Cleaner {

    public static function count_site_products($site_id) {
        return count(self::get_site_product_ids($site_id));
    }

    public static function delete_site_products($site_id) {
        $product_ids = self::get_site_product_ids($site_id);

        if (empty($product_ids)) {
            return array(
                'success' => false,
                'message' => 'No products found for this import site.',
                'deleted' => 0,
                'images' => 0,
            );
        }

        $deleted_count = 0;
        $image_count = 0;

        foreach ($product_ids as $product_id) {
            $product = wc_get_product($product_id);
            if (!$product) {
                continue;
            }

            $image_ids = array();

            if ($product->get_image_id()) {
                $image_ids[] = $product->get_image_id();
            }

            $gallery_ids = $product->get_gallery_image_ids();
            if (!empty($gallery_ids)) {
                $image_ids = array_merge($image_ids, $gallery_ids);
            }

            if ($product->is_type('variable')) {
                foreach ($product->get_children() as $variation_id) {
                    $variation = wc_get_product($variation_id);
                    if ($variation && $variation->get_image_id()) {
                        $image_ids[] = $variation->get_image_id();
                    }
                }
            }

            foreach (array_unique($image_ids) as $image_id) {
                if (wp_delete_attachment($image_id, true)) {
                    $image_count++;
                }
            }

            if (wp_delete_post($product_id, true)) {
                $deleted_count++;
            }
        }

        return array(
            'success' => true,
            'message' => "Deleted {$deleted_count} products and {$image_count} images.",
            'deleted' => $deleted_count,
            'images' => $image_count,
        );
    }

    private static function get_site_product_ids($site_id) {
        $query = new WP_Query(array(
            'post_type' => 'product',
            'post_status' => array('publish', 'draft', 'pending', 'private', 'trash'),
            'posts_per_page' => -1,
            'fields' => 'ids',
            'meta_query' => array(
                'relation' => 'AND',
                array(
                    'key' => '_import_source',
                    'value' => 'shopify',
                    'compare' => '=',
                ),
                array(
                    'key' => '_shopify_site_id',
                    'value' => $site_id,
                    'compare' => '=',
                ),
            ),
        ));

        return is_array($query->posts) ? $query->posts : array();
    }
}
