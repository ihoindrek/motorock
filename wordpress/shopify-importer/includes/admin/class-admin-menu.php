<?php

if (!defined('ABSPATH')) {
    exit;
}

class Shopify_Importer_Admin_Menu {

    public function __construct() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_head', array($this, 'hide_edit_submenu_css'));
    }

    public function add_admin_menu() {
        add_menu_page(
            'Shopify Importer',
            'Shopify Importer',
            'manage_woocommerce',
            'shopify-importer',
            array($this, 'render_sites_page'),
            'dashicons-cart',
            57
        );

        add_submenu_page(
            'shopify-importer',
            'Import Sites',
            'Import Sites',
            'manage_woocommerce',
            'shopify-importer',
            array($this, 'render_sites_page')
        );

        add_submenu_page(
            'shopify-importer',
            'Edit Site',
            'Edit Site',
            'manage_woocommerce',
            'shopify-importer-edit',
            array($this, 'render_edit_page')
        );
    }

    public function hide_edit_submenu_css() {
        echo '<style>#toplevel_page_shopify-importer .wp-submenu a[href*="page=shopify-importer-edit"] { display: none !important; }</style>';
    }

    public function render_sites_page() {
        include SHOPIFY_IMPORTER_PLUGIN_DIR . 'includes/admin/views/sites-list.php';
    }

    public function render_edit_page() {
        include SHOPIFY_IMPORTER_PLUGIN_DIR . 'includes/admin/views/site-edit.php';
    }
}
