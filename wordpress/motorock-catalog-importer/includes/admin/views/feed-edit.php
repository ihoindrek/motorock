<?php

if (!defined('ABSPATH')) {
    exit;
}

$feed_id = isset($_GET['feed_id']) ? sanitize_key(wp_unslash($_GET['feed_id'])) : '';
$feed = Motorock_Catalog_Importer_Feed_Manager::get_feed($feed_id);

if (!$feed) {
    echo '<div class="wrap"><h1>Feed not found</h1><p><a href="' . esc_url(admin_url('admin.php?page=motorock-catalog-importer')) . '">Back</a></p></div>';
    return;
}

$categories = Motorock_Catalog_Importer_Feed_Manager::get_category_dropdown_options();
$source_categories = array();
$csv_headers = array();

if (!empty($feed['csv_file']) && file_exists($feed['csv_file'])) {
    try {
        $rows = Motorock_Catalog_Importer_Csv_Parser::parse_file($feed['csv_file']);
        $source_categories = Motorock_Catalog_Importer_Feed_Manager::collect_source_categories($rows);

        if ($feed['adapter'] === 'generic_csv') {
            $column_map = isset($feed['column_map']) ? $feed['column_map'] : Motorock_Catalog_Importer_Generic_Csv_Adapter::default_column_map();
            $category_column = isset($column_map['category']) ? $column_map['category'] : 'category';
            $source_categories = Motorock_Catalog_Importer_Feed_Manager::collect_source_categories($rows, $category_column);
        }

        if (!empty($rows[0]) && is_array($rows[0])) {
            $csv_headers = array_keys($rows[0]);
        }
    } catch (Throwable $e) {
        $source_categories = array();
    }
}

$mappings = isset($feed['category_mappings']) ? $feed['category_mappings'] : array();
$column_map = isset($feed['column_map']) ? $feed['column_map'] : Motorock_Catalog_Importer_Generic_Csv_Adapter::default_column_map();
$default_column_map = Motorock_Catalog_Importer_Generic_Csv_Adapter::default_column_map();
$adapters = Motorock_Catalog_Importer_Feed_Manager::get_adapter_choices();
$default_import_mode = isset($feed['default_import_mode']) ? $feed['default_import_mode'] : 'full';
$is_generic = $feed['adapter'] === 'generic_csv';
?>

<div class="wrap motorock-catalog-importer">
    <h1><?php echo esc_html($feed['name']); ?></h1>
    <p>
        <a href="<?php echo esc_url(admin_url('admin.php?page=motorock-catalog-importer')); ?>">&larr; All feeds</a>
    </p>

    <input type="hidden" id="mci-feed-id" value="<?php echo esc_attr($feed['id']); ?>">

    <div id="mci-status" class="mci-status" style="display:none;"></div>

    <div class="mci-card">
        <h2>Feed settings</h2>
        <table class="form-table">
            <tr>
                <th>Name</th>
                <td><input type="text" id="mci-feed-name" class="regular-text" value="<?php echo esc_attr($feed['name']); ?>"></td>
            </tr>
            <tr>
                <th>Adapter</th>
                <td>
                    <select id="mci-feed-adapter">
                        <?php foreach ($adapters as $slug => $label) : ?>
                            <option value="<?php echo esc_attr($slug); ?>" <?php selected($feed['adapter'], $slug); ?>><?php echo esc_html($label); ?></option>
                        <?php endforeach; ?>
                    </select>
                </td>
            </tr>
            <tr>
                <th>Brand</th>
                <td><input type="text" id="mci-feed-brand" class="regular-text" value="<?php echo esc_attr($feed['brand']); ?>"></td>
            </tr>
            <tr>
                <th>Price multiplier</th>
                <td>
                    <input type="number" id="mci-feed-multiplier" class="small-text" step="0.0001" min="0.0001" value="<?php echo esc_attr(isset($feed['price_multiplier']) ? $feed['price_multiplier'] : 1); ?>">
                    <p class="description">Use <code>1</code> for Holy Freedom EUR retail prices as-is.</p>
                </td>
            </tr>
            <tr>
                <th>Default import mode</th>
                <td>
                    <select id="mci-default-import-mode">
                        <option value="full" <?php selected($default_import_mode, 'full'); ?>>Full import (create/update products)</option>
                        <option value="update_only" <?php selected($default_import_mode, 'update_only'); ?>>Update stock &amp; prices only</option>
                    </select>
                </td>
            </tr>
        </table>
        <button type="button" class="button button-primary" id="mci-save-feed">Save settings</button>
    </div>

    <div class="mci-card mci-generic-only" <?php echo $is_generic ? '' : 'style="display:none;"'; ?>>
        <h2>CSV column mapping</h2>
        <p>Map logical fields to your CSV column headers. Required for Generic CSV adapter.</p>
        <table class="widefat striped" id="mci-column-mapping-table">
            <thead>
                <tr>
                    <th>Field</th>
                    <th>CSV column</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($default_column_map as $field => $default_column) : ?>
                    <tr>
                        <td><code><?php echo esc_html($field); ?></code></td>
                        <td>
                            <?php if (!empty($csv_headers)) : ?>
                                <select class="mci-column-map-select" data-field="<?php echo esc_attr($field); ?>">
                                    <option value="">— Select —</option>
                                    <?php foreach ($csv_headers as $header) : ?>
                                        <?php $selected = isset($column_map[$field]) ? $column_map[$field] : $default_column; ?>
                                        <option value="<?php echo esc_attr($header); ?>" <?php selected($selected, $header); ?>><?php echo esc_html($header); ?></option>
                                    <?php endforeach; ?>
                                </select>
                            <?php else : ?>
                                <input type="text" class="mci-column-map-input regular-text" data-field="<?php echo esc_attr($field); ?>" value="<?php echo esc_attr(isset($column_map[$field]) ? $column_map[$field] : $default_column); ?>">
                            <?php endif; ?>
                        </td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
        <p class="description">Images column: pipe- or comma-separated URLs. Variable products: use <code>parent_sku</code> on variation rows.</p>
    </div>

    <div class="mci-card">
        <h2>CSV upload</h2>
        <?php if (!empty($feed['csv_original_name'])) : ?>
            <p>Current file: <strong><?php echo esc_html($feed['csv_original_name']); ?></strong>
            <?php if (!empty($feed['csv_uploaded_at'])) : ?>
                (<?php echo esc_html($feed['csv_uploaded_at']); ?>)
            <?php endif; ?>
            </p>
        <?php endif; ?>
        <input type="file" id="mci-csv-file" accept=".csv,text/csv">
        <button type="button" class="button" id="mci-upload-csv">Upload CSV</button>
    </div>

    <?php if (!empty($source_categories)) : ?>
    <div class="mci-card">
        <h2>Category mapping</h2>
        <p>Map supplier categories from CSV to Motorock WooCommerce categories. Labels show the full path (e.g. <code>For men › Gloves</code>) — only default-language categories are listed when WPML is active.</p>
        <table class="widefat striped" id="mci-category-mapping-table">
            <thead>
                <tr>
                    <th>Source category</th>
                    <th>Motorock category</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($source_categories as $source) : ?>
                    <tr>
                        <td><code><?php echo esc_html($source); ?></code></td>
                        <td>
                            <select class="mci-category-mapping-select" data-source="<?php echo esc_attr($source); ?>">
                                <option value="">— Select —</option>
                                <?php foreach ($categories as $category) : ?>
                                    <option value="<?php echo esc_attr($category['id']); ?>" <?php selected(isset($mappings[$source]) ? (int) $mappings[$source] : 0, $category['id']); ?>>
                                        <?php echo esc_html($category['label']); ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
        <p class="description">All WooCommerce product categories are listed — including ones you create under <strong>Products → Categories</strong>. Type to search (e.g. <code>men gloves</code>).</p>
        <button type="button" class="button button-primary" id="mci-save-category-mappings">Save category mapping</button>
    </div>
    <?php endif; ?>

    <div class="mci-card">
        <h2>Import</h2>
        <p class="mci-import-desc-full">Full import: one parent product per batch step (simple or variable + variations). Holy Freedom scrapes PrestaShop for images/descriptions (cached).</p>
        <p class="mci-import-desc-update" style="display:none;">Update only: one CSV row per batch step — updates price, stock and cost by SKU. No scraping, no new products.</p>

        <p>
            <label for="mci-import-mode"><strong>Run as:</strong></label>
            <select id="mci-import-mode">
                <option value="full" <?php selected($default_import_mode, 'full'); ?>>Full import</option>
                <option value="update_only" <?php selected($default_import_mode, 'update_only'); ?>>Update stock &amp; prices only</option>
            </select>
        </p>

        <button type="button" class="button button-primary button-hero" id="mci-start-import">Prepare &amp; start import</button>

        <div id="mci-import-progress" style="display:none;margin-top:20px;">
            <div class="mci-progress-bar-wrap">
                <div id="mci-import-progress-bar" class="mci-progress-bar">0%</div>
            </div>
            <p id="mci-import-progress-text"></p>
            <p>
                Imported: <strong id="mci-stat-imported">0</strong>,
                Updated: <strong id="mci-stat-updated">0</strong>,
                Skipped: <strong id="mci-stat-skipped">0</strong>,
                Failed: <strong id="mci-stat-failed">0</strong>
            </p>
            <pre id="mci-import-log" class="mci-log"></pre>
        </div>
    </div>
</div>
