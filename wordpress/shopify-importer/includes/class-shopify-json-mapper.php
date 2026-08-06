<?php

if (!defined('ABSPATH')) {
    exit;
}

class Shopify_Importer_JSON_Mapper {

    public static function map_product($shopify_product, $collection_ids = array()) {
        if (empty($shopify_product['published_at'])) {
            return null;
        }

        $variants = self::get_available_variants($shopify_product);
        if (empty($variants)) {
            return null;
        }

        $option_names = array();
        if (!empty($shopify_product['options'])) {
            foreach ($shopify_product['options'] as $index => $option) {
                $option_names[$index + 1] = $option['name'];
            }
        }

        $mapped_variations = array();
        foreach ($variants as $variant) {
            if (empty($variant['sku'])) {
                continue;
            }

            $attributes = array();
            for ($i = 1; $i <= 3; $i++) {
                $value_key = 'option' . $i;
                if (!empty($variant[$value_key]) && isset($option_names[$i])) {
                    $attributes[] = array(
                        'name' => $option_names[$i],
                        'option' => $variant[$value_key],
                    );
                }
            }

            $mapped_variations[] = array(
                'sku' => $variant['sku'],
                'regular_price' => Shopify_Importer_Price_Helper::resolve_variant_base_price($variant),
                'stock_status' => !empty($variant['available']) ? 'instock' : 'outofstock',
                'attributes' => $attributes,
            );
        }

        if (empty($mapped_variations)) {
            return null;
        }

        $images = array();
        if (!empty($shopify_product['images'])) {
            usort($shopify_product['images'], function ($a, $b) {
                return (int) $a['position'] - (int) $b['position'];
            });

            foreach ($shopify_product['images'] as $image) {
                if (!empty($image['src'])) {
                    $images[] = array('src' => $image['src']);
                }
            }
        }

        $is_simple = self::should_be_simple($mapped_variations, $option_names);

        return array(
            'id' => $shopify_product['id'],
            'name' => $shopify_product['title'],
            'description' => isset($shopify_product['body_html']) ? $shopify_product['body_html'] : '',
            'handle' => isset($shopify_product['handle']) ? $shopify_product['handle'] : '',
            'sku' => $is_simple ? $mapped_variations[0]['sku'] : self::derive_parent_sku($mapped_variations, $shopify_product),
            'price' => $is_simple ? $mapped_variations[0]['regular_price'] : '',
            'is_simple' => $is_simple,
            'variations' => $mapped_variations,
            'images' => $images,
            'collection_ids' => $collection_ids,
        );
    }

    private static function get_available_variants($shopify_product) {
        if (empty($shopify_product['variants'])) {
            return array();
        }

        $available = array();
        foreach ($shopify_product['variants'] as $variant) {
            if (!empty($variant['available'])) {
                $available[] = $variant;
            }
        }

        return $available;
    }

    private static function should_be_simple($variations, $option_names) {
        if (count($variations) !== 1) {
            return false;
        }

        $variation = $variations[0];
        if (empty($variation['attributes'])) {
            return true;
        }

        if (count($variation['attributes']) === 1) {
            $value = strtolower(trim($variation['attributes'][0]['option']));
            $name = strtolower(trim($variation['attributes'][0]['name']));
            if ($value === 'default title' || $value === 'one size' || $name === 'title') {
                return true;
            }
        }

        return false;
    }

    private static function derive_parent_sku($variations, $shopify_product) {
        unset($shopify_product);

        if (empty($variations[0]['sku'])) {
            return '';
        }

        return self::strip_variation_suffix($variations[0]['sku']);
    }

    /**
     * Derive a parent/base SKU from a variation SKU (same rules as Motomad Importer).
     */
    public static function strip_variation_suffix($sku) {
        $sku = trim($sku);
        if ($sku === '') {
            return '';
        }

        $parent_sku = preg_replace('/\s*-\s*W\d+-L\d+$/', '', $sku);
        $parent_sku = preg_replace('/\s*-\s*[WL]\d+$/', '', $parent_sku);
        $parent_sku = preg_replace('/\s*-\s*[A-Za-z0-9]+$/', '', $parent_sku);

        return trim($parent_sku);
    }
}
