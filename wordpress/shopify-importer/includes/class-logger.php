<?php

if (!defined('ABSPATH')) {
    exit;
}

class Shopify_Importer_Logger {

    private $log_file;

    public function __construct($site_id = 'general', $existing_log_file = '') {
        if (!empty($existing_log_file) && file_exists($existing_log_file)) {
            $this->log_file = $existing_log_file;
            return;
        }

        $upload_dir = wp_upload_dir();
        $log_dir = $upload_dir['basedir'] . '/shopify-importer';

        if (!file_exists($log_dir)) {
            wp_mkdir_p($log_dir);
        }

        $this->log_file = $log_dir . '/import-' . sanitize_file_name($site_id) . '-' . date('Y-m-d-His') . '.log';
    }

    public function log($message, $level = 'INFO') {
        $line = '[' . date('Y-m-d H:i:s') . '] [' . $level . '] ' . $message;
        file_put_contents($this->log_file, $line . PHP_EOL, FILE_APPEND);
        return $line;
    }

    public function get_log_file() {
        return $this->log_file;
    }

    public function get_log_url() {
        $upload_dir = wp_upload_dir();
        return $upload_dir['baseurl'] . '/shopify-importer/' . basename($this->log_file);
    }
}
