<?php

if (!defined('ABSPATH')) {
    exit;
}

class Shopify_Importer_Price_Helper {

    const SYNC_EXCLUDE_SALES = 'exclude_sales';
    const SYNC_NEVER = 'never';
    const SYNC_INCLUDE_SALES = 'include_sales';

    public static function get_multiplier($site) {
        if (!isset($site['price_multiplier']) || $site['price_multiplier'] === '') {
            return 1.0;
        }

        $multiplier = (float) $site['price_multiplier'];
        return $multiplier > 0 ? $multiplier : 1.0;
    }

    /**
     * @return string exclude_sales|never|include_sales
     */
    public static function get_price_sync_mode($site) {
        $mode = isset($site['price_sync_mode']) ? (string) $site['price_sync_mode'] : self::SYNC_EXCLUDE_SALES;

        $allowed = array(
            self::SYNC_EXCLUDE_SALES,
            self::SYNC_NEVER,
            self::SYNC_INCLUDE_SALES,
        );

        if (!in_array($mode, $allowed, true)) {
            return self::SYNC_EXCLUDE_SALES;
        }

        return $mode;
    }

    public static function should_sync_prices($site) {
        return self::get_price_sync_mode($site) !== self::SYNC_NEVER;
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

    /**
     * True when Shopify exposes a higher compare-at price than the current sale price.
     */
    public static function is_variant_on_sale($variant) {
        if (!is_array($variant)) {
            return false;
        }

        $price = self::normalize_amount(isset($variant['price']) ? $variant['price'] : null);
        $compare_at = self::normalize_amount(isset($variant['compare_at_price']) ? $variant['compare_at_price'] : null);

        return $compare_at !== null && $price !== null && $compare_at > $price;
    }

    /**
     * Resolve the catalog/base price from a Shopify variant.
     *
     * exclude_sales: compare_at_price when on sale, otherwise price (1:1 base price).
     * include_sales: always price (legacy campaign prices included).
     */
    public static function resolve_variant_base_price($variant, $site = null) {
        if (!is_array($variant)) {
            return '';
        }

        $mode = $site ? self::get_price_sync_mode($site) : self::SYNC_EXCLUDE_SALES;
        $price = isset($variant['price']) ? $variant['price'] : '';

        if ($mode === self::SYNC_INCLUDE_SALES) {
            return $price;
        }

        if ($mode === self::SYNC_EXCLUDE_SALES && self::is_variant_on_sale($variant)) {
            return isset($variant['compare_at_price']) ? $variant['compare_at_price'] : $price;
        }

        return $price;
    }

    /**
     * @return array{price:string,on_sale:bool,used_compare_at:bool}
     */
    public static function resolve_variant_price_details($variant, $site) {
        $on_sale = self::is_variant_on_sale($variant);
        $mode = self::get_price_sync_mode($site);
        $base = self::resolve_variant_base_price($variant, $site);
        $multiplier = self::get_multiplier($site);

        return array(
            'price' => self::convert($base, $multiplier),
            'on_sale' => $on_sale,
            'used_compare_at' => $mode === self::SYNC_EXCLUDE_SALES && $on_sale,
        );
    }

    public static function apply_to_product_data($product_data, $multiplier, $site = null) {
        if (empty($product_data) || !is_array($product_data)) {
            return $product_data;
        }

        if ($site && !self::should_sync_prices($site)) {
            unset($product_data['price']);
            if (!empty($product_data['variations']) && is_array($product_data['variations'])) {
                foreach ($product_data['variations'] as $index => $variation) {
                    unset($product_data['variations'][$index]['regular_price']);
                }
            }
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

    public static function get_price_sync_mode_label($mode) {
        switch ($mode) {
            case self::SYNC_NEVER:
                return 'Hindu ei sünkroniseerita';
            case self::SYNC_INCLUDE_SALES:
                return 'Kõik Shopify hinnad (ka soodushinnad)';
            case self::SYNC_EXCLUDE_SALES:
            default:
                return 'Tavahinnad (kampaaniahindu mitte)';
        }
    }

    private static function normalize_amount($value) {
        if ($value === '' || $value === null) {
            return null;
        }

        if (!is_numeric($value)) {
            return null;
        }

        return (float) $value;
    }
}
