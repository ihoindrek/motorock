<?php

if (!defined('ABSPATH')) {
    exit;
}

interface Motorock_Catalog_Importer_Feed_Adapter {

    /**
     * @return string Adapter slug (e.g. holyfreedom).
     */
    public function get_slug();

    /**
     * @return string Human label for admin UI.
     */
    public function get_label();

    /**
     * Build import queue from feed config + CSV.
     * Each queue item is processed in one batch step.
     *
     * @param array $feed Feed config from Feed_Manager.
     * @return array<int, array<string, mixed>>
     */
    public function build_queue(array $feed, array $context = array());

    /**
     * Map one queue item to normalized WooCommerce product data.
     *
     * @param array $feed Feed config.
     * @param array $queue_item One queue entry.
     * @param array $context Optional import context (e.g. mode => full|update_only).
     * @return array<string, mixed>|null Null to skip.
     */
    public function map_queue_item(array $feed, array $queue_item, array $context = array());
}
