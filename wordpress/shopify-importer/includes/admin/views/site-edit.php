<?php

if (!defined('ABSPATH')) {
    exit;
}

$site_id = isset($_GET['site_id']) ? sanitize_key($_GET['site_id']) : '';
$site = Shopify_Importer_Site_Manager::get_site($site_id);

if (!$site) {
    echo '<div class="wrap"><h1>Site not found</h1><p><a href="' . esc_url(admin_url('admin.php?page=shopify-importer')) . '">Back to sites</a></p></div>';
    return;
}

$categories = Shopify_Importer_Site_Manager::get_motorock_categories();
$imported_product_count = Shopify_Importer_Product_Cleaner::count_site_products($site['id']);
?>

<div class="wrap shopify-importer">
    <h1>
        <span class="dashicons dashicons-cart" style="font-size: 28px; margin-right: 10px;"></span>
        <?php echo esc_html($site['name']); ?>
    </h1>

    <p>
        <a href="<?php echo esc_url(admin_url('admin.php?page=shopify-importer')); ?>">&larr; All sites</a>
        &nbsp;|&nbsp;
        <a href="<?php echo esc_url($site['url']); ?>" target="_blank" rel="noopener"><?php echo esc_html($site['url']); ?></a>
    </p>

    <input type="hidden" id="shopify-site-id" value="<?php echo esc_attr($site['id']); ?>">

    <div style="background:#fff;padding:25px;margin:20px 0;box-shadow:0 1px 3px rgba(0,0,0,0.1);border-radius:8px;">
        <h2 style="margin-top:0;">Site Settings</h2>
        <table class="form-table">
            <tr>
                <th>Name</th>
                <td><input type="text" id="edit-site-name" class="regular-text" value="<?php echo esc_attr($site['name']); ?>"></td>
            </tr>
            <tr>
                <th>URL</th>
                <td><input type="url" id="edit-site-url" class="regular-text" value="<?php echo esc_attr($site['url']); ?>"></td>
            </tr>
            <tr>
                <th>Brand</th>
                <td><input type="text" id="edit-site-brand" class="regular-text" value="<?php echo esc_attr($site['brand']); ?>"></td>
            </tr>
            <tr>
                <th>Price multiplier</th>
                <td>
                    <input type="number" id="edit-site-price-multiplier" class="small-text" step="0.0001" min="0.0001" value="<?php echo esc_attr(Shopify_Importer_Price_Helper::get_multiplier($site)); ?>">
                    <p class="description">Multiply Shopify prices by this factor on import and price updates (e.g. <code>1.16</code> for GBP → EUR). Use <code>1</code> for no conversion.</p>
                </td>
            </tr>
            <tr>
                <th>Cron</th>
                <td>
                    <label><input type="checkbox" id="edit-site-cron" value="1" <?php checked(!empty($site['cron_enabled'])); ?>> Enable scheduled import</label>
                    <select id="edit-site-cron-interval" style="margin-left:10px;">
                        <?php
                        $intervals = array('hourly' => 'Hourly', 'twicedaily' => 'Twice daily', 'daily' => 'Daily', 'weekly' => 'Weekly');
                        foreach ($intervals as $value => $label) {
                            printf(
                                '<option value="%s" %s>%s</option>',
                                esc_attr($value),
                                selected($site['cron_interval'], $value, false),
                                esc_html($label)
                            );
                        }
                        ?>
                    </select>
                </td>
            </tr>
        </table>
        <p>
            <button type="button" id="shopify-save-site-settings" class="button button-primary">Save Settings</button>
        </p>
        <div id="shopify-settings-status" style="display:none;margin-top:10px;"></div>
    </div>

    <div style="background:#fff;padding:25px;margin:20px 0;box-shadow:0 1px 3px rgba(0,0,0,0.1);border-radius:8px;">
        <h2 style="margin-top:0;">Step 1: Scan Collections</h2>
        <p style="color:#666;">Fetch Shopify collections and build product mapping. Unmapped collections use the store default category (<strong><?php echo esc_html(Shopify_Importer_Site_Manager::get_default_category_label()); ?></strong>).</p>
        <?php if (!empty($site['collections_scanned_at'])) : ?>
            <p><small>Last scanned: <?php echo esc_html($site['collections_scanned_at']); ?> (<?php echo count($site['collections']); ?> collections)</small></p>
        <?php endif; ?>
        <button type="button" id="shopify-scan-collections" class="button button-primary button-large">Scan Collections</button>
    </div>

    <div id="shopify-mapping-section" style="<?php echo empty($site['collections']) ? 'display:none;' : ''; ?>background:#fff;padding:25px;margin:20px 0;box-shadow:0 1px 3px rgba(0,0,0,0.1);border-radius:8px;">
        <h2 style="margin-top:0;">Step 2: Map Categories</h2>
        <p style="color:#666;">Map specific Shopify collections only. Broad collections like <code>All Products</code> are ignored even if mapped. Unmapped collections fall back to the store default (<strong><?php echo esc_html(Shopify_Importer_Site_Manager::get_default_category_label()); ?></strong>).</p>
        <div style="background:#f6f7f7;border:1px solid #dcdcde;border-radius:4px;padding:15px;margin:15px 0;">
            <strong>Import mappings from CSV</strong>
            <p style="margin:8px 0;color:#666;">Two columns: Shopify collection name, WooCommerce category name. Header row optional.</p>
            <p style="margin:8px 0;color:#666;font-size:12px;">Example:<br><code>Shopify Collection,WooCommerce Category</code><br><code>Jackets,Motorcycle Jackets</code></p>
            <input type="file" id="shopify-csv-mapping-file" accept=".csv,text/csv" style="margin-right:10px;">
            <button type="button" id="shopify-apply-csv-mappings" class="button">Apply CSV to Table</button>
            <div id="shopify-csv-import-status" style="display:none;margin-top:12px;"></div>
        </div>
        <table class="widefat striped" id="shopify-mapping-table">
            <thead>
                <tr>
                    <th style="width:40%;">Shopify Collection</th>
                    <th style="width:15%;">Products</th>
                    <th style="width:45%;">WooCommerce Category</th>
                </tr>
            </thead>
            <tbody>
                <?php if (!empty($site['collections'])) : ?>
                    <?php foreach ($site['collections'] as $collection) : ?>
                        <?php
                        $mapped = isset($site['category_mappings'][$collection['id']]) ? $site['category_mappings'][$collection['id']] : '';
                        $is_catch_all = Shopify_Importer_Site_Manager::is_catch_all_collection($collection);
                        ?>
                        <tr<?php echo $is_catch_all ? ' style="background:#fff8e5;"' : ''; ?>>
                            <td>
                                <strong><?php echo esc_html($collection['title']); ?></strong><br>
                                <code><?php echo esc_html($collection['handle']); ?></code>
                                <?php if ($is_catch_all) : ?>
                                    <br><span style="color:#996800;font-size:12px;">Broad collection — ignored for category mapping</span>
                                <?php endif; ?>
                            </td>
                            <td><?php echo intval($collection['products_count']); ?></td>
                            <td><?php echo Shopify_Importer_Site_Manager::render_category_dropdown($collection['id'], $mapped, $categories); ?></td>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>
        <p style="margin-top:20px;">
            <button type="button" id="shopify-save-mappings" class="button button-primary button-large">Save Mappings</button>
        </p>
    </div>

    <div style="background:#fff;padding:25px;margin:20px 0;box-shadow:0 1px 3px rgba(0,0,0,0.1);border-radius:8px;">
        <h2 style="margin-top:0;">Step 3: Import Products</h2>
        <p style="color:#666;">Imports available, published products only. Existing SKUs are skipped. Re-map categories and re-run to put <em>new</em> products in updated categories.</p>
        <div style="background:#fff3cd;border-left:4px solid #f0b849;padding:15px;margin:15px 0;">
            <strong>Note:</strong> Scan collections before first import (or after remapping).
        </div>
        <button type="button" id="shopify-start-import" class="button button-primary button-large">Start Import</button>
    </div>

    <div style="background:#fff;padding:25px;margin:20px 0;box-shadow:0 1px 3px rgba(0,0,0,0.1);border-radius:8px;">
        <h2 style="margin-top:0;">Update Prices</h2>
        <p style="color:#666;">Pull current prices from Shopify and update any WooCommerce product matched by SKU (simple or variation). Uses the price multiplier above. WPML translations are updated too.</p>
        <?php if (!empty($site['last_price_update_at'])) : ?>
            <p><small>Last price update: <?php echo esc_html($site['last_price_update_at']); ?>
                <?php if (!empty($site['last_price_update_stats']['updated'])) : ?>
                    (<?php echo intval($site['last_price_update_stats']['updated']); ?> updated)
                <?php endif; ?>
            </small></p>
        <?php endif; ?>
        <button type="button" id="shopify-update-prices" class="button button-secondary button-large">Update Prices</button>
    </div>

    <div style="background:#fff;padding:25px;margin:20px 0;box-shadow:0 1px 3px rgba(0,0,0,0.1);border-radius:8px;">
        <h2 style="margin-top:0;">Update Categories</h2>
        <p style="color:#666;">Re-apply your current collection → category mappings to products matched by SKU. Save mappings first, then run this. WPML translations get the matching category terms in each language.</p>
        <?php if (!empty($site['last_category_update_at'])) : ?>
            <p><small>Last category update: <?php echo esc_html($site['last_category_update_at']); ?>
                <?php if (!empty($site['last_category_update_stats']['updated'])) : ?>
                    (<?php echo intval($site['last_category_update_stats']['updated']); ?> updated)
                <?php endif; ?>
            </small></p>
        <?php endif; ?>
        <button type="button" id="shopify-update-categories" class="button button-secondary button-large">Update Categories</button>
    </div>

    <div id="shopify-category-update-progress" style="display:none;background:#fff;padding:25px;margin:20px 0;box-shadow:0 1px 3px rgba(0,0,0,0.1);border-radius:8px;">
        <h2 style="margin-top:0;">Category Update Progress</h2>
        <div id="shopify-category-update-progress-text" style="margin-bottom:10px;font-weight:bold;color:#2271b1;">Initializing...</div>
        <div class="shopify-progress-bar"><div id="shopify-category-update-progress-bar" class="shopify-progress-fill" style="width:0%;">0%</div></div>
        <div class="shopify-stats" style="margin-top:20px;">
            <div class="shopify-stat"><span id="category-stat-updated">0</span><label>Updated</label></div>
            <div class="shopify-stat"><span id="category-stat-unchanged">0</span><label>Unchanged</label></div>
            <div class="shopify-stat"><span id="category-stat-skipped">0</span><label>Skipped</label></div>
        </div>
        <div id="shopify-category-update-log-wrap" style="margin-top:20px;">
            <strong>Category update log</strong>
            <pre id="shopify-category-update-log" class="shopify-import-log"></pre>
        </div>
    </div>

    <div id="shopify-price-update-progress" style="display:none;background:#fff;padding:25px;margin:20px 0;box-shadow:0 1px 3px rgba(0,0,0,0.1);border-radius:8px;">
        <h2 style="margin-top:0;">Price Update Progress</h2>
        <div id="shopify-price-update-progress-text" style="margin-bottom:10px;font-weight:bold;color:#2271b1;">Initializing...</div>
        <div class="shopify-progress-bar"><div id="shopify-price-update-progress-bar" class="shopify-progress-fill" style="width:0%;">0%</div></div>
        <div class="shopify-stats" style="margin-top:20px;">
            <div class="shopify-stat"><span id="price-stat-updated">0</span><label>Updated</label></div>
            <div class="shopify-stat"><span id="price-stat-unchanged">0</span><label>Unchanged</label></div>
            <div class="shopify-stat"><span id="price-stat-skipped">0</span><label>Skipped</label></div>
        </div>
        <div id="shopify-price-update-log-wrap" style="margin-top:20px;">
            <strong>Price update log</strong>
            <pre id="shopify-price-update-log" class="shopify-import-log"></pre>
        </div>
    </div>

    <div id="shopify-import-progress" style="display:none;background:#fff;padding:25px;margin:20px 0;box-shadow:0 1px 3px rgba(0,0,0,0.1);border-radius:8px;">
        <h2 style="margin-top:0;">Import Progress</h2>
        <div id="shopify-import-progress-text" style="margin-bottom:10px;font-weight:bold;color:#2271b1;">Initializing...</div>
        <div class="shopify-progress-bar"><div id="shopify-import-progress-bar" class="shopify-progress-fill" style="width:0%;">0%</div></div>
        <div class="shopify-stats" style="margin-top:20px;">
            <div class="shopify-stat"><span id="stat-imported">0</span><label>Imported</label></div>
            <div class="shopify-stat"><span id="stat-skipped">0</span><label>Skipped</label></div>
            <div class="shopify-stat"><span id="stat-failed">0</span><label>Failed</label></div>
        </div>
        <div id="shopify-import-log-wrap" style="margin-top:20px;">
            <strong>Import log</strong>
            <pre id="shopify-import-log" class="shopify-import-log"></pre>
        </div>
    </div>

    <div style="background:#fff;padding:25px;margin:20px 0;box-shadow:0 1px 3px rgba(0,0,0,0.1);border-radius:8px;border-left:4px solid #d63638;">
        <h2 style="margin-top:0;">Danger Zone</h2>
        <p style="color:#666;">
            Remove all products imported from this Shopify site only
            (<strong><?php echo intval($imported_product_count); ?></strong> tracked via import metadata).
            Other brands or imports are not affected.
        </p>
        <button type="button"
            id="shopify-delete-import-products"
            class="button button-secondary"
            data-site-id="<?php echo esc_attr($site['id']); ?>"
            data-site-name="<?php echo esc_attr($site['name']); ?>"
            data-product-count="<?php echo intval($imported_product_count); ?>"
            <?php disabled($imported_product_count === 0); ?>>
            Delete All Products From This Import
        </button>
        <div id="shopify-delete-products-status" style="display:none;margin-top:15px;"></div>
    </div>

    <div id="shopify-status" style="display:none;margin:20px 0;padding:15px;border-radius:4px;"></div>
</div>
