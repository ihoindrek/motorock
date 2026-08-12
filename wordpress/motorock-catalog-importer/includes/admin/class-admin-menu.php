<?php

if (!defined('ABSPATH')) {
    exit;
}

class Motorock_Catalog_Importer_Admin_Menu {

    public static function init() {
        add_action('admin_menu', array(__CLASS__, 'register_menu'));
        add_action('admin_enqueue_scripts', array(__CLASS__, 'enqueue_assets'));
    }

    public static function register_menu() {
        add_menu_page(
            'Catalog Import',
            'Catalog Import',
            'manage_woocommerce',
            'motorock-catalog-importer',
            array(__CLASS__, 'render_feeds_list'),
            'dashicons-database-import',
            58
        );

        add_submenu_page(
            'motorock-catalog-importer',
            'All Feeds',
            'All Feeds',
            'manage_woocommerce',
            'motorock-catalog-importer',
            array(__CLASS__, 'render_feeds_list')
        );

        add_submenu_page(
            'motorock-catalog-importer',
            'Edit Feed',
            'Edit Feed',
            'manage_woocommerce',
            'motorock-catalog-importer-edit',
            array(__CLASS__, 'render_feed_edit')
        );
    }

    public static function enqueue_assets($hook) {
        if (strpos($hook, 'motorock-catalog-importer') === false) {
            return;
        }

        wp_enqueue_style(
            'motorock-catalog-importer-admin',
            MOTOROCK_CATALOG_IMPORTER_URL . 'assets/css/admin.css',
            array('select2'),
            MOTOROCK_CATALOG_IMPORTER_VERSION
        );

        wp_enqueue_script('selectWoo');
        wp_enqueue_style('select2');

        wp_enqueue_script(
            'motorock-catalog-importer-admin',
            MOTOROCK_CATALOG_IMPORTER_URL . 'assets/js/admin.js',
            array('jquery', 'selectWoo'),
            MOTOROCK_CATALOG_IMPORTER_VERSION,
            true
        );

        wp_localize_script('motorock-catalog-importer-admin', 'motorockCatalogImporter', array(
            'ajaxurl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('motorock_catalog_importer_nonce'),
        ));
    }

    public static function render_feeds_list() {
        require MOTOROCK_CATALOG_IMPORTER_DIR . 'includes/admin/views/feeds-list.php';
    }

    public static function render_feed_edit() {
        require MOTOROCK_CATALOG_IMPORTER_DIR . 'includes/admin/views/feed-edit.php';
    }
}
