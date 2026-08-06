<?php

if (!defined('ABSPATH')) {
    exit;
}

class Shopify_Importer_WPML_Helper {

    public static function is_active() {
        return defined('ICL_SITECODE') || function_exists('wpml_get_element_translations');
    }

    public static function get_translation_product_ids($product_id) {
        $product_id = (int) $product_id;
        if (!$product_id) {
            return array();
        }

        if (!self::is_active()) {
            return array($product_id);
        }

        $product = wc_get_product($product_id);
        if ($product && $product->is_type('variation')) {
            return self::get_variation_translation_ids($product_id, $product);
        }

        return self::get_translation_ids_by_trid($product_id, 'post_product');
    }

    private static function get_variation_translation_ids($variation_id, $variation = null) {
        $variation_id = (int) $variation_id;
        $ids = array($variation_id);

        if (!$variation) {
            $variation = wc_get_product($variation_id);
        }

        if (!$variation || !$variation->is_type('variation')) {
            return $ids;
        }

        $ids = array_merge($ids, self::get_translation_ids_by_trid($variation_id, 'post_product_variation'));

        $languages = apply_filters('wpml_active_languages', null);
        if (is_array($languages)) {
            foreach ($languages as $language) {
                $code = isset($language['code']) ? $language['code'] : '';
                if ($code === '') {
                    continue;
                }

                $translated = apply_filters('wpml_object_id', $variation_id, 'product_variation', false, $code);
                if ($translated) {
                    $ids[] = (int) $translated;
                }
            }
        }

        $ids = array_merge($ids, self::match_variations_by_attributes($variation));

        return array_values(array_unique(array_filter($ids)));
    }

    private static function match_variations_by_attributes($variation) {
        $ids = array();
        $parent_id = (int) $variation->get_parent_id();
        if (!$parent_id) {
            return $ids;
        }

        $parent_ids = self::get_translation_ids_by_trid($parent_id, 'post_product');
        $source_attrs = $variation->get_attributes();

        foreach ($parent_ids as $translated_parent_id) {
            if ((int) $translated_parent_id === (int) $variation->get_id()) {
                continue;
            }

            $translated_parent = wc_get_product($translated_parent_id);
            if (!$translated_parent || !$translated_parent->is_type('variable')) {
                continue;
            }

            foreach ($translated_parent->get_children() as $child_id) {
                $child = wc_get_product($child_id);
                if (!$child || !$child->is_type('variation')) {
                    continue;
                }

                if ($child->get_attributes() === $source_attrs) {
                    $ids[] = (int) $child_id;
                    break;
                }
            }
        }

        return $ids;
    }

    private static function get_translation_ids_by_trid($element_id, $element_type) {
        $element_id = (int) $element_id;
        $ids = array($element_id);

        if (!self::is_active()) {
            return $ids;
        }

        global $sitepress;
        if (!$sitepress || !method_exists($sitepress, 'get_element_trid')) {
            return $ids;
        }

        $trid = $sitepress->get_element_trid($element_id, $element_type);
        if (!$trid) {
            return $ids;
        }

        $translations = $sitepress->get_element_translations($trid, $element_type);
        if (empty($translations) || !is_array($translations)) {
            return $ids;
        }

        foreach ($translations as $translation) {
            if (!empty($translation->element_id)) {
                $ids[] = (int) $translation->element_id;
            }
        }

        return array_values(array_unique(array_filter($ids)));
    }

    public static function get_translated_term_ids($term_ids, $taxonomy, $language_code) {
        $translated = array();

        foreach ((array) $term_ids as $term_id) {
            $term_id = (int) $term_id;
            if (!$term_id) {
                continue;
            }

            if (self::is_active()) {
                $mapped = apply_filters('wpml_object_id', $term_id, $taxonomy, false, $language_code);
                if ($mapped) {
                    $translated[] = (int) $mapped;
                    continue;
                }
            }

            $translated[] = $term_id;
        }

        return array_values(array_unique($translated));
    }

    public static function get_product_language($product_id) {
        if (!self::is_active()) {
            return '';
        }

        $details = apply_filters('wpml_post_language_details', null, $product_id);
        if (is_array($details) && !empty($details['language_code'])) {
            return $details['language_code'];
        }

        return '';
    }

    public static function sync_product_price($product_id, $regular_price) {
        $product_id = (int) $product_id;
        $product = wc_get_product($product_id);
        if (!$product) {
            return array();
        }

        $formatted = wc_format_decimal($regular_price, wc_get_price_decimals());
        $current = wc_format_decimal($product->get_regular_price(), wc_get_price_decimals());
        $updated = array();

        if ($current !== $formatted) {
            $product->set_regular_price($formatted);
            $product->set_price($formatted);
            $product->save();
            update_post_meta($product_id, '_recommended_price', $formatted);
            $updated[] = $product_id;
        }

        $synced_ids = self::run_wpml_price_sync($product_id, $product, $formatted);
        if (!empty($synced_ids)) {
            $updated = array_values(array_unique(array_merge($updated, $synced_ids)));
        }

        return $updated;
    }

    private static function run_wpml_price_sync($product_id, $product, $formatted_price) {
        if (!self::is_active()) {
            return self::sync_translation_prices_direct($product_id, $formatted_price);
        }

        $sync_ids = array($product_id);
        if ($product->is_type('variation')) {
            $parent_id = (int) $product->get_parent_id();
            if ($parent_id) {
                $sync_ids[] = $parent_id;
            }
        }

        foreach (array_unique($sync_ids) as $sync_id) {
            do_action('wpml_sync_all_custom_fields', $sync_id);

            foreach (array('_regular_price', '_price', '_sale_price', '_recommended_price') as $meta_key) {
                do_action('wpml_sync_custom_field', $sync_id, $meta_key);
            }

            if (class_exists('WC_Product_Variable') && $sync_id === (int) $product_id && $product->is_type('variable')) {
                foreach ($product->get_children() as $child_id) {
                    do_action('wpml_sync_all_custom_fields', $child_id);
                }
            }
        }

        if ($product->is_type('variation')) {
            $parent = wc_get_product($product->get_parent_id());
            if ($parent && $parent->is_type('variable')) {
                foreach ($parent->get_children() as $child_id) {
                    do_action('wpml_sync_all_custom_fields', $child_id);
                }
            }
        }

        return self::sync_translation_prices_direct($product_id, $formatted_price);
    }

    private static function sync_translation_prices_direct($product_id, $formatted_price) {
        $product_ids = self::get_translation_product_ids($product_id);
        $updated = array();
        $parent_ids = array();
        $formatted = wc_format_decimal($formatted_price, wc_get_price_decimals());

        foreach ($product_ids as $id) {
            if ((int) $id === (int) $product_id) {
                continue;
            }

            $translation = wc_get_product($id);
            if (!$translation) {
                continue;
            }

            $current = wc_format_decimal($translation->get_regular_price(), wc_get_price_decimals());
            if ($current === $formatted) {
                continue;
            }

            $translation->set_regular_price($formatted);
            $translation->set_price($formatted);
            $translation->save();
            update_post_meta($id, '_recommended_price', $formatted);

            if ($translation->is_type('variation')) {
                $parent_ids[(int) $translation->get_parent_id()] = true;
            }

            $updated[] = $id;
        }

        foreach (array_keys($parent_ids) as $parent_id) {
            WC_Product_Variable::sync($parent_id);
            $parent = wc_get_product($parent_id);
            if ($parent) {
                $parent->save();
            }
        }

        return $updated;
    }

    public static function sync_product_categories($product_id, $source_category_ids) {
        $source_category_ids = array_values(array_unique(array_map('intval', (array) $source_category_ids)));
        if (empty($source_category_ids)) {
            return false;
        }

        $product_ids = self::get_translation_product_ids($product_id);
        $changed = false;

        foreach ($product_ids as $id) {
            $language = self::get_product_language($id);
            $term_ids = self::get_translated_term_ids($source_category_ids, 'product_cat', $language);

            if (empty($term_ids)) {
                continue;
            }

            $current_ids = wp_get_object_terms($id, 'product_cat', array('fields' => 'ids'));
            if (is_wp_error($current_ids)) {
                continue;
            }

            $current_ids = array_map('intval', (array) $current_ids);
            $term_ids = array_map('intval', $term_ids);
            sort($current_ids);
            sort($term_ids);

            if ($current_ids === $term_ids) {
                continue;
            }

            wp_set_object_terms($id, $term_ids, 'product_cat');
            $changed = true;
        }

        return $changed;
    }

    public static function sync_product_brand($product_id, $brand_name, $logger = null, $force = false) {
        if (!self::is_active() || empty($brand_name)) {
            return false;
        }

        if (!class_exists('Shopify_Importer_Brand_Handler')) {
            return false;
        }

        $handler = new Shopify_Importer_Brand_Handler();
        $changed = false;

        foreach (self::get_translation_product_ids($product_id) as $translation_id) {
            if ((int) $translation_id === (int) $product_id) {
                continue;
            }

            if ($handler->ensure_product_brand($translation_id, $brand_name, $logger, $force)) {
                $changed = true;
            }
        }

        return $changed;
    }
}
