<?php

if (!defined('ABSPATH')) {
    exit;
}

class Shopify_Importer_Brand_Handler {

    /**
     * Motorock uses pa_brand (product attribute). Motomad/local may use native product_brand.
     * Prefer pa_brand when the attribute taxonomy exists — even if product_brand is also registered.
     */
    public function get_brand_taxonomy() {
        if (taxonomy_exists('pa_brand')) {
            return 'pa_brand';
        }

        if (taxonomy_exists('product_brand')) {
            return 'product_brand';
        }

        return apply_filters('shopify_importer_brand_taxonomy', 'pa_brand');
    }

    /**
     * Canonical pa_brand slugs => display names used in WooCommerce.
     *
     * @return array<string, string>
     */
    public function get_canonical_brands() {
        return apply_filters(
            'shopify_importer_canonical_brands',
            array(
                'bobhead'      => 'Bobhead',
                'pando-moto'   => 'Pando Moto',
                'johnny-reb'   => 'Johnny Reb',
                'holyfreedom'  => 'Holyfreedom',
                'john-doe'     => 'John Doe',
                'motogirl'     => 'Motogirl',
                'makita'       => 'Makita',
                'brixton'      => 'Brixton',
                'malaguti'     => 'Malaguti',
                'motron'       => 'Motron',
                'mutt'         => 'Mutt',
            )
        );
    }

    /**
     * Resolve the brand for an import: site config first, then SKU/title heuristics.
     */
    public function resolve_brand_for_import($site_brand, $title, $sku = '', $handle = '') {
        if ($this->is_gift_card($title, $sku, $handle)) {
            return null;
        }

        if (!empty($site_brand)) {
            $normalized = $this->normalize_brand_name($site_brand);
            if ($normalized !== null) {
                return $normalized;
            }
        }

        return $this->infer_brand_from_product_data($title, $sku, $handle);
    }

    /**
     * Assign brand when missing (or always when $force is true).
     */
    public function ensure_product_brand($product_id, $brand_name, $logger = null, $force = false) {
        if (empty($brand_name)) {
            return false;
        }

        if (!$force && $this->product_has_brand($product_id)) {
            return true;
        }

        return $this->set_product_brand($product_id, $brand_name, $logger);
    }

    public function set_product_brand($product_id, $brand_name, $logger = null) {
        if (empty($brand_name)) {
            return false;
        }

        $brand_name = $this->normalize_brand_name($brand_name);
        if ($brand_name === null) {
            if ($logger) {
                $logger->log('Unknown brand name, skipping assignment.', 'WARNING');
            }
            return false;
        }

        $brand_taxonomy = $this->get_brand_taxonomy();

        if ($brand_taxonomy === 'product_brand') {
            return $this->set_native_brand($product_id, $brand_name, $logger);
        }

        return $this->set_attribute_brand($product_id, $brand_name, $logger);
    }

    public function product_has_brand($product_id) {
        global $wpdb;

        $taxonomy = $this->get_brand_taxonomy();
        $has = (int) $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*)
                FROM {$wpdb->term_relationships} tr
                INNER JOIN {$wpdb->term_taxonomy} tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
                WHERE tr.object_id = %d AND tt.taxonomy = %s",
                (int) $product_id,
                $taxonomy
            )
        );

        return $has > 0;
    }

    public function normalize_brand_name($brand_name) {
        $brand_name = trim((string) $brand_name);
        if ($brand_name === '') {
            return null;
        }

        $slug = sanitize_title($brand_name);
        $map = $this->get_canonical_brands();

        if (isset($map[$slug])) {
            return $map[$slug];
        }

        $aliases = $this->get_brand_slug_aliases();
        if (isset($aliases[$slug])) {
            $canonical_slug = $aliases[$slug];
            return isset($map[$canonical_slug]) ? $map[$canonical_slug] : null;
        }

        foreach ($map as $canonical_slug => $display_name) {
            if ($this->starts_with($slug, $canonical_slug)) {
                return $display_name;
            }
        }

        return null;
    }

    public function infer_brand_from_product_data($title, $sku = '', $handle = '', $product_id = 0) {
        $title = (string) $title;
        $sku = strtoupper(trim((string) $sku));
        $handle = (string) $handle;

        if ($this->is_gift_card($title, $sku, $handle)) {
            return null;
        }

        if ($this->starts_with($sku, 'BH')) {
            return $this->brand_display_name('bobhead');
        }

        if ($this->starts_with($sku, 'PANDO') || $this->starts_with($sku, 'PM-')) {
            return $this->brand_display_name('pando-moto');
        }

        if ($this->starts_with($sku, 'NANDI')) {
            return $this->brand_display_name('motogirl');
        }

        if (
            stripos($sku, 'FALCON-LEATHER-AVIATOR') !== false
            || stripos($title, 'FALCON LEATHER AVIATOR') !== false
        ) {
            return $this->brand_display_name('pando-moto');
        }

        if (
            stripos($sku, 'DRK-01') !== false
            || stripos($handle, 'drk-01') !== false
        ) {
            return $this->brand_display_name('mutt');
        }

        if (stripos($title, 'BOBHEAD') !== false) {
            return $this->brand_display_name('bobhead');
        }

        if ($product_id > 0) {
            $category_slugs = wp_list_pluck(
                wp_get_object_terms((int) $product_id, 'product_cat', array('fields' => 'all')),
                'slug'
            );

            if (is_array($category_slugs)) {
                if (in_array('mutt-2', $category_slugs, true) || in_array('mutt', $category_slugs, true)) {
                    return $this->brand_display_name('mutt');
                }
            }
        }

        return null;
    }

    private function brand_display_name($slug) {
        $map = $this->get_canonical_brands();
        return isset($map[$slug]) ? $map[$slug] : null;
    }

    /**
     * @return array<string, string> alias slug => canonical slug
     */
    private function get_brand_slug_aliases() {
        return array(
            'pando'      => 'pando-moto',
            'johnnyreb'  => 'johnny-reb',
            'johnny-reb-et' => 'johnny-reb',
        );
    }

    private function is_gift_card($title, $sku = '', $handle = '') {
        $sku = strtoupper(trim((string) $sku));

        if ($sku === 'GFTV') {
            return true;
        }

        if (stripos((string) $title, 'kinkekaart') !== false) {
            return true;
        }

        if (stripos((string) $handle, 'kinkekaart') !== false || stripos((string) $handle, 'gift-card') !== false) {
            return true;
        }

        return (bool) preg_match('/gift\s*card|e-gift/i', (string) $title);
    }

    private function starts_with($haystack, $needle) {
        if ($needle === '' || $haystack === '') {
            return false;
        }

        return substr($haystack, 0, strlen($needle)) === $needle;
    }

    private function set_native_brand($product_id, $brand_name, $logger = null) {
        $brand_slug = sanitize_title($brand_name);
        $term = get_term_by('slug', $brand_slug, 'product_brand');

        if (!$term) {
            $term = wp_insert_term($brand_name, 'product_brand', array(
                'slug' => $brand_slug,
            ));

            if (is_wp_error($term)) {
                if ($logger) {
                    $logger->log('Failed to create brand term: ' . $term->get_error_message(), 'ERROR');
                }
                return false;
            }

            $term_id = $term['term_id'];
        } else {
            $term_id = $term->term_id;
        }

        wp_set_object_terms($product_id, array((int) $term_id), 'product_brand');

        return true;
    }

    private function set_attribute_brand($product_id, $brand_name, $logger = null) {
        $brand_taxonomy = 'pa_brand';
        $previous_language = null;

        if (class_exists('Shopify_Importer_WPML_Helper') && Shopify_Importer_WPML_Helper::is_active()) {
            $previous_language = apply_filters('wpml_current_language', null);
            $default_language = apply_filters('wpml_default_language', 'en');
            if ($default_language && has_action('wpml_switch_language')) {
                do_action('wpml_switch_language', $default_language);
            }
        }

        if (!taxonomy_exists($brand_taxonomy)) {
            $attribute_id = wc_create_attribute(array(
                'name' => 'Brand',
                'slug' => 'brand',
                'type' => 'select',
                'order_by' => 'menu_order',
                'has_archives' => true,
            ));

            if (is_wp_error($attribute_id)) {
                if ($logger) {
                    $logger->log('Failed to create brand attribute: ' . $attribute_id->get_error_message(), 'ERROR');
                }
                if ($previous_language && has_action('wpml_switch_language')) {
                    do_action('wpml_switch_language', $previous_language);
                }
                return false;
            }

            register_taxonomy($brand_taxonomy, array('product'), array(
                'hierarchical' => false,
                'label' => 'Brands',
                'show_ui' => true,
                'query_var' => true,
                'rewrite' => array('slug' => 'brand'),
            ));
        }

        $term_id = $this->resolve_attribute_brand_term_id($brand_name, $brand_taxonomy, $logger);
        if (!$term_id) {
            if ($previous_language && has_action('wpml_switch_language')) {
                do_action('wpml_switch_language', $previous_language);
            }
            return false;
        }

        wp_set_object_terms($product_id, array($term_id), $brand_taxonomy, false);

        $product = wc_get_product($product_id);
        if (!$product) {
            if ($previous_language && has_action('wpml_switch_language')) {
                do_action('wpml_switch_language', $previous_language);
            }
            return false;
        }

        $attributes = $product->get_attributes();
        $brand_attribute = new WC_Product_Attribute();
        $attribute_id = wc_attribute_taxonomy_id_by_name($brand_taxonomy);
        if ($attribute_id) {
            $brand_attribute->set_id($attribute_id);
        }
        $brand_attribute->set_name($brand_taxonomy);
        $brand_attribute->set_options(array($term_id));
        $brand_attribute->set_visible(true);
        $brand_attribute->set_variation(false);

        $attributes[$brand_taxonomy] = $brand_attribute;
        $product->set_attributes($attributes);
        $product->save();

        if ($previous_language && has_action('wpml_switch_language')) {
            do_action('wpml_switch_language', $previous_language);
        }

        return true;
    }

    private function resolve_attribute_brand_term_id($brand_name, $brand_taxonomy, $logger = null) {
        $canonical_slug = sanitize_title($brand_name);
        $aliases = $this->get_brand_slug_aliases();
        if (isset($aliases[$canonical_slug])) {
            $canonical_slug = $aliases[$canonical_slug];
        }

        global $wpdb;

        $term_id = (int) $wpdb->get_var(
            $wpdb->prepare(
                "SELECT t.term_id
                FROM {$wpdb->terms} t
                INNER JOIN {$wpdb->term_taxonomy} tt ON t.term_id = tt.term_id
                WHERE tt.taxonomy = %s AND t.slug = %s
                LIMIT 1",
                $brand_taxonomy,
                $canonical_slug
            )
        );

        if ($term_id > 0) {
            return $term_id;
        }

        $display_name = $this->brand_display_name($canonical_slug);
        if ($display_name === null) {
            $display_name = $brand_name;
        }

        $term = wp_insert_term(
            $display_name,
            $brand_taxonomy,
            array(
                'slug' => $canonical_slug,
            )
        );

        if (is_wp_error($term)) {
            if ($term->get_error_code() === 'term_exists') {
                $existing_id = (int) $term->get_error_data('term_exists');
                return $existing_id > 0 ? $existing_id : 0;
            }

            if ($logger) {
                $logger->log('Failed to create brand term: ' . $term->get_error_message(), 'ERROR');
            }
            return 0;
        }

        return (int) $term['term_id'];
    }
}
