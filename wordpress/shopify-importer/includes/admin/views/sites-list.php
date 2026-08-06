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
        Shopify import
    </h1>

    <div class="notice notice-info" style="margin: 20px 0;">
        <p>Lisa Shopify poe URL, seo kollektsioonid kategooriatega kokku ja impordi tooted. Korduv käivitus lisab ainult uued tooted (SKU järgi). Ajastatud import käivitab automaatselt need poed, kus cron on sisse lülitatud.</p>
        <?php if ($next_cron) : ?>
            <p><strong>Järgmine ajastatud import:</strong> <?php echo esc_html(date_i18n(get_option('date_format') . ' ' . get_option('time_format'), $next_cron)); ?></p>
        <?php endif; ?>
    </div>

    <div style="background:#fff;padding:25px;margin:20px 0;box-shadow:0 1px 3px rgba(0,0,0,0.1);border-radius:8px;">
        <h2 style="margin-top:0;">Lisa uus importpood</h2>
        <table class="form-table">
            <tr>
                <th><label for="site-name">Poe nimi</label></th>
                <td><input type="text" id="site-name" class="regular-text" placeholder="Bobhead"></td>
            </tr>
            <tr>
                <th><label for="site-url">Shopify URL</label></th>
                <td>
                    <input type="url" id="site-url" class="regular-text" placeholder="https://bobhead.co.uk">
                    <p class="description">Poe avaleht või products.json URL — normaliseerime automaatselt.</p>
                </td>
            </tr>
            <tr>
                <th><label for="site-brand">Bränd</label></th>
                <td>
                    <input type="text" id="site-brand" class="regular-text" placeholder="BOBHEAD">
                    <p class="description">Vaikimisi bränd selle poega imporditud toodetele (nt BOBHEAD → Bobhead). Kui tühi, proovitakse tuvastada SKU/pealkirja järgi.</p>
                </td>
            </tr>
            <tr>
                <th><label for="site-cron">Ajastatud import</label></th>
                <td>
                    <label><input type="checkbox" id="site-cron" value="1"> Luba cron</label>
                    <select id="site-cron-interval" style="margin-left:10px;">
                        <option value="daily">Iga päev</option>
                        <option value="twicedaily">Kaks korda päevas</option>
                        <option value="hourly">Iga tund</option>
                        <option value="weekly">Iga nädal</option>
                    </select>
                </td>
            </tr>
        </table>
        <p>
            <button type="button" id="shopify-save-new-site" class="button button-primary button-large">Salvesta ja seadista</button>
        </p>
        <div id="shopify-new-site-status" style="display:none;margin-top:15px;"></div>
    </div>

    <div style="background:#fff;padding:25px;margin:20px 0;box-shadow:0 1px 3px rgba(0,0,0,0.1);border-radius:8px;">
        <h2 style="margin-top:0;">Salvestatud impordipood</h2>

        <?php if (empty($sites)) : ?>
            <p style="color:#666;">Poode pole veel. Lisa Bobhead, Pando Moto vms ülalpool.</p>
        <?php else : ?>
            <table class="widefat striped">
                <thead>
                    <tr>
                        <th>Nimi</th>
                        <th>URL</th>
                        <th>Bränd</th>
                        <th>Cron</th>
                        <th>Viimane import</th>
                        <th>Tegevused</th>
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
                                        echo '<br><small>' . intval($s['imported']) . ' imporditud, ' . intval($s['skipped']) . ' vahele jäetud</small>';
                                    }
                                } else {
                                    echo '—';
                                }
                                ?>
                            </td>
                            <td>
                                <a class="button" href="<?php echo esc_url(admin_url('admin.php?page=shopify-importer-edit&site_id=' . $site['id'])); ?>">Muuda / impordi</a>
                                <button type="button" class="button shopify-delete-site" data-site-id="<?php echo esc_attr($site['id']); ?>" data-site-name="<?php echo esc_attr($site['name']); ?>">Kustuta</button>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>
    </div>
</div>
