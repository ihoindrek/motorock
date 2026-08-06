<?php

if (!defined('ABSPATH')) {
    exit;
}

$site_id = isset($_GET['site_id']) ? sanitize_key($_GET['site_id']) : '';
$site = Shopify_Importer_Site_Manager::get_site($site_id);

if (!$site) {
    echo '<div class="wrap"><h1>Poodi ei leitud</h1><p><a href="' . esc_url(admin_url('admin.php?page=shopify-importer')) . '">Tagasi poodide nimekirja</a></p></div>';
    return;
}

$categories = Shopify_Importer_Site_Manager::get_motorock_categories();
$imported_product_count = Shopify_Importer_Product_Cleaner::count_site_products($site['id']);
$price_sync_mode = Shopify_Importer_Price_Helper::get_price_sync_mode($site);
?>

<div class="wrap shopify-importer">
    <h1>
        <span class="dashicons dashicons-cart" style="font-size: 28px; margin-right: 10px;"></span>
        <?php echo esc_html($site['name']); ?>
    </h1>

    <p>
        <a href="<?php echo esc_url(admin_url('admin.php?page=shopify-importer')); ?>">&larr; Kõik poed</a>
        &nbsp;|&nbsp;
        <a href="<?php echo esc_url($site['url']); ?>" target="_blank" rel="noopener"><?php echo esc_html($site['url']); ?></a>
    </p>

    <input type="hidden" id="shopify-site-id" value="<?php echo esc_attr($site['id']); ?>">

    <div id="shopify-status" style="display:none;margin:20px 0;padding:15px;border-radius:4px;"></div>

    <div style="background:#fff;padding:25px;margin:20px 0;box-shadow:0 1px 3px rgba(0,0,0,0.1);border-radius:8px;">
        <h2 style="margin-top:0;">Poe seaded</h2>
        <table class="form-table">
            <tr>
                <th>Nimi</th>
                <td><input type="text" id="edit-site-name" class="regular-text" value="<?php echo esc_attr($site['name']); ?>"></td>
            </tr>
            <tr>
                <th>URL</th>
                <td><input type="url" id="edit-site-url" class="regular-text" value="<?php echo esc_attr($site['url']); ?>"></td>
            </tr>
            <tr>
                <th>Bränd</th>
                <td><input type="text" id="edit-site-brand" class="regular-text" value="<?php echo esc_attr($site['brand']); ?>"></td>
            </tr>
            <tr>
                <th>Hinna kordaja</th>
                <td>
                    <input type="number" id="edit-site-price-multiplier" class="small-text" step="0.0001" min="0.0001" value="<?php echo esc_attr(Shopify_Importer_Price_Helper::get_multiplier($site)); ?>">
                    <p class="description">Korruta Shopify tavahinnad selle teguriga impordil ja hinnauuendusel (nt <code>1.16</code> GBP → EUR). Kasuta <code>1</code>, kui konversiooni pole vaja.</p>
                </td>
            </tr>
            <tr>
                <th>Hindade sync</th>
                <td>
                    <select id="edit-site-price-sync-mode">
                        <option value="<?php echo esc_attr(Shopify_Importer_Price_Helper::SYNC_EXCLUDE_SALES); ?>" <?php selected($price_sync_mode, Shopify_Importer_Price_Helper::SYNC_EXCLUDE_SALES); ?>>
                            Sünkroniseeri tavahinnad (kampaaniahindu mitte)
                        </option>
                        <option value="<?php echo esc_attr(Shopify_Importer_Price_Helper::SYNC_NEVER); ?>" <?php selected($price_sync_mode, Shopify_Importer_Price_Helper::SYNC_NEVER); ?>>
                            Ära sünkroniseeri hindu
                        </option>
                        <option value="<?php echo esc_attr(Shopify_Importer_Price_Helper::SYNC_INCLUDE_SALES); ?>" <?php selected($price_sync_mode, Shopify_Importer_Price_Helper::SYNC_INCLUDE_SALES); ?>>
                            Sünkroniseeri kõik Shopify hinnad (ka soodushinnad)
                        </option>
                    </select>
                    <p class="description">
                        Soovitus: <strong>kampaaniahindu mitte</strong>.
                        Kui Shopify tootel on allahindlus, kasutame tavahinda (<code>compare_at_price</code>), mitte soodushinda (<code>price</code>).
                    </p>
                </td>
            </tr>
            <tr>
                <th>Aegunud tooted</th>
                <td>
                    <label>
                        <input type="checkbox" id="edit-site-auto-draft-stale" value="1" <?php checked(!empty($site['auto_draft_stale'])); ?>>
                        Peida mustandiks tooted, mida Shopify’st pärast importi enam ei leitud
                    </label>
                    <p class="description">Jäta märkimata, kui impordid käsitsi (nt 2× aastas). Vältib olukorda, kus tooted lähevad mustandiks, kui import on ammu jooksnud.</p>
                </td>
            </tr>
            <tr>
                <th>Cron</th>
                <td>
                    <label><input type="checkbox" id="edit-site-cron" value="1" <?php checked(!empty($site['cron_enabled'])); ?>> Luba ajastatud import</label>
                    <select id="edit-site-cron-interval" style="margin-left:10px;">
                        <?php
                        $intervals = array(
                            'hourly' => 'Iga tund',
                            'twicedaily' => 'Kaks korda päevas',
                            'daily' => 'Iga päev',
                            'weekly' => 'Iga nädal',
                        );
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
            <button type="button" id="shopify-save-site-settings" class="button button-primary">Salvesta seaded</button>
        </p>
        <div id="shopify-settings-status" style="display:none;margin-top:10px;"></div>
    </div>

    <div style="background:#fff;padding:25px;margin:20px 0;box-shadow:0 1px 3px rgba(0,0,0,0.1);border-radius:8px;">
        <h2 style="margin-top:0;">Samm 1: Skaneeri kollektsioonid</h2>
        <p style="color:#666;">Laadi Shopify kollektsioonid ja loo toodete seosed. Seostamata kollektsioonid kasutavad vaikimisi kategooriat (<strong><?php echo esc_html(Shopify_Importer_Site_Manager::get_default_category_label()); ?></strong>).</p>
        <?php if (!empty($site['collections_scanned_at'])) : ?>
            <p><small>Viimati skaneeritud: <?php echo esc_html($site['collections_scanned_at']); ?> (<?php echo count($site['collections']); ?> kollektsiooni)</small></p>
        <?php endif; ?>
        <button type="button" id="shopify-scan-collections" class="button button-primary button-large">Skaneeri kollektsioonid</button>
    </div>

    <div id="shopify-mapping-section" style="<?php echo empty($site['collections']) ? 'display:none;' : ''; ?>background:#fff;padding:25px;margin:20px 0;box-shadow:0 1px 3px rgba(0,0,0,0.1);border-radius:8px;">
        <h2 style="margin-top:0;">Samm 2: Seo kategooriad</h2>
        <p style="color:#666;">Seo ainult konkreetsed Shopify kollektsioonid. Laiad kollektsioonid (nt <code>All Products</code>) ignoreeritakse isegi siis, kui need on seotud. Seostamata kollektsioonid kasutavad vaikimisi kategooriat (<strong><?php echo esc_html(Shopify_Importer_Site_Manager::get_default_category_label()); ?></strong>).</p>
        <div style="background:#f6f7f7;border:1px solid #dcdcde;border-radius:4px;padding:15px;margin:15px 0;">
            <strong>Impordi seosed CSV-st</strong>
            <p style="margin:8px 0;color:#666;">Kaks veergu: Shopify kollektsiooni nimi, WooCommerce kategooria nimi. Päiserida on valikuline.</p>
            <p style="margin:8px 0;color:#666;font-size:12px;">Näide:<br><code>Shopify kollektsioon,WooCommerce kategooria</code><br><code>Jackets,Motorcycle Jackets</code></p>
            <input type="file" id="shopify-csv-mapping-file" accept=".csv,text/csv" style="margin-right:10px;">
            <button type="button" id="shopify-apply-csv-mappings" class="button">Rakenda CSV tabelile</button>
            <div id="shopify-csv-import-status" style="display:none;margin-top:12px;"></div>
        </div>
        <table class="widefat striped" id="shopify-mapping-table">
            <thead>
                <tr>
                    <th style="width:40%;">Shopify kollektsioon</th>
                    <th style="width:15%;">Tooteid</th>
                    <th style="width:45%;">WooCommerce kategooria</th>
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
                                    <br><span style="color:#996800;font-size:12px;">Lai kollektsioon — kategooria seostamisel ignoreeritakse</span>
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
            <button type="button" id="shopify-save-mappings" class="button button-primary button-large">Salvesta seosed</button>
        </p>
    </div>

    <div style="background:#fff;padding:25px;margin:20px 0;box-shadow:0 1px 3px rgba(0,0,0,0.1);border-radius:8px;">
        <h2 style="margin-top:0;">Samm 3: Impordi tooted</h2>
        <p style="color:#666;margin-bottom:0;">Impordib avaldatud ja laos olevaid tooteid. Olemasolevad SKU-d jäetakse vahele. ~80 toodet võtab ca 2–5 minutit (üks toode korraga).</p>
        <div style="background:#fff3cd;border-left:4px solid #f0b849;padding:15px;margin:15px 0;">
            <strong>Märkus:</strong> Enne esimest importi (või pärast seoste muutmist) skaneeri kollektsioonid.
        </div>
        <button type="button" id="shopify-start-import" class="button button-primary button-large">Alusta importi</button>

        <div id="shopify-import-progress" style="display:none;margin-top:25px;padding-top:20px;border-top:1px solid #dcdcde;">
            <h3 style="margin-top:0;">Impordi edenemine <small style="font-weight:normal;color:#666;">— valmis, kui all on roheline „Import on lõpetatud“</small></h3>
            <div id="shopify-import-progress-text" style="margin-bottom:10px;font-weight:bold;color:#2271b1;">Käivitamine...</div>
            <div class="shopify-progress-bar"><div id="shopify-import-progress-bar" class="shopify-progress-fill" style="width:0%;">0%</div></div>
            <div class="shopify-stats" style="margin-top:20px;">
            <div class="shopify-stat"><span id="stat-imported">0</span><label>Imporditud</label></div>
            <div class="shopify-stat"><span id="stat-updated">0</span><label>Uuendatud</label></div>
            <div class="shopify-stat"><span id="stat-skipped">0</span><label>Vahele jäetud</label></div>
                <div class="shopify-stat"><span id="stat-failed">0</span><label>Ebaõnnestunud</label></div>
            </div>
            <div id="shopify-import-log-wrap" style="margin-top:20px;">
                <strong>Impordi logi</strong>
                <pre id="shopify-import-log" class="shopify-import-log"></pre>
            </div>
        </div>
    </div>

    <div style="background:#fff;padding:25px;margin:20px 0;box-shadow:0 1px 3px rgba(0,0,0,0.1);border-radius:8px;">
        <h2 style="margin-top:0;">Uuenda hindu</h2>
        <p style="color:#666;">Tõmba Shopify tavahinnad ja uuenda WooCommerce tooteid SKU järgi. Kasutab hinna kordajat ja <strong>Hindade sync</strong> režiimi.</p>
        <?php if ($price_sync_mode === Shopify_Importer_Price_Helper::SYNC_NEVER) : ?>
            <div style="background:#f0f0f1;border-left:4px solid #646970;padding:15px;margin:15px 0;">
                Hindade sync on selle poe jaoks välja lülitatud. Luba hindade sync poe seadetes, et seda tegevust kasutada.
            </div>
        <?php else : ?>
            <div style="background:#fff3cd;border-left:4px solid #f0b849;padding:15px;margin:15px 0;">
                <strong>Kampaaniasafe:</strong> allahinnatud variandid kasutavad tavahinda (<code>compare_at_price</code>), mitte ajutist soodushinda.
            </div>
        <?php endif; ?>
        <?php if (!empty($site['last_price_update_at'])) : ?>
            <p><small>Viimane hinnauuendus: <?php echo esc_html($site['last_price_update_at']); ?>
                <?php if (!empty($site['last_price_update_stats']['updated'])) : ?>
                    (<?php echo intval($site['last_price_update_stats']['updated']); ?> uuendatud)
                <?php endif; ?>
            </small></p>
        <?php endif; ?>
        <button type="button" id="shopify-update-prices" class="button button-secondary button-large" <?php disabled($price_sync_mode === Shopify_Importer_Price_Helper::SYNC_NEVER); ?>>Uuenda hindu</button>

        <div id="shopify-price-update-progress" style="display:none;margin-top:25px;padding-top:20px;border-top:1px solid #dcdcde;">
            <h3 style="margin-top:0;">Hinnauuenduse edenemine</h3>
            <div id="shopify-price-update-progress-text" style="margin-bottom:10px;font-weight:bold;color:#2271b1;">Käivitamine...</div>
            <div class="shopify-progress-bar"><div id="shopify-price-update-progress-bar" class="shopify-progress-fill" style="width:0%;">0%</div></div>
            <div class="shopify-stats" style="margin-top:20px;">
                <div class="shopify-stat"><span id="price-stat-updated">0</span><label>Uuendatud</label></div>
                <div class="shopify-stat"><span id="price-stat-unchanged">0</span><label>Muutumata</label></div>
                <div class="shopify-stat"><span id="price-stat-skipped">0</span><label>Vahele jäetud</label></div>
            </div>
            <div id="shopify-price-update-log-wrap" style="margin-top:20px;">
                <strong>Hinnauuenduse logi</strong>
                <pre id="shopify-price-update-log" class="shopify-import-log"></pre>
            </div>
        </div>
    </div>

    <div style="background:#fff;padding:25px;margin:20px 0;box-shadow:0 1px 3px rgba(0,0,0,0.1);border-radius:8px;">
        <h2 style="margin-top:0;">Uuenda kategooriaid</h2>
        <p style="color:#666;">Rakenda praegused kollektsioon → kategooria seosed toodetele SKU järgi. Salvesta seosed enne käivitamist. WPML tõlked saavad vastava kategooria igas keeles.</p>
        <?php if (!empty($site['last_category_update_at'])) : ?>
            <p><small>Viimane kategooriauuendus: <?php echo esc_html($site['last_category_update_at']); ?>
                <?php if (!empty($site['last_category_update_stats']['updated'])) : ?>
                    (<?php echo intval($site['last_category_update_stats']['updated']); ?> uuendatud)
                <?php endif; ?>
            </small></p>
        <?php endif; ?>
        <button type="button" id="shopify-update-categories" class="button button-secondary button-large">Uuenda kategooriaid</button>

        <div id="shopify-category-update-progress" style="display:none;margin-top:25px;padding-top:20px;border-top:1px solid #dcdcde;">
            <h3 style="margin-top:0;">Kategooriauuenduse edenemine</h3>
            <div id="shopify-category-update-progress-text" style="margin-bottom:10px;font-weight:bold;color:#2271b1;">Käivitamine...</div>
            <div class="shopify-progress-bar"><div id="shopify-category-update-progress-bar" class="shopify-progress-fill" style="width:0%;">0%</div></div>
            <div class="shopify-stats" style="margin-top:20px;">
                <div class="shopify-stat"><span id="category-stat-updated">0</span><label>Uuendatud</label></div>
                <div class="shopify-stat"><span id="category-stat-unchanged">0</span><label>Muutumata</label></div>
                <div class="shopify-stat"><span id="category-stat-skipped">0</span><label>Vahele jäetud</label></div>
            </div>
            <div id="shopify-category-update-log-wrap" style="margin-top:20px;">
                <strong>Kategooriauuenduse logi</strong>
                <pre id="shopify-category-update-log" class="shopify-import-log"></pre>
            </div>
        </div>
    </div>

    <div style="background:#fdf2f4;padding:25px;margin:20px 0;box-shadow:0 1px 3px rgba(0,0,0,0.1);border-radius:8px;border-left:4px solid #d63638;">
        <h2 style="margin-top:0;">Ohtlik tsoon</h2>
        <p style="color:#666;">
            Kustuta kõik tooted, mis on imporditud ainult sellest Shopify poest
            (<strong><?php echo intval($imported_product_count); ?></strong> tuvastatud impordi meta järgi).
            Teised brändid või impordid jäävad puutumata.
        </p>
        <button type="button"
            id="shopify-delete-import-products"
            class="button button-secondary"
            data-site-id="<?php echo esc_attr($site['id']); ?>"
            data-site-name="<?php echo esc_attr($site['name']); ?>"
            data-product-count="<?php echo intval($imported_product_count); ?>"
            <?php disabled($imported_product_count === 0); ?>>
            Kustuta kõik selle impordi tooted
        </button>
        <div id="shopify-delete-products-status" style="display:none;margin-top:15px;"></div>
    </div>
</div>
