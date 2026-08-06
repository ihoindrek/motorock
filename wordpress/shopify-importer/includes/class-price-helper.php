<?php

if (!defined('ABSPATH')) {
    exit;
}

class Shopify_Importer_Price_Helper {

    public static function get_multiplier($site) {
        if (!isset($site['price_multiplier']) || $site['price_multiplier'] === '') {
            return 1.0;
        }

        $multiplier = (float) $site['price_multiplier'];
        return $multiplier > 0 ? $multiplier : 1.0;
    }

    public static function convert($price, $multiplier) {
        if ($price === '' || $price === null) {
            return '';
        }

        if ((float) $multiplier === 1.0) {
            return wc_format_decimal($price, wc_get_price_decimals());
        }

        $converted = (float) $price * (float) $multiplier;

        return wc_format_decimal($converted, wc_get_price_decimals());
    }

    public static function apply_to_product_data($product_data, $multiplier) {
        if ((float) $multiplier === 1.0 || empty($product_data) || !is_array($product_data)) {
            return $product_data;
        }

        if (!empty($product_data['price'])) {
            $product_data['price'] = self::convert($product_data['price'], $multiplier);
        }

        if (!empty($product_data['variations']) && is_array($product_data['variations'])) {
            foreach ($product_data['variations'] as $index => $variation) {
                if (!empty($variation['regular_price'])) {
                    $product_data['variations'][$index]['regular_price'] = self::convert(
                        $variation['regular_price'],
                        $multiplier
                    );
                }
            }
        }

        return $product_data;
    }
}
