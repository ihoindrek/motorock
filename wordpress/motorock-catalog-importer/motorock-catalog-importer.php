<?php
/**
 * Plugin Name: Motorock Catalog Importer
 * Description: Universal catalog import for WooCommerce — CSV feeds with enrichment (Holy Freedom / PrestaShop) and future supplier adapters.
 * Version: 0.2.0
 * Author: Motorock
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * Text Domain: motorock-catalog-importer
 */

if (!defined('ABSPATH')) {
    exit;
}

define('MOTOROCK_CATALOG_IMPORTER_VERSION', '0.2.0');
define('MOTOROCK_CATALOG_IMPORTER_FILE', __FILE__);
define('MOTOROCK_CATALOG_IMPORTER_DIR', plugin_dir_path(__FILE__));
define('MOTOROCK_CATALOG_IMPORTER_URL', plugin_dir_url(__FILE__));
define('MOTOROCK_CATALOG_IMPORTER_OPTION', 'motorock_catalog_feeds');

final class Motorock_Catalog_Importer_Plugin {

    /** @var Motorock_Catalog_Importer_Plugin|null */
    private static $instance = null;

    public static function instance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }

        return self::$instance;
    }

    private function __construct() {
        add_action('plugins_loaded', array($this, 'boot'));
    }

    public function boot() {
        if (!class_exists('WooCommerce')) {
            add_action('admin_notices', array($this, 'woocommerce_missing_notice'));
            return;
        }

        $this->includes();
        Motorock_Catalog_Importer_Admin_Menu::init();

        add_action('wp_ajax_motorock_catalog_save_feed', array($this, 'ajax_save_feed'));
        add_action('wp_ajax_motorock_catalog_upload_csv', array($this, 'ajax_upload_csv'));
        add_action('wp_ajax_motorock_catalog_prepare_import', array($this, 'ajax_prepare_import'));
        add_action('wp_ajax_motorock_catalog_run_import', array($this, 'ajax_run_import'));
        add_action('wp_ajax_motorock_catalog_delete_feed', array($this, 'ajax_delete_feed'));
    }

    public function woocommerce_missing_notice() {
        echo '<div class="notice notice-error"><p><strong>Motorock Catalog Importer</strong> vajab WooCommerce\'i.</p></div>';
    }

    private function includes() {
        require_once MOTOROCK_CATALOG_IMPORTER_DIR . 'includes/interface-feed-adapter.php';
        require_once MOTOROCK_CATALOG_IMPORTER_DIR . 'includes/shared/class-sku-lookup.php';
        require_once MOTOROCK_CATALOG_IMPORTER_DIR . 'includes/shared/class-brand-bridge.php';
        require_once MOTOROCK_CATALOG_IMPORTER_DIR . 'includes/shared/class-wpml-bridge.php';
        require_once MOTOROCK_CATALOG_IMPORTER_DIR . 'includes/shared/class-session-store.php';
        require_once MOTOROCK_CATALOG_IMPORTER_DIR . 'includes/shared/class-adapter-base.php';
        require_once MOTOROCK_CATALOG_IMPORTER_DIR . 'includes/class-feed-manager.php';
        require_once MOTOROCK_CATALOG_IMPORTER_DIR . 'includes/class-logger.php';
        require_once MOTOROCK_CATALOG_IMPORTER_DIR . 'includes/class-csv-parser.php';
        require_once MOTOROCK_CATALOG_IMPORTER_DIR . 'includes/class-prestashop-scraper.php';
        require_once MOTOROCK_CATALOG_IMPORTER_DIR . 'includes/adapters/class-holyfreedom-adapter.php';
        require_once MOTOROCK_CATALOG_IMPORTER_DIR . 'includes/adapters/class-generic-csv-adapter.php';
        require_once MOTOROCK_CATALOG_IMPORTER_DIR . 'includes/class-image-downloader.php';
        require_once MOTOROCK_CATALOG_IMPORTER_DIR . 'includes/class-attribute-normalizer.php';
        require_once MOTOROCK_CATALOG_IMPORTER_DIR . 'includes/class-product-writer.php';
        require_once MOTOROCK_CATALOG_IMPORTER_DIR . 'includes/class-import-runner.php';
        require_once MOTOROCK_CATALOG_IMPORTER_DIR . 'includes/admin/class-admin-menu.php';
    }

    private function verify_ajax() {
        check_ajax_referer('motorock_catalog_importer_nonce', 'nonce');

        if (!current_user_can('manage_woocommerce')) {
            wp_send_json_error(array('message' => 'Insufficient permissions.'), 403);
        }
    }

    public function ajax_save_feed() {
        $this->verify_ajax();

        $feed_id = isset($_POST['feed_id']) ? sanitize_key(wp_unslash($_POST['feed_id'])) : '';
        $is_new = empty($feed_id);

        if ($is_new) {
            $name = isset($_POST['name']) ? sanitize_text_field(wp_unslash($_POST['name'])) : '';
            $adapter = isset($_POST['adapter']) ? sanitize_key(wp_unslash($_POST['adapter'])) : 'holyfreedom';
            $feed_id = Motorock_Catalog_Importer_Feed_Manager::generate_id($name !== '' ? $name : $adapter);
        }

        $feed = Motorock_Catalog_Importer_Feed_Manager::get_feed($feed_id);
        if (!$feed && !$is_new) {
            wp_send_json_error(array('message' => 'Feed not found.'));
        }

        $category_mappings = array();
        if (!empty($_POST['category_mappings']) && is_array($_POST['category_mappings'])) {
            foreach ($_POST['category_mappings'] as $source => $term_id) {
                $source = sanitize_text_field(wp_unslash($source));
                $term_id = (int) $term_id;
                if ($source !== '' && $term_id > 0) {
                    $category_mappings[$source] = $term_id;
                }
            }
        }

        $column_map = array();
        if (!empty($_POST['column_map']) && is_array($_POST['column_map'])) {
            foreach ($_POST['column_map'] as $field => $column) {
                $field = sanitize_key(wp_unslash($field));
                $column = sanitize_text_field(wp_unslash($column));
                if ($field !== '' && $column !== '') {
                    $column_map[$field] = $column;
                }
            }
        }

        $default_import_mode = isset($_POST['default_import_mode']) && wp_unslash($_POST['default_import_mode']) === 'update_only'
            ? 'update_only'
            : 'full';

        $saved = Motorock_Catalog_Importer_Feed_Manager::save_feed($feed_id, array(
            'name' => isset($_POST['name']) ? sanitize_text_field(wp_unslash($_POST['name'])) : '',
            'adapter' => isset($_POST['adapter']) ? sanitize_key(wp_unslash($_POST['adapter'])) : 'holyfreedom',
            'brand' => isset($_POST['brand']) ? sanitize_text_field(wp_unslash($_POST['brand'])) : '',
            'price_multiplier' => isset($_POST['price_multiplier']) ? (float) wp_unslash($_POST['price_multiplier']) : 1,
            'category_mappings' => $category_mappings,
            'column_map' => $column_map,
            'default_import_mode' => $default_import_mode,
        ));

        wp_send_json_success(array(
            'message' => 'Feed saved.',
            'feed_id' => $feed_id,
            'redirect' => admin_url('admin.php?page=motorock-catalog-importer-edit&feed_id=' . $feed_id),
        ));
    }

    public function ajax_upload_csv() {
        $this->verify_ajax();

        $feed_id = isset($_POST['feed_id']) ? sanitize_key(wp_unslash($_POST['feed_id'])) : '';
        $feed = Motorock_Catalog_Importer_Feed_Manager::get_feed($feed_id);

        if (!$feed) {
            wp_send_json_error(array('message' => 'Feed not found.'));
        }

        if (empty($_FILES['csv_file']) || !is_array($_FILES['csv_file'])) {
            wp_send_json_error(array('message' => 'No CSV file uploaded.'));
        }

        $upload = Motorock_Catalog_Importer_Feed_Manager::store_csv_upload($feed_id, $_FILES['csv_file']);
        if (is_wp_error($upload)) {
            wp_send_json_error(array('message' => $upload->get_error_message()));
        }

        Motorock_Catalog_Importer_Feed_Manager::save_feed($feed_id, array(
            'csv_file' => $upload['file'],
            'csv_original_name' => $upload['original_name'],
            'csv_uploaded_at' => current_time('mysql'),
        ));

        wp_send_json_success(array(
            'message' => 'CSV uploaded: ' . $upload['original_name'],
            'csv_file' => basename($upload['file']),
        ));
    }

    public function ajax_prepare_import() {
        $this->verify_ajax();

        $feed_id = isset($_POST['feed_id']) ? sanitize_key(wp_unslash($_POST['feed_id'])) : '';
        $feed = Motorock_Catalog_Importer_Feed_Manager::get_feed($feed_id);

        if (!$feed || empty($feed['csv_file']) || !file_exists($feed['csv_file'])) {
            wp_send_json_error(array('message' => 'Upload a CSV file first.'));
        }

        $import_mode = isset($_POST['import_mode']) && wp_unslash($_POST['import_mode']) === 'update_only'
            ? 'update_only'
            : 'full';

        try {
            $adapter = Motorock_Catalog_Importer_Feed_Manager::get_adapter($feed);
            $queue = $adapter->build_queue($feed, array('mode' => $import_mode));
        } catch (Throwable $e) {
            wp_send_json_error(array('message' => $e->getMessage()));
        }

        $session_key = 'catalog_import_' . $feed_id . '_' . wp_generate_password(8, false);
        Motorock_Catalog_Importer_Session_Store::save($session_key, array(
            'feed_id' => $feed_id,
            'mode' => $import_mode,
            'queue' => $queue,
            'index' => 0,
            'stats' => array(
                'imported' => 0,
                'updated' => 0,
                'skipped' => 0,
                'failed' => 0,
                'processed' => 0,
            ),
            'log_file' => (new Motorock_Catalog_Importer_Logger($feed_id))->get_log_file(),
        ));

        $mode_label = $import_mode === 'update_only' ? 'stock/price update' : 'full import';
        wp_send_json_success(array(
            'session_key' => $session_key,
            'total' => count($queue),
            'import_mode' => $import_mode,
            'message' => count($queue) . ' rows ready for ' . $mode_label . '.',
        ));
    }

    public function ajax_run_import() {
        $this->verify_ajax();

        $feed_id = isset($_POST['feed_id']) ? sanitize_key(wp_unslash($_POST['feed_id'])) : '';
        $session_key = isset($_POST['session_key']) ? sanitize_text_field(wp_unslash($_POST['session_key'])) : '';
        $index = isset($_POST['index']) ? max(0, (int) $_POST['index']) : 0;

        $feed = Motorock_Catalog_Importer_Feed_Manager::get_feed($feed_id);
        if (!$feed || $session_key === '') {
            wp_send_json_error(array('message' => 'Invalid import session.'));
        }

        $runner = new Motorock_Catalog_Importer_Runner($feed);
        $result = $runner->import_at_index($session_key, $index);

        if (!empty($result['done'])) {
            Motorock_Catalog_Importer_Feed_Manager::save_feed($feed_id, array(
                'last_import_at' => current_time('mysql'),
                'last_import_stats' => $result['stats'],
            ));
        }

        wp_send_json_success($result);
    }

    public function ajax_delete_feed() {
        $this->verify_ajax();

        $feed_id = isset($_POST['feed_id']) ? sanitize_key(wp_unslash($_POST['feed_id'])) : '';
        Motorock_Catalog_Importer_Feed_Manager::delete_feed($feed_id);

        wp_send_json_success(array('message' => 'Feed deleted.'));
    }
}

function motorock_catalog_importer_activate() {
    $upload_dir = wp_upload_dir();
    wp_mkdir_p($upload_dir['basedir'] . '/motorock-catalog-importer');
    wp_mkdir_p($upload_dir['basedir'] . '/motorock-catalog-importer/csv');
    wp_mkdir_p($upload_dir['basedir'] . '/motorock-catalog-importer/cache');
    wp_mkdir_p($upload_dir['basedir'] . '/motorock-catalog-importer/sessions');
}

register_activation_hook(__FILE__, 'motorock_catalog_importer_activate');

Motorock_Catalog_Importer_Plugin::instance();
