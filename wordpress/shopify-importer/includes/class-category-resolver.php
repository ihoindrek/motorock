<?php

if (!defined('ABSPATH')) {
    exit;
}

class Shopify_Importer_Category_Resolver {

    private $category_mappings;
    private $collections_by_id;
    private $default_category_id;

    public function __construct($site) {
        $this->category_mappings = isset($site['category_mappings']) ? $site['category_mappings'] : array();
        $this->default_category_id = Shopify_Importer_Site_Manager::get_default_category_id();
        $this->collections_by_id = array();

        foreach (isset($site['collections']) ? $site['collections'] : array() as $collection) {
            if (!empty($collection['id'])) {
                $this->collections_by_id[(string) $collection['id']] = $collection;
            }
        }
    }

    public function resolve($collection_ids) {
        $category_ids = array();
        $sources = array();

        foreach ($collection_ids as $collection_id) {
            if ($this->is_catch_all_collection($collection_id)) {
                continue;
            }

            $mapped_id = $this->get_mapped_category_id($collection_id);
            if (!$mapped_id) {
                continue;
            }

            $category_ids[] = $mapped_id;

            $meta = $this->get_collection_meta($collection_id);
            $sources[] = $meta ? $meta['title'] : (string) $collection_id;
        }

        $category_ids = array_values(array_unique(array_filter($category_ids)));
        $used_default = false;

        if (empty($category_ids) && $this->default_category_id) {
            $category_ids[] = $this->default_category_id;
            $used_default = true;
        }

        return array(
            'category_ids' => $category_ids,
            'sources' => $sources,
            'used_default' => $used_default,
        );
    }

    public function get_category_label($category_ids) {
        $labels = array();

        foreach ($category_ids as $category_id) {
            $term = get_term((int) $category_id, 'product_cat');
            if ($term && !is_wp_error($term)) {
                $labels[] = $term->name;
            } else {
                $labels[] = 'ID ' . $category_id;
            }
        }

        return implode(', ', $labels);
    }

    private function get_collection_meta($collection_id) {
        $key = (string) $collection_id;
        return isset($this->collections_by_id[$key]) ? $this->collections_by_id[$key] : null;
    }

    private function is_catch_all_collection($collection_id) {
        $meta = $this->get_collection_meta($collection_id);
        if (!$meta) {
            return false;
        }

        return Shopify_Importer_Site_Manager::is_catch_all_collection($meta);
    }

    private function get_mapped_category_id($collection_id) {
        $key = (string) $collection_id;

        if (isset($this->category_mappings[$collection_id]) && !empty($this->category_mappings[$collection_id])) {
            return (int) $this->category_mappings[$collection_id];
        }

        if (isset($this->category_mappings[$key]) && !empty($this->category_mappings[$key])) {
            return (int) $this->category_mappings[$key];
        }

        return 0;
    }
}
