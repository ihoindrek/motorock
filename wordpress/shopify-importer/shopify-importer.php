<?php
/**
 * Plugin Name: Shopify Importer
 * Description: Import products from Shopify storefronts (products.json / collections.json)
 * Version: 1.0.8
 * Author: Bearz
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * WC requires at least: 5.0
 */

if (!defined('ABSPATH')) {
    exit;
}

define('SHOPIFY_IMPORTER_VERSION', '1.0.8');
define('SHOPIFY_IMPORTER_PLUGIN_FILE', __FILE__);
define('SHOPIFY_IMPORTER_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('SHOPIFY_IMPORTER_PLUGIN_URL', plugin_dir_url(__FILE__));
define('SHOPIFY_IMPORTER_OPTION', 'shopify_importer_sites');

class Shopify_Importer {

    private static $instance = null;

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        if (!class_exists('WooCommerce')) {
            add_action('admin_notices', array($this, 'woocommerce_missing_notice'));
            return;
        }

        $this->load_dependencies();
        $this->init_hooks();
    }

    public function woocommerce_missing_notice() {
        echo '<div class="notice notice-error"><p><strong>Shopify Importer</strong> requires WooCommerce.</p></div>';
    }

    private function load_dependencies() {
        require_once SHOPIFY_IMPORTER_PLUGIN_DIR . 'includes/class-logger.php';
        require_once SHOPIFY_IMPORTER_PLUGIN_DIR . 'includes/class-site-manager.php';
        require_once SHOPIFY_IMPORTER_PLUGIN_DIR . 'includes/class-shopify-api.php';
        require_once SHOPIFY_IMPORTER_PLUGIN_DIR . 'includes/class-shopify-json-mapper.php';
        require_once SHOPIFY_IMPORTER_PLUGIN_DIR . 'includes/class-attribute-handler.php';
        require_once SHOPIFY_IMPORTER_PLUGIN_DIR . 'includes/class-variation-creator.php';
        require_once SHOPIFY_IMPORTER_PLUGIN_DIR . 'includes/class-image-downloader.php';
        require_once SHOPIFY_IMPORTER_PLUGIN_DIR . 'includes/class-brand-handler.php';
        require_once SHOPIFY_IMPORTER_PLUGIN_DIR . 'includes/class-product-importer.php';
        require_once SHOPIFY_IMPORTER_PLUGIN_DIR . 'includes/class-price-helper.php';
        require_once SHOPIFY_IMPORTER_PLUGIN_DIR . 'includes/class-wpml-helper.php';
        require_once SHOPIFY_IMPORTER_PLUGIN_DIR . 'includes/class-price-updater.php';
        require_once SHOPIFY_IMPORTER_PLUGIN_DIR . 'includes/class-category-resolver.php';
        require_once SHOPIFY_IMPORTER_PLUGIN_DIR . 'includes/class-category-updater.php';
        require_once SHOPIFY_IMPORTER_PLUGIN_DIR . 'includes/class-product-cleaner.php';
        require_once SHOPIFY_IMPORTER_PLUGIN_DIR . 'includes/class-product-sync.php';
        require_once SHOPIFY_IMPORTER_PLUGIN_DIR . 'includes/class-cron.php';

        if (is_admin()) {
            require_once SHOPIFY_IMPORTER_PLUGIN_DIR . 'includes/admin/class-admin-menu.php';
        }
    }

    private function init_hooks() {
        add_action('init', array($this, 'load_textdomain'));
        add_action('before_woocommerce_init', array($this, 'declare_hpos_compatibility'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_assets'));

        add_action('wp_ajax_shopify_importer_scan_collections', array($this, 'ajax_scan_collections'));
        add_action('wp_ajax_shopify_importer_save_mappings', array($this, 'ajax_save_mappings'));
        add_action('wp_ajax_shopify_importer_run_import', array($this, 'ajax_run_import'));
        add_action('wp_ajax_shopify_importer_update_prices', array($this, 'ajax_update_prices'));
        add_action('wp_ajax_shopify_importer_update_categories', array($this, 'ajax_update_categories'));
        add_action('wp_ajax_shopify_importer_save_site', array($this, 'ajax_save_site'));
        add_action('wp_ajax_shopify_importer_delete_site', array($this, 'ajax_delete_site'));
        add_action('wp_ajax_shopify_importer_delete_products', array($this, 'ajax_delete_products'));

        Shopify_Importer_Cron::init();

        if (is_admin()) {
            new Shopify_Importer_Admin_Menu();
        }
    }

    public function load_textdomain() {
        load_plugin_textdomain('shopify-importer', false, dirname(plugin_basename(__FILE__)) . '/languages');
    }

    public function declare_hpos_compatibility() {
        if (class_exists('\Automattic\WooCommerce\Utilities\FeaturesUtil')) {
            \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility('custom_order_tables', SHOPIFY_IMPORTER_PLUGIN_FILE, true);
        }
    }

    public function enqueue_admin_assets($hook) {
        if (empty($hook) || strpos($hook, 'shopify-importer') === false) {
            return;
        }

        wp_enqueue_style(
            'shopify-importer-admin',
            SHOPIFY_IMPORTER_PLUGIN_URL . 'assets/css/admin.css',
            array(),
            SHOPIFY_IMPORTER_VERSION
        );

        wp_enqueue_script(
            'shopify-importer-admin',
            SHOPIFY_IMPORTER_PLUGIN_URL . 'assets/js/admin.js',
            array('jquery'),
            SHOPIFY_IMPORTER_VERSION,
            true
        );

        wp_localize_script('shopify-importer-admin', 'shopifyImporter', array(
            'ajaxurl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('shopify_importer_nonce'),
        ));
    }

    private function verify_ajax() {
        check_ajax_referer('shopify_importer_nonce', 'nonce');

        if (!current_user_can('manage_woocommerce')) {
            wp_send_json_error(array('message' => 'Insufficient permissions'));
        }
    }

    public function ajax_save_site() {
        $this->verify_ajax();

        $site_id = isset($_POST['site_id']) ? sanitize_key($_POST['site_id']) : '';
        $name = isset($_POST['name']) ? sanitize_text_field(wp_unslash($_POST['name'])) : '';
        $url = isset($_POST['url']) ? esc_url_raw(wp_unslash($_POST['url'])) : '';
        $brand = isset($_POST['brand']) ? sanitize_text_field(wp_unslash($_POST['brand'])) : '';
        $price_multiplier = isset($_POST['price_multiplier']) ? floatval(wp_unslash($_POST['price_multiplier'])) : 1;
        $cron_enabled = !empty($_POST['cron_enabled']);
        $cron_interval = isset($_POST['cron_interval']) ? sanitize_text_field($_POST['cron_interval']) : 'daily';

        if (empty($name) || empty($url) || empty($brand)) {
            wp_send_json_error(array('message' => 'Name, URL and brand are required.'));
        }

        $normalized = Shopify_Importer_API::normalize_url($url);
        if (!$normalized) {
            wp_send_json_error(array('message' => 'Invalid Shopify store URL.'));
        }

        $api = new Shopify_Importer_API($normalized);
        if (!$api->test_connection()) {
            wp_send_json_error(array('message' => 'Could not connect to Shopify store. Check the URL.'));
        }

        if (empty($site_id)) {
            $site_id = Shopify_Importer_Site_Manager::generate_id($normalized);
        }

        $site = Shopify_Importer_Site_Manager::save_site($site_id, array(
            'name' => $name,
            'url' => $normalized,
            'brand' => $brand,
            'price_multiplier' => $price_multiplier > 0 ? $price_multiplier : 1,
            'cron_enabled' => $cron_enabled,
            'cron_interval' => $cron_interval,
        ));

        Shopify_Importer_Cron::reschedule();

        wp_send_json_success(array(
            'message' => 'Site saved.',
            'site' => $site,
            'redirect' => admin_url('admin.php?page=shopify-importer-edit&site_id=' . $site_id),
        ));
    }

    public function ajax_delete_site() {
        $this->verify_ajax();

        $site_id = isset($_POST['site_id']) ? sanitize_key($_POST['site_id']) : '';
        if (empty($site_id)) {
            wp_send_json_error(array('message' => 'Site ID required.'));
        }

        Shopify_Importer_Site_Manager::delete_site($site_id);
        Shopify_Importer_Cron::reschedule();

        wp_send_json_success(array('message' => 'Site deleted.'));
    }

    public function ajax_delete_products() {
        $this->verify_ajax();

        $site_id = isset($_POST['site_id']) ? sanitize_key($_POST['site_id']) : '';
        if (empty($site_id)) {
            wp_send_json_error(array('message' => 'Site ID required.'));
        }

        $site = Shopify_Importer_Site_Manager::get_site($site_id);
        if (!$site) {
            wp_send_json_error(array('message' => 'Site not found.'));
        }

        $result = Shopify_Importer_Product_Cleaner::delete_site_products($site_id);

        if (!$result['success']) {
            wp_send_json_error(array('message' => $result['message']));
        }

        wp_send_json_success($result);
    }

    public function ajax_scan_collections() {
        $this->verify_ajax();

        $site_id = isset($_POST['site_id']) ? sanitize_key($_POST['site_id']) : '';
        $site = Shopify_Importer_Site_Manager::get_site($site_id);

        if (!$site) {
            wp_send_json_error(array('message' => 'Site not found.'));
        }

        $api = new Shopify_Importer_API($site['url']);
        $collections = $api->fetch_all_collections();

        if ($collections === false) {
            wp_send_json_error(array('message' => 'Failed to fetch collections.'));
        }

        $product_map = $api->build_product_collection_map($collections);

        Shopify_Importer_Site_Manager::update_site($site_id, array(
            'collections' => $collections,
            'product_collection_map' => $product_map,
            'collections_scanned_at' => current_time('mysql'),
        ));

        $motorock_options = Shopify_Importer_Site_Manager::get_category_dropdown_options(
            isset($site['category_mappings']) ? $site['category_mappings'] : array()
        );

        $rows = array();
        foreach ($collections as $collection) {
            $mapped = isset($site['category_mappings'][$collection['id']]) ? $site['category_mappings'][$collection['id']] : '';
            $rows[] = array(
                'id' => $collection['id'],
                'title' => $collection['title'],
                'handle' => $collection['handle'],
                'products_count' => $collection['products_count'],
                'is_catch_all' => Shopify_Importer_Site_Manager::is_catch_all_collection($collection),
                'dropdown' => Shopify_Importer_Site_Manager::render_category_dropdown($collection['id'], $mapped, $motorock_options),
            );
        }

        wp_send_json_success(array(
            'message' => 'Found ' . count($collections) . ' collections.',
            'collections' => $rows,
        ));
    }

    public function ajax_save_mappings() {
        $this->verify_ajax();

        $site_id = isset($_POST['site_id']) ? sanitize_key($_POST['site_id']) : '';
        $mappings = isset($_POST['mappings']) ? json_decode(stripslashes($_POST['mappings']), true) : array();

        if (empty($site_id)) {
            wp_send_json_error(array('message' => 'Site ID required.'));
        }

        Shopify_Importer_Site_Manager::update_site($site_id, array(
            'category_mappings' => is_array($mappings) ? $mappings : array(),
        ));

        wp_send_json_success(array('message' => 'Category mappings saved.'));
    }

    public function ajax_run_import() {
        $this->verify_ajax();

        $site_id = isset($_POST['site_id']) ? sanitize_key($_POST['site_id']) : '';
        $page = isset($_POST['page']) ? max(1, intval($_POST['page'])) : 1;
        $batch = isset($_POST['batch']) ? max(0, intval($_POST['batch'])) : 0;
        $session_key = isset($_POST['session_key']) ? sanitize_key($_POST['session_key']) : '';

        $site = Shopify_Importer_Site_Manager::get_site($site_id);
        if (!$site) {
            wp_send_json_error(array('message' => 'Site not found.'));
        }

        try {
            $importer = new Shopify_Importer_Product_Importer($site);
            $result = $importer->import_batch($page, $batch, $session_key);
            wp_send_json_success($result);
        } catch (Throwable $e) {
            wp_send_json_error(array('message' => $e->getMessage()));
        }
    }

    public function ajax_update_prices() {
        $this->verify_ajax();

        $site_id = isset($_POST['site_id']) ? sanitize_key($_POST['site_id']) : '';
        $page = isset($_POST['page']) ? max(1, intval($_POST['page'])) : 1;
        $batch = isset($_POST['batch']) ? max(0, intval($_POST['batch'])) : 0;
        $session_key = isset($_POST['session_key']) ? sanitize_key($_POST['session_key']) : '';

        $site = Shopify_Importer_Site_Manager::get_site($site_id);
        if (!$site) {
            wp_send_json_error(array('message' => 'Site not found.'));
        }

        try {
            $updater = new Shopify_Importer_Price_Updater($site);
            $result = $updater->update_batch($page, $batch, $session_key);
            wp_send_json_success($result);
        } catch (Throwable $e) {
            wp_send_json_error(array('message' => $e->getMessage()));
        }
    }

    public function ajax_update_categories() {
        $this->verify_ajax();

        $site_id = isset($_POST['site_id']) ? sanitize_key($_POST['site_id']) : '';
        $page = isset($_POST['page']) ? max(1, intval($_POST['page'])) : 1;
        $batch = isset($_POST['batch']) ? max(0, intval($_POST['batch'])) : 0;
        $session_key = isset($_POST['session_key']) ? sanitize_key($_POST['session_key']) : '';

        $site = Shopify_Importer_Site_Manager::get_site($site_id);
        if (!$site) {
            wp_send_json_error(array('message' => 'Site not found.'));
        }

        try {
            $updater = new Shopify_Importer_Category_Updater($site);
            $result = $updater->update_batch($page, $batch, $session_key);
            wp_send_json_success($result);
        } catch (Throwable $e) {
            wp_send_json_error(array('message' => $e->getMessage()));
        }
    }
}

function shopify_importer_activate() {
    require_once SHOPIFY_IMPORTER_PLUGIN_DIR . 'includes/class-site-manager.php';
    require_once SHOPIFY_IMPORTER_PLUGIN_DIR . 'includes/class-cron.php';

    $upload_dir = wp_upload_dir();
    $log_dir = $upload_dir['basedir'] . '/shopify-importer';

    if (!file_exists($log_dir)) {
        wp_mkdir_p($log_dir);
    }

    Shopify_Importer_Cron::reschedule();
}
register_activation_hook(__FILE__, 'shopify_importer_activate');

function shopify_importer_deactivate() {
    require_once SHOPIFY_IMPORTER_PLUGIN_DIR . 'includes/class-cron.php';

    Shopify_Importer_Cron::clear_schedules();
}
register_deactivation_hook(__FILE__, 'shopify_importer_deactivate');

add_action('plugins_loaded', function () {
    Shopify_Importer::get_instance();
});
