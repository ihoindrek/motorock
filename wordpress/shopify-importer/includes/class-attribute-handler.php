<?php

if (!defined('ABSPATH')) {
    exit;
}

class Shopify_Importer_Attribute_Handler {

    public function create_global_attribute($attribute_name) {
        $attribute_slug = 'pa_' . sanitize_title($attribute_name);
        $attribute_id = wc_attribute_taxonomy_id_by_name($attribute_slug);

        if ($attribute_id) {
            return $attribute_slug;
        }

        $attribute_id = wc_create_attribute(array(
            'name' => $attribute_name,
            'slug' => sanitize_title($attribute_name),
            'type' => 'select',
            'order_by' => 'menu_order',
            'has_archives' => false,
        ));

        if (is_wp_error($attribute_id)) {
            return false;
        }

        register_taxonomy($attribute_slug, array('product'), array(
            'hierarchical' => false,
            'label' => $attribute_name,
            'query_var' => true,
            'rewrite' => false,
        ));

        return $attribute_slug;
    }

    public function create_attribute_term($attribute_slug, $term_name) {
        $term = get_term_by('name', $term_name, $attribute_slug);
        if ($term) {
            return $term;
        }

        $term = get_term_by('slug', sanitize_title($term_name), $attribute_slug);
        if ($term) {
            return $term;
        }

        $result = wp_insert_term($term_name, $attribute_slug);
        if (is_wp_error($result)) {
            if ($result->get_error_code() === 'term_exists') {
                return get_term($result->get_error_data('term_exists'), $attribute_slug);
            }
            return false;
        }

        return get_term($result['term_id'], $attribute_slug);
    }

    public function set_product_attributes($product_id, $attribute_data) {
        if (empty($attribute_data)) {
            return false;
        }

        $product = wc_get_product($product_id);
        if (!$product) {
            return false;
        }

        $existing_attributes = $product->get_attributes();
        $attributes = array();

        foreach ($attribute_data as $attr_name => $attr_values) {
            $attribute_slug = $this->create_global_attribute($attr_name);
            if (!$attribute_slug) {
                continue;
            }

            $term_ids = array();
            foreach ($attr_values as $attr_value) {
                $term = $this->create_attribute_term($attribute_slug, $attr_value);
                if ($term) {
                    $term_ids[] = $term->term_id;
                }
            }

            wp_set_object_terms($product_id, $term_ids, $attribute_slug);

            $attribute = new WC_Product_Attribute();
            $attribute->set_id(wc_attribute_taxonomy_id_by_name($attribute_slug));
            $attribute->set_name($attribute_slug);
            $attribute->set_options($term_ids);
            $attribute->set_visible(true);
            $attribute->set_variation(true);

            $attributes[] = $attribute;
        }

        if (isset($existing_attributes['pa_brand'])) {
            $attributes['pa_brand'] = $existing_attributes['pa_brand'];
        }

        $product->set_attributes($attributes);
        $product->save();
        wc_delete_product_transients($product_id);

        return true;
    }
}
