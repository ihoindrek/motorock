<?php

if (!defined('ABSPATH')) {
    exit;
}

$feeds = Motorock_Catalog_Importer_Feed_Manager::get_all_feeds();
$adapters = Motorock_Catalog_Importer_Feed_Manager::get_adapter_choices();
?>

<div class="wrap motorock-catalog-importer">
    <h1><span class="dashicons dashicons-database-import"></span> Catalog Import</h1>

    <p>Universal supplier catalog import. First adapter: <strong>Holy Freedom</strong> (B2B CSV + PrestaShop enrichment). Shopify import remains in its own plugin.</p>

    <div class="mci-card">
        <h2>Add new feed</h2>
        <table class="form-table">
            <tr>
                <th><label for="new-feed-name">Name</label></th>
                <td><input type="text" id="new-feed-name" class="regular-text" placeholder="Holy Freedom 2026"></td>
            </tr>
            <tr>
                <th><label for="new-feed-adapter">Adapter</label></th>
                <td>
                    <select id="new-feed-adapter">
                        <?php foreach ($adapters as $slug => $label) : ?>
                            <option value="<?php echo esc_attr($slug); ?>"><?php echo esc_html($label); ?></option>
                        <?php endforeach; ?>
                    </select>
                </td>
            </tr>
            <tr>
                <th><label for="new-feed-brand">Brand</label></th>
                <td><input type="text" id="new-feed-brand" class="regular-text" value="Holyfreedom"></td>
            </tr>
        </table>
        <button type="button" class="button button-primary" id="mci-save-new-feed">Create feed</button>
        <div id="mci-new-feed-status" class="mci-status" style="display:none;"></div>
    </div>

    <div class="mci-card">
        <h2>Existing feeds</h2>
        <?php if (empty($feeds)) : ?>
            <p>No feeds yet.</p>
        <?php else : ?>
            <table class="widefat striped">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Brand</th>
                        <th>Adapter</th>
                        <th>Products</th>
                        <th>Storefront</th>
                        <th>CSV</th>
                        <th>Last import</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($feeds as $feed) : ?>
                        <?php
                        $product_count = Motorock_Catalog_Importer_Feed_Products::count_for_feed($feed['id']);
                        $visibility_stats = Motorock_Catalog_Importer_Feed_Products::get_visibility_stats_for_feed($feed['id']);
                        $catalog_hidden = !Motorock_Catalog_Importer_Feed_Products::is_feed_visible_on_storefront($feed);
                        ?>
                        <tr>
                            <td><strong><?php echo esc_html($feed['name']); ?></strong></td>
                            <td><?php echo esc_html($feed['brand'] !== '' ? $feed['brand'] : '—'); ?></td>
                            <td><?php echo esc_html(isset($adapters[$feed['adapter']]) ? $adapters[$feed['adapter']] : $feed['adapter']); ?></td>
                            <td>
                                <strong><?php echo intval($product_count); ?></strong>
                                <?php if ($product_count > 0) : ?>
                                    <br><small>
                                        <?php echo intval($visibility_stats['published']); ?> live,
                                        <?php echo intval($visibility_stats['draft']); ?> hidden
                                    </small>
                                <?php endif; ?>
                            </td>
                            <td>
                                <?php if ($catalog_hidden || $visibility_stats['published'] === 0 && $product_count > 0) : ?>
                                    <span class="mci-badge mci-badge-hidden">Hidden</span>
                                <?php elseif ($product_count > 0) : ?>
                                    <span class="mci-badge mci-badge-visible">Visible</span>
                                <?php else : ?>
                                    —
                                <?php endif; ?>
                            </td>
                            <td>
                                <?php if (!empty($feed['csv_original_name'])) : ?>
                                    <?php echo esc_html($feed['csv_original_name']); ?>
                                    <?php if (!empty($feed['csv_uploaded_at'])) : ?>
                                        <br><small><?php echo esc_html($feed['csv_uploaded_at']); ?></small>
                                    <?php endif; ?>
                                <?php else : ?>
                                    <em>Not uploaded</em>
                                <?php endif; ?>
                            </td>
                            <td>
                                <?php if (!empty($feed['last_import_at'])) : ?>
                                    <?php echo esc_html($feed['last_import_at']); ?>
                                    <?php if (!empty($feed['last_import_stats'])) : ?>
                                        <br><small>
                                            <?php echo intval($feed['last_import_stats']['imported']); ?> new,
                                            <?php echo intval($feed['last_import_stats']['updated']); ?> updated
                                        </small>
                                    <?php endif; ?>
                                <?php else : ?>
                                    —
                                <?php endif; ?>
                            </td>
                            <td>
                                <a class="button" href="<?php echo esc_url(admin_url('admin.php?page=motorock-catalog-importer-edit&feed_id=' . $feed['id'])); ?>">Open</a>
                                <button type="button" class="button mci-delete-feed" data-feed-id="<?php echo esc_attr($feed['id']); ?>">Delete</button>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>
    </div>
</div>
