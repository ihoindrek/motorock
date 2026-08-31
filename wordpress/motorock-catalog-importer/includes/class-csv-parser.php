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
        $delimiter = ',';
        $rows = array();

        while (($line = fgets($handle)) !== false) {
            $line = preg_replace('/^\xEF\xBB\xBF/', '', $line);
            if ($header === null) {
                $delimiter = self::detect_delimiter($line);
            }
            $cells = str_getcsv(trim($line), $delimiter);
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

    private static function detect_delimiter($line) {
        $semicolons = substr_count($line, ';');
        $commas = substr_count($line, ',');
        return $semicolons > $commas ? ';' : ',';
    }
}
