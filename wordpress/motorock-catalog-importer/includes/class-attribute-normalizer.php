<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Canonical Woo variation attributes for apparel imports.
 *
 * Target schema:
 *   pa_color      — color slug (black, red, …)
 *   pa_size       — display "EU38 (UK10)" or letter size "M"
 *   pa_leg-length — petite | regular | tall (when applicable)
 */
class Motorock_Catalog_Importer_Attribute_Normalizer {

    /** @var array<int, int> UK women's numeric → EU */
    private static $uk_women_to_eu = array(
        4 => 32,
        6 => 34,
        8 => 36,
        10 => 38,
        12 => 40,
        14 => 42,
        16 => 44,
        18 => 46,
        20 => 48,
        22 => 50,
        24 => 52,
        26 => 54,
        28 => 56,
    );

    /** @var array<string, string> */
    private static $color_slug_to_label = array(
        'blk' => 'Black',
        'black' => 'Black',
        'red' => 'Red',
        'yel' => 'Yellow',
        'yellow' => 'Yellow',
        'blu' => 'Blue',
        'blue' => 'Blue',
        'wht' => 'White',
        'white' => 'White',
        'gry' => 'Grey',
        'grey' => 'Grey',
        'gray' => 'Grey',
    );

    /** @var array<string, string> */
    private static $leg_suffix_to_slug = array(
        'p' => 'petite',
        'r' => 'regular',
        't' => 'tall',
    );

    /**
     * Normalize import payload before Product_Writer persists it.
     *
     * @param array<string, mixed> $product_data
     * @return array<string, mixed>
     */
    public static function normalize_product_data(array $product_data) {
        if (!empty($product_data['is_simple']) || empty($product_data['variations'])) {
            return $product_data;
        }

        $colors = array();
        $sizes = array();
        $legs = array();
        $variations = array();

        foreach ($product_data['variations'] as $variation_data) {
            $normalized = self::normalize_variation_row(
                isset($variation_data['sku']) ? (string) $variation_data['sku'] : '',
                self::attributes_to_map(isset($variation_data['attributes']) ? $variation_data['attributes'] : array())
            );

            $variation_attributes = array();
            if ($normalized['color_label'] !== '') {
                $colors[] = $normalized['color_label'];
                $variation_attributes[] = array(
                    'name' => 'Color',
                    'option' => $normalized['color_label'],
                );
            }
            if ($normalized['size_label'] !== '') {
                $sizes[] = $normalized['size_label'];
                $variation_attributes[] = array(
                    'name' => 'Size',
                    'option' => $normalized['size_label'],
                );
            }
            if ($normalized['leg_label'] !== '') {
                $legs[] = $normalized['leg_label'];
                $variation_attributes[] = array(
                    'name' => 'Leg Length',
                    'option' => $normalized['leg_label'],
                );
            }

            $variation_data['attributes'] = $variation_attributes;
            $variations[] = $variation_data;
        }

        $product_data['variations'] = $variations;
        $product_data['attributes'] = self::build_parent_attributes(
            array_values(array_unique($colors)),
            array_values(array_unique($sizes)),
            array_values(array_unique($legs))
        );

        return $product_data;
    }

    /**
     * In-place backfill for an existing variable product (preserves variation IDs).
     *
     * @return array{updated: int, skipped: bool, errors: string[]}
     */
    public static function backfill_variable_product($product_id, $dry_run = false) {
        $product = wc_get_product($product_id);
        if (!$product || !$product->is_type('variable')) {
            return array('updated' => 0, 'skipped' => true, 'errors' => array());
        }

        $colors = array();
        $sizes = array();
        $legs = array();
        $updated = 0;
        $errors = array();

        foreach ($product->get_children() as $variation_id) {
            $variation = wc_get_product($variation_id);
            if (!$variation || !$variation->is_type('variation')) {
                continue;
            }

            $normalized = self::normalize_variation_row(
                (string) $variation->get_sku(),
                self::wc_attributes_to_map($variation->get_attributes())
            );

            if ($normalized['color_label'] !== '') {
                $colors[] = $normalized['color_label'];
            }
            if ($normalized['size_label'] !== '') {
                $sizes[] = $normalized['size_label'];
            }
            if ($normalized['leg_label'] !== '') {
                $legs[] = $normalized['leg_label'];
            }

            $new_attrs = self::normalized_to_wc_attribute_slugs($normalized);
            if ($new_attrs === $variation->get_attributes()) {
                continue;
            }

            if (!$dry_run) {
                $variation->set_attributes($new_attrs);
                $variation->save();
            }

            $updated++;
        }

        if (!$dry_run && $updated > 0) {
            self::apply_parent_attributes($product, $colors, $sizes, $legs);
            WC_Product_Variable::sync($product_id);
            wc_delete_product_transients($product_id);
        }

        return array(
            'updated' => $updated,
            'skipped' => false,
            'errors' => $errors,
        );
    }

    /**
     * @param array<string, string> $attrs pa_* slug => term slug
     * @return array{color_label: string, color_slug: string, size_label: string, size_slug: string, leg_label: string, leg_slug: string}
     */
    public static function normalize_variation_row($sku, array $attrs) {
        $result = array(
            'color_label' => '',
            'color_slug' => '',
            'size_label' => '',
            'size_slug' => '',
            'leg_label' => '',
            'leg_slug' => '',
        );

        $sku_dims = self::parse_sku_dimensions($sku);
        $size_raw = isset($attrs['pa_size']) ? trim((string) $attrs['pa_size']) : '';
        $color_raw = isset($attrs['pa_color']) ? trim((string) $attrs['pa_color']) : '';
        $leg_raw = isset($attrs['pa_leg-length']) ? trim((string) $attrs['pa_leg-length']) : '';

        if ($leg_raw === '' && isset($attrs['pa_leg_length'])) {
            $leg_raw = trim((string) $attrs['pa_leg_length']);
        }

        $combined = self::parse_combined_size_leg($size_raw);
        if ($combined) {
            $size_raw = (string) $combined['uk'];
            if ($leg_raw === '') {
                $leg_raw = $combined['leg'];
            }
        }

        if ($color_raw === '' && self::is_color_slug($size_raw)) {
            $color_raw = $size_raw;
            $size_raw = $sku_dims ? (string) $sku_dims['uk'] : '';
        }

        if ($color_raw === '' && $sku_dims && !empty($sku_dims['color'])) {
            $color_raw = $sku_dims['color'];
        }

        if ($size_raw === '' && $sku_dims && !empty($sku_dims['uk'])) {
            $size_raw = (string) $sku_dims['uk'];
        }

        if ($leg_raw === '' && $sku_dims && !empty($sku_dims['leg'])) {
            $leg_raw = $sku_dims['leg'];
        }

        if ($color_raw !== '') {
            $result['color_label'] = self::color_label($color_raw);
            $result['color_slug'] = self::color_slug($color_raw);
        }

        if ($size_raw !== '' && !self::is_color_slug($size_raw)) {
            $size_formatted = self::format_size_label($size_raw);
            $result['size_label'] = $size_formatted['label'];
            $result['size_slug'] = $size_formatted['slug'];
        }

        if ($leg_raw !== '') {
            $result['leg_label'] = self::leg_label($leg_raw);
            $result['leg_slug'] = self::leg_slug($leg_raw);
        }

        return $result;
    }

    /**
     * @param array<int, array{name: string, option: string}> $attributes
     * @return array<string, string>
     */
    private static function attributes_to_map(array $attributes) {
        $map = array();
        foreach ($attributes as $attribute) {
            $name = isset($attribute['name']) ? strtolower(trim((string) $attribute['name'])) : '';
            $option = isset($attribute['option']) ? trim((string) $attribute['option']) : '';
            if ($name === '' || $option === '') {
                continue;
            }

            if (strpos($name, 'color') !== false || $name === 'värv') {
                $map['pa_color'] = sanitize_title($option);
                continue;
            }

            if (strpos($name, 'leg') !== false) {
                $map['pa_leg-length'] = sanitize_title($option);
                continue;
            }

            if (strpos($name, 'size') !== false || $name === 'suurus') {
                $map['pa_size'] = sanitize_title($option);
            }
        }

        return $map;
    }

    /**
     * @param array<string, string> $attributes
     * @return array<string, string>
     */
    private static function wc_attributes_to_map(array $attributes) {
        $map = array();
        foreach ($attributes as $taxonomy => $slug) {
            $map[(string) $taxonomy] = (string) $slug;
        }

        return $map;
    }

    /**
     * @return array{uk?: int, color?: string, leg?: string}|null
     */
    private static function parse_sku_dimensions($sku) {
        $sku = trim((string) $sku);
        if ($sku === '') {
            return null;
        }

        if (preg_match('/-([A-Za-z]{2,5})-(\d{1,3})([PRT])$/i', $sku, $matches)) {
            return array(
                'color' => strtolower($matches[1]),
                'uk' => (int) $matches[2],
                'leg' => self::$leg_suffix_to_slug[strtolower($matches[3])] ?? '',
            );
        }

        return null;
    }

    /**
     * @return array{uk: int, leg: string}|null
     */
    private static function parse_combined_size_leg($value) {
        $value = strtolower(trim((string) $value));
        if ($value === '') {
            return null;
        }

        if (preg_match('/^(\d{1,2})([prt])$/', $value, $matches)) {
            return array(
                'uk' => (int) $matches[1],
                'leg' => self::$leg_suffix_to_slug[$matches[2]] ?? '',
            );
        }

        return null;
    }

    private static function is_color_slug($value) {
        $slug = strtolower(trim((string) $value));
        if ($slug === '') {
            return false;
        }

        return isset(self::$color_slug_to_label[$slug]) || preg_match('/^(blk|yel|red|blu|gry|wht)$/', $slug);
    }

    private static function color_label($value) {
        $slug = self::color_slug($value);
        return isset(self::$color_slug_to_label[$slug])
            ? self::$color_slug_to_label[$slug]
            : ucwords(str_replace(array('-', '_'), ' ', $slug));
    }

    private static function color_slug($value) {
        $slug = sanitize_title($value);
        $short = array(
            'blk' => 'black',
            'yel' => 'yellow',
            'blu' => 'blue',
            'gry' => 'grey',
            'wht' => 'white',
        );

        return isset($short[$slug]) ? $short[$slug] : $slug;
    }

    /**
     * @return array{label: string, slug: string}
     */
    private static function format_size_label($value) {
        $raw = trim((string) $value);
        $upper = strtoupper($raw);

        if (preg_match('/^(\d{1,2})$/', $raw, $matches)) {
            $uk = (int) $matches[1];
            if (isset(self::$uk_women_to_eu[$uk])) {
                $eu = self::$uk_women_to_eu[$uk];
                $label = 'EU' . $eu . ' (UK' . $uk . ')';

                return array(
                    'label' => $label,
                    'slug' => sanitize_title($label),
                );
            }
        }

        if (preg_match('/^EU(\d{2,3})\s*\(UK(\d{1,2})\)$/i', $raw, $matches)) {
            $label = 'EU' . $matches[1] . ' (UK' . $matches[2] . ')';

            return array(
                'label' => $label,
                'slug' => sanitize_title($label),
            );
        }

        return array(
            'label' => $upper,
            'slug' => sanitize_title($raw),
        );
    }

    private static function leg_label($value) {
        $slug = self::leg_slug($value);
        $labels = array(
            'petite' => 'Petite',
            'regular' => 'Regular',
            'tall' => 'Tall',
        );

        return isset($labels[$slug]) ? $labels[$slug] : ucfirst($slug);
    }

    private static function leg_slug($value) {
        $slug = sanitize_title($value);
        $aliases = array(
            'p' => 'petite',
            'r' => 'regular',
            't' => 'tall',
        );

        return isset($aliases[$slug]) ? $aliases[$slug] : $slug;
    }

    /**
     * @param array{color_label: string, color_slug: string, size_label: string, size_slug: string, leg_label: string, leg_slug: string} $normalized
     * @return array<string, string>
     */
    private static function normalized_to_wc_attribute_slugs(array $normalized) {
        $attrs = array();

        if ($normalized['color_slug'] !== '') {
            self::ensure_term('pa_color', $normalized['color_label'], $normalized['color_slug']);
            $attrs['pa_color'] = $normalized['color_slug'];
        }

        if ($normalized['size_slug'] !== '') {
            self::ensure_term('pa_size', $normalized['size_label'], $normalized['size_slug']);
            $attrs['pa_size'] = $normalized['size_slug'];
        }

        if ($normalized['leg_slug'] !== '') {
            self::ensure_term('pa_leg-length', $normalized['leg_label'], $normalized['leg_slug']);
            $attrs['pa_leg-length'] = $normalized['leg_slug'];
        }

        return $attrs;
    }

    /**
     * @param string[] $colors
     * @param string[] $sizes
     * @param string[] $legs
     * @return array<int, array<string, mixed>>
     */
    private static function build_parent_attributes(array $colors, array $sizes, array $legs) {
        $attributes = array();

        if (!empty($colors)) {
            $attributes[] = array(
                'name' => 'Color',
                'options' => $colors,
                'visible' => true,
                'variation' => true,
            );
        }

        if (!empty($sizes)) {
            $attributes[] = array(
                'name' => 'Size',
                'options' => $sizes,
                'visible' => true,
                'variation' => true,
            );
        }

        if (!empty($legs)) {
            $attributes[] = array(
                'name' => 'Leg Length',
                'options' => $legs,
                'visible' => true,
                'variation' => true,
            );
        }

        return $attributes;
    }

    /**
     * @param WC_Product_Variable $product
     * @param string[] $colors
     * @param string[] $sizes
     * @param string[] $legs
     */
    private static function apply_parent_attributes($product, array $colors, array $sizes, array $legs) {
        $attribute_defs = self::build_parent_attributes(
            array_values(array_unique($colors)),
            array_values(array_unique($sizes)),
            array_values(array_unique($legs))
        );

        $attributes = array();
        foreach ($attribute_defs as $attribute_data) {
            $taxonomy = 'pa_' . sanitize_title($attribute_data['name']);
            self::ensure_attribute_taxonomy($attribute_data['name'], $taxonomy);

            $term_ids = array();
            foreach ($attribute_data['options'] as $option) {
                $formatted = $attribute_data['name'] === 'Size'
                    ? self::format_size_label($option)
                    : array('label' => $option, 'slug' => sanitize_title($option));

                if ($attribute_data['name'] === 'Color') {
                    $formatted = array(
                        'label' => self::color_label($option),
                        'slug' => self::color_slug($option),
                    );
                }

                if ($attribute_data['name'] === 'Leg Length') {
                    $formatted = array(
                        'label' => self::leg_label($option),
                        'slug' => self::leg_slug($option),
                    );
                }

                self::ensure_term($taxonomy, $formatted['label'], $formatted['slug']);
                $term = get_term_by('slug', $formatted['slug'], $taxonomy);
                if ($term && !is_wp_error($term)) {
                    $term_ids[] = (int) $term->term_id;
                }
            }

            $attribute = new WC_Product_Attribute();
            $attribute_id = wc_attribute_taxonomy_id_by_name($taxonomy);
            if ($attribute_id) {
                $attribute->set_id($attribute_id);
            }
            $attribute->set_name($taxonomy);
            $attribute->set_options($term_ids);
            $attribute->set_visible(true);
            $attribute->set_variation(true);
            $attributes[$taxonomy] = $attribute;
        }

        $product->set_attributes($attributes);
        $product->save();
    }

    private static function ensure_attribute_taxonomy($label, $taxonomy) {
        if (taxonomy_exists($taxonomy)) {
            return;
        }

        wc_create_attribute(array(
            'name' => $label,
            'slug' => sanitize_title($label),
            'type' => 'select',
            'order_by' => 'menu_order',
            'has_archives' => false,
        ));

        register_taxonomy(
            $taxonomy,
            apply_filters('woocommerce_taxonomy_objects_' . $taxonomy, array('product')),
            apply_filters('woocommerce_taxonomy_args_' . $taxonomy, array(
                'hierarchical' => false,
                'label' => $label,
                'show_ui' => false,
                'query_var' => true,
                'rewrite' => false,
            ))
        );
    }

    private static function ensure_term($taxonomy, $label, $slug) {
        $taxonomy_labels = array(
            'pa_color' => 'Color',
            'pa_size' => 'Size',
            'pa_leg-length' => 'Leg Length',
        );

        $attribute_label = isset($taxonomy_labels[$taxonomy])
            ? $taxonomy_labels[$taxonomy]
            : ucwords(str_replace(array('pa_', '-'), array('', ' '), $taxonomy));

        self::ensure_attribute_taxonomy($attribute_label, $taxonomy);

        $term = get_term_by('slug', $slug, $taxonomy);
        if (!$term) {
            wp_insert_term($label, $taxonomy, array('slug' => $slug));
            return;
        }

        if ($term->name !== $label) {
            wp_update_term((int) $term->term_id, $taxonomy, array('name' => $label));
        }
    }
}
