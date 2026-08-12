<?php

if (!defined('ABSPATH')) {
    exit;
}

class Motorock_Catalog_Importer_Csv_Parser {

    /**
     * @return array<int, array<string, string>>
     */
    public static function parse_file($path) {
        if (!file_exists($path)) {
            throw new RuntimeException('CSV file not found.');
        }

        $handle = fopen($path, 'r');
        if (!$handle) {
            throw new RuntimeException('Could not open CSV file.');
        }

        $header = null;
        $rows = array();

        while (($line = fgets($handle)) !== false) {
            $line = preg_replace('/^\xEF\xBB\xBF/', '', $line);
            $cells = str_getcsv(trim($line));
            if ($header === null) {
                $header = array_map('trim', $cells);
                continue;
            }

            if (count($cells) === 1 && $cells[0] === null) {
                continue;
            }

            $row = array();
            foreach ($header as $index => $key) {
                $row[$key] = isset($cells[$index]) ? trim((string) $cells[$index]) : '';
            }
            $rows[] = $row;
        }

        fclose($handle);
        return $rows;
    }
}
