<?php

if (!defined('ABSPATH')) {
    exit;
}

$sites = Shopify_Importer_Site_Manager::get_all_sites();
$next_cron = Shopify_Importer_Cron::get_next_run();
?>

<div class="wrap shopify-importer">
    <h1>
        <span class="dashicons dashicons-cart" style="font-size: 28px; margin-right: 10px;"></span>
        Shopify Importer
    </h1>

    <div class="notice notice-info" style="margin: 20px 0;">
        <p>Paste a Shopify store URL, map collections to your categories once, then import. Re-runs only add new products (matched by SKU). Cron runs enabled sites automatically.</p>
        <?php if ($next_cron) : ?>
            <p><strong>Next scheduled import:</strong> <?php echo esc_html(date_i18n(get_option('date_format') . ' ' . get_option('time_format'), $next_cron)); ?></p>
        <?php endif; ?>
    </div>

    <div style="background:#fff;padding:25px;margin:20px 0;box-shadow:0 1px 3px rgba(0,0,0,0.1);border-radius:8px;">
        <h2 style="margin-top:0;">Add New Import Site</h2>
        <table class="form-table">
            <tr>
                <th><label for="site-name">Site name</label></th>
                <td><input type="text" id="site-name" class="regular-text" placeholder="Bobhead"></td>
            </tr>
            <tr>
                <th><label for="site-url">Shopify URL</label></th>
                <td>
                    <input type="url" id="site-url" class="regular-text" placeholder="https://bobhead.co.uk">
                    <p class="description">Store homepage or products.json URL — we normalize it automatically.</p>
                </td>
            </tr>
            <tr>
                <th><label for="site-brand">Brand</label></th>
                <td>
                    <input type="text" id="site-brand" class="regular-text" placeholder="BOBHEAD">
                    <p class="description">Default brand for products from this site (e.g. BOBHEAD → Bobhead). SKU/title rules apply as fallback when empty.</p>
                </td>
            </tr>
            <tr>
                <th><label for="site-cron">Scheduled import</label></th>
                <td>
                    <label><input type="checkbox" id="site-cron" value="1"> Enable cron</label>
                    <select id="site-cron-interval" style="margin-left:10px;">
                        <option value="daily">Daily</option>
                        <option value="twicedaily">Twice daily</option>
                        <option value="hourly">Hourly</option>
                        <option value="weekly">Weekly</option>
                    </select>
                </td>
            </tr>
        </table>
        <p>
            <button type="button" id="shopify-save-new-site" class="button button-primary button-large">Save &amp; Configure</button>
        </p>
        <div id="shopify-new-site-status" style="display:none;margin-top:15px;"></div>
    </div>

    <div style="background:#fff;padding:25px;margin:20px 0;box-shadow:0 1px 3px rgba(0,0,0,0.1);border-radius:8px;">
        <h2 style="margin-top:0;">Saved Import Sites</h2>

        <?php if (empty($sites)) : ?>
            <p style="color:#666;">No sites yet. Add Bobhead or Johnny Reb above.</p>
        <?php else : ?>
            <table class="widefat striped">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>URL</th>
                        <th>Brand</th>
                        <th>Cron</th>
                        <th>Last import</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($sites as $site) : ?>
                        <tr>
                            <td><strong><?php echo esc_html($site['name']); ?></strong></td>
                            <td><?php echo esc_html($site['url']); ?></td>
                            <td><?php echo esc_html($site['brand']); ?></td>
                            <td><?php echo !empty($site['cron_enabled']) ? esc_html($site['cron_interval']) : '—'; ?></td>
                            <td>
                                <?php
                                if (!empty($site['last_import_at'])) {
                                    echo esc_html($site['last_import_at']);
                                    if (!empty($site['last_import_stats'])) {
                                        $s = $site['last_import_stats'];
                                        echo '<br><small>' . intval($s['imported']) . ' imported, ' . intval($s['skipped']) . ' skipped</small>';
                                    }
                                } else {
                                    echo '—';
                                }
                                ?>
                            </td>
                            <td>
                                <a class="button" href="<?php echo esc_url(admin_url('admin.php?page=shopify-importer-edit&site_id=' . $site['id'])); ?>">Edit / Import</a>
                                <button type="button" class="button shopify-delete-site" data-site-id="<?php echo esc_attr($site['id']); ?>" data-site-name="<?php echo esc_attr($site['name']); ?>">Delete</button>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>
    </div>
</div>
