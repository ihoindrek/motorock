<?php

if (!defined('ABSPATH')) {
    exit;
}

class Motorock_Catalog_Importer_Session_Store {

    private static function sessions_dir() {
        $upload_dir = wp_upload_dir();
        $dir = trailingslashit($upload_dir['basedir']) . 'motorock-catalog-importer/sessions';
        if (!file_exists($dir)) {
            wp_mkdir_p($dir);
        }
        return $dir;
    }

    private static function session_path($session_key) {
        return self::sessions_dir() . '/' . sanitize_file_name($session_key) . '.json';
    }

    public static function save($session_key, array $session) {
        $path = self::session_path($session_key);
        file_put_contents($path, wp_json_encode($session));
    }

    public static function load($session_key) {
        $path = self::session_path($session_key);
        if (!file_exists($path)) {
            return null;
        }

        $data = json_decode(file_get_contents($path), true);
        return is_array($data) ? $data : null;
    }

    public static function delete($session_key) {
        $path = self::session_path($session_key);
        if (file_exists($path)) {
            @unlink($path);
        }
    }
}
