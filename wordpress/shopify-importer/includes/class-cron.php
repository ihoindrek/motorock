<?php

if (!defined('ABSPATH')) {
    exit;
}

class Shopify_Importer_Cron {

    const HOOK = 'shopify_importer_run_scheduled_imports';

    public static function init() {
        add_filter('cron_schedules', array(__CLASS__, 'add_schedules'));
        add_action(self::HOOK, array(__CLASS__, 'run_scheduled_imports'));
    }

    public static function add_schedules($schedules) {
        $schedules['shopify_every_12_hours'] = array(
            'interval' => 12 * HOUR_IN_SECONDS,
            'display' => 'Every 12 Hours',
        );
        return $schedules;
    }

    public static function reschedule() {
        self::clear_schedules();

        $sites = Shopify_Importer_Site_Manager::get_cron_sites();
        if (empty($sites)) {
            return;
        }

        $interval = self::get_shortest_interval($sites);
        if (!wp_next_scheduled(self::HOOK)) {
            wp_schedule_event(time() + MINUTE_IN_SECONDS, $interval, self::HOOK);
        }
    }

    public static function clear_schedules() {
        $timestamp = wp_next_scheduled(self::HOOK);
        while ($timestamp) {
            wp_unschedule_event($timestamp, self::HOOK);
            $timestamp = wp_next_scheduled(self::HOOK);
        }
    }

    private static function get_shortest_interval($sites) {
        $intervals = array(
            'hourly' => HOUR_IN_SECONDS,
            'twicedaily' => 12 * HOUR_IN_SECONDS,
            'daily' => DAY_IN_SECONDS,
            'weekly' => WEEK_IN_SECONDS,
        );

        $shortest = DAY_IN_SECONDS;
        $schedule = 'daily';

        foreach ($sites as $site) {
            $site_interval = isset($site['cron_interval']) ? $site['cron_interval'] : 'daily';
            $seconds = isset($intervals[$site_interval]) ? $intervals[$site_interval] : DAY_IN_SECONDS;
            if ($seconds < $shortest) {
                $shortest = $seconds;
                $schedule = $site_interval;
            }
        }

        return $schedule;
    }

    public static function run_scheduled_imports() {
        $sites = Shopify_Importer_Site_Manager::get_cron_sites();

        foreach ($sites as $site_id => $site) {
            if (!$site) {
                continue;
            }

            if (empty($site['product_collection_map']) && !empty($site['collections'])) {
                $api = new Shopify_Importer_API($site['url']);
                $map = $api->build_product_collection_map($site['collections']);
                Shopify_Importer_Site_Manager::update_site($site_id, array(
                    'product_collection_map' => $map,
                ));
            }

            $site = Shopify_Importer_Site_Manager::get_site($site_id);
            $importer = new Shopify_Importer_Product_Importer($site);
            $importer->run_full_import();
        }
    }

    public static function get_next_run() {
        $timestamp = wp_next_scheduled(self::HOOK);
        return $timestamp ? $timestamp : false;
    }
}
