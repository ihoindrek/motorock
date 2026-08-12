<?php

if (!defined('ABSPATH')) {
    exit;
}

class Motorock_Catalog_Importer_Runner {

    /** @var array */
    private $feed;

    public function __construct(array $feed) {
        $this->feed = $feed;
    }

    public function import_at_index($session_key, $index) {
        if (function_exists('wc_set_time_limit')) {
            wc_set_time_limit(120);
        } else {
            @set_time_limit(120);
        }

        $session = Motorock_Catalog_Importer_Session_Store::load($session_key);
        if (!is_array($session) || empty($session['queue'])) {
            throw new RuntimeException('Import session expired. Prepare import again.');
        }

        $queue = $session['queue'];
        $mode = isset($session['mode']) ? $session['mode'] : 'full';
        $context = array('mode' => $mode);
        $stats = isset($session['stats']) ? $session['stats'] : array(
            'imported' => 0,
            'updated' => 0,
            'skipped' => 0,
            'failed' => 0,
            'processed' => 0,
        );

        $logger = new Motorock_Catalog_Importer_Logger(
            $this->feed['id'],
            isset($session['log_file']) ? $session['log_file'] : ''
        );
        $writer = new Motorock_Catalog_Importer_Product_Writer($this->feed, $logger);
        $adapter = Motorock_Catalog_Importer_Feed_Manager::get_adapter($this->feed);

        $log_lines = array();

        if (!isset($queue[$index])) {
            Motorock_Catalog_Importer_Session_Store::delete($session_key);
            return array(
                'done' => true,
                'index' => $index,
                'total' => count($queue),
                'stats' => $stats,
                'log' => array('Import complete.'),
            );
        }

        $queue_item = $queue[$index];
        $stats['processed']++;
        $label = isset($queue_item['parent_sku']) ? $queue_item['parent_sku'] : (isset($queue_item['sku']) ? $queue_item['sku'] : ('item-' . $index));

        try {
            $product_data = $adapter->map_queue_item($this->feed, $queue_item, $context);
            if (!$product_data) {
                $stats['skipped']++;
                $log_lines[] = $logger->log('Skipped ' . $label . ' (empty mapping)', 'SKIP');
            } else {
                $result = $writer->upsert_product($product_data, $mode);
                if ($result['action'] === 'imported') {
                    $stats['imported']++;
                    $log_lines[] = $logger->log('Imported ' . $label . ' (ID ' . $result['product_id'] . ')', 'OK');
                } elseif ($result['action'] === 'updated') {
                    $stats['updated']++;
                    $log_lines[] = $logger->log('Updated ' . $label . ' (ID ' . $result['product_id'] . ')', 'OK');
                } elseif ($result['action'] === 'skipped') {
                    $stats['skipped']++;
                    $log_lines[] = $logger->log('Skipped ' . $label . ' (SKU not found)', 'SKIP');
                } else {
                    $stats['failed']++;
                    $log_lines[] = $logger->log('Failed ' . $label, 'ERROR');
                }
            }
        } catch (Throwable $e) {
            $stats['failed']++;
            $log_lines[] = $logger->log('Failed ' . $label . ': ' . $e->getMessage(), 'ERROR');
        }

        $next_index = $index + 1;
        $done = $next_index >= count($queue);

        if ($done) {
            Motorock_Catalog_Importer_Session_Store::delete($session_key);
        } else {
            $session['stats'] = $stats;
            Motorock_Catalog_Importer_Session_Store::save($session_key, $session);
        }

        return array(
            'done' => $done,
            'index' => $next_index,
            'total' => count($queue),
            'stats' => $stats,
            'log' => $log_lines,
            'progress' => count($queue) > 0 ? round(($next_index / count($queue)) * 100) : 100,
        );
    }
}
