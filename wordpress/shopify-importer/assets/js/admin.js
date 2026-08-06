(function ($) {
    'use strict';

    var importRunning = false;

    function getResumeStorageKey() {
        return 'shopify_import_resume_' + ($('#shopify-site-id').val() || 'default');
    }

    function saveImportProgress(page, batch, sessionKey) {
        try {
            sessionStorage.setItem(getResumeStorageKey(), JSON.stringify({
                page: page,
                batch: batch,
                session_key: sessionKey
            }));
        } catch (e) {
            // Ignore storage errors.
        }
    }

    function loadImportProgress() {
        try {
            var raw = sessionStorage.getItem(getResumeStorageKey());
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function clearImportProgress() {
        try {
            sessionStorage.removeItem(getResumeStorageKey());
        } catch (e) {
            // Ignore storage errors.
        }
    }

    function showStatus($el, message, success) {
        $el.html('<strong style="color:' + (success ? '#00a32a' : '#d63638') + ';">' + message + '</strong>')
            .css({
                background: success ? '#d5f4e6' : '#f9e2e2',
                borderLeft: '4px solid ' + (success ? '#00a32a' : '#d63638'),
                padding: '15px',
                borderRadius: '4px'
            })
            .show();
    }

    function appendImportLog(lines) {
        if (!lines || !lines.length) {
            return;
        }

        var $log = $('#shopify-import-log');
        var current = $log.text();
        var addition = lines.join('\n');
        $log.text(current ? current + '\n' + addition : addition);
        $log.scrollTop($log[0].scrollHeight);
    }

    function renderCollections(collections) {
        var html = '';
        $.each(collections, function (i, collection) {
            var rowStyle = collection.is_catch_all ? ' style="background:#fff8e5;"' : '';
            var catchAllNote = collection.is_catch_all
                ? '<br><span style="color:#996800;font-size:12px;">Broad collection — ignored for category mapping</span>'
                : '';
            html += '<tr' + rowStyle + '>';
            html += '<td><strong>' + collection.title + '</strong><br><code>' + collection.handle + '</code>' + catchAllNote + '</td>';
            html += '<td>' + collection.products_count + '</td>';
            html += '<td>' + collection.dropdown + '</td>';
            html += '</tr>';
        });
        $('#shopify-mapping-table tbody').html(html);
        $('#shopify-mapping-section').show();
    }

    function collectMappings() {
        var mappings = {};
        $('.shopify-category-mapping-select').each(function () {
            var match = $(this).attr('name').match(/\[(\d+)\]/);
            if (match && $(this).val()) {
                mappings[match[1]] = $(this).val();
            }
        });
        return mappings;
    }

    function normalizeMappingName(name) {
        return String(name || '')
            .replace(/\u00a0/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
    }

    function parseCsvMappings(text) {
        var rows = [];
        var lines = String(text || '').replace(/^\uFEFF/, '').split(/\r?\n/);

        $.each(lines, function (_, line) {
            line = line.trim();
            if (!line) {
                return;
            }

            var cells = [];
            var current = '';
            var inQuotes = false;

            for (var i = 0; i < line.length; i++) {
                var char = line.charAt(i);
                if (char === '"') {
                    if (inQuotes && line.charAt(i + 1) === '"') {
                        current += '"';
                        i++;
                    } else {
                        inQuotes = !inQuotes;
                    }
                } else if ((char === ',' || char === ';') && !inQuotes) {
                    cells.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }

            cells.push(current.trim());

            if (cells.length < 2) {
                return;
            }

            var shopifyName = cells[0];
            var categoryName = cells[1];

            if (/^shopify\s+collection$/i.test(shopifyName) && /^woo?commerce\s+category$/i.test(categoryName)) {
                return;
            }

            rows.push({
                shopify: shopifyName,
                category: categoryName
            });
        });

        return rows;
    }

    function buildCollectionLookup() {
        var lookup = {};

        $('#shopify-mapping-table tbody tr').each(function () {
            var $select = $(this).find('.shopify-category-mapping-select');
            if (!$select.length) {
                return;
            }

            var match = $select.attr('name').match(/\[(\d+)\]/);
            if (!match) {
                return;
            }

            var title = $(this).find('td:first strong').text().trim();
            var handle = $(this).find('td:first code').text().trim();
            var entry = {
                id: match[1],
                $select: $select,
                title: title
            };

            if (title) {
                lookup[normalizeMappingName(title)] = entry;
            }
            if (handle) {
                lookup[normalizeMappingName(handle)] = entry;
            }
        });

        return lookup;
    }

    function buildCategoryLookup() {
        var lookup = {};

        $('.shopify-category-mapping-select option').each(function () {
            var value = $(this).val();
            if (!value) {
                return;
            }

            var name = normalizeMappingName($(this).text());
            if (name && !lookup[name]) {
                lookup[name] = value;
            }
        });

        return lookup;
    }

    function escapeHtml(text) {
        return String(text || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function showCsvImportStatus(result) {
        var $status = $('#shopify-csv-import-status');
        var html = '';
        var hasMatches = result.matched.length > 0;
        var isClean = hasMatches && !result.missingCollections.length && !result.missingCategories.length && !result.skippedEmpty;

        html += '<strong>' + result.matched.length + ' mapping(s) applied to the table.</strong>';
        html += ' Click <strong>Save Mappings</strong> to store them.';

        if (result.skippedEmpty) {
            html += '<br><span style="color:#666;">Skipped ' + result.skippedEmpty + ' row(s) with no WooCommerce category (left as default).</span>';
        }

        if (result.missingCollections.length) {
            html += '<br><span style="color:#996800;">Collections not found (' + result.missingCollections.length + '): ' +
                escapeHtml(result.missingCollections.slice(0, 20).join(', ')) +
                (result.missingCollections.length > 20 ? '…' : '') + '</span>';
        }

        if (result.missingCategories.length) {
            html += '<br><span style="color:#996800;">Categories not found (' + result.missingCategories.length + '): ' +
                escapeHtml(result.missingCategories.slice(0, 10).join(', ')) +
                (result.missingCategories.length > 10 ? '…' : '') + '</span>';
        }

        if (result.matched.length) {
            html += '<br><span style="color:#666;font-size:12px;">' +
                escapeHtml(result.matched.slice(0, 15).join('\n')) +
                (result.matched.length > 15 ? '\n…' : '') + '</span>';
        }

        $status
            .html(html)
            .css({
                background: isClean || hasMatches ? '#d5f4e6' : '#f9e2e2',
                borderLeft: '4px solid ' + (isClean || hasMatches ? '#00a32a' : '#d63638'),
                padding: '15px',
                borderRadius: '4px',
                whiteSpace: 'pre-wrap'
            })
            .show();

        if (hasMatches) {
            $('#shopify-mapping-table').get(0).scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    function applyCsvMappings(rows) {
        var collections = buildCollectionLookup();
        var categories = buildCategoryLookup();
        var matched = [];
        var missingCollections = [];
        var missingCategories = [];
        var skippedEmpty = 0;

        $.each(rows, function (_, row) {
            if (!row.category || !normalizeMappingName(row.category)) {
                skippedEmpty++;
                return;
            }

            var collectionKey = normalizeMappingName(row.shopify);
            var categoryKey = normalizeMappingName(row.category);
            var collection = collections[collectionKey];
            var categoryId = categories[categoryKey];

            if (!collection) {
                missingCollections.push(row.shopify);
                return;
            }

            if (!categoryId) {
                missingCategories.push(row.category + ' (for "' + row.shopify + '")');
                return;
            }

            collection.$select.val(categoryId);
            matched.push(row.shopify + ' → ' + row.category);
        });

        return {
            matched: matched,
            missingCollections: missingCollections,
            missingCategories: missingCategories,
            skippedEmpty: skippedEmpty
        };
    }

    $(document).on('click', '#shopify-apply-csv-mappings', function () {
        var $btn = $(this);
        var fileInput = document.getElementById('shopify-csv-mapping-file');
        var $status = $('#shopify-csv-import-status');

        if (!fileInput || !fileInput.files || !fileInput.files.length) {
            showStatus($status, 'Choose a CSV file first.', false);
            return;
        }

        if (!$('#shopify-mapping-table tbody tr').length) {
            showStatus($status, 'Scan collections first to load the mapping table.', false);
            return;
        }

        $btn.prop('disabled', true).text('Reading CSV...');
        $status.hide().empty();

        var reader = new FileReader();
        reader.onload = function (event) {
            var rows = parseCsvMappings(event.target.result);
            if (!rows.length) {
                showStatus($status, 'No valid rows found. Use two columns: Shopify collection, WooCommerce category.', false);
                $btn.prop('disabled', false).text('Apply CSV to Table');
                return;
            }

            showCsvImportStatus(applyCsvMappings(rows));
            $btn.prop('disabled', false).text('Apply CSV to Table');
        };
        reader.onerror = function () {
            showStatus($status, 'Could not read the CSV file.', false);
            $btn.prop('disabled', false).text('Apply CSV to Table');
        };
        reader.readAsText(fileInput.files[0]);
    });

    $('#shopify-save-new-site').on('click', function () {
        var $btn = $(this);
        var $status = $('#shopify-new-site-status');

        $btn.prop('disabled', true).text('Saving...');

        $.post(shopifyImporter.ajaxurl, {
            action: 'shopify_importer_save_site',
            nonce: shopifyImporter.nonce,
            name: $('#site-name').val(),
            url: $('#site-url').val(),
            brand: $('#site-brand').val(),
            cron_enabled: $('#site-cron').is(':checked') ? 1 : 0,
            cron_interval: $('#site-cron-interval').val()
        }).done(function (response) {
            if (response.success && response.data.redirect) {
                window.location.href = response.data.redirect;
                return;
            }
            showStatus($status, response.data ? response.data.message : 'Save failed', response.success);
        }).fail(function () {
            showStatus($status, 'Request failed', false);
        }).always(function () {
            $btn.prop('disabled', false).text('Save & Configure');
        });
    });

    $('.shopify-delete-site').on('click', function () {
        var siteId = $(this).data('site-id');
        var siteName = $(this).data('site-name');

        if (!confirm('Delete import site "' + siteName + '"? Saved mappings will be removed.')) {
            return;
        }

        $.post(shopifyImporter.ajaxurl, {
            action: 'shopify_importer_delete_site',
            nonce: shopifyImporter.nonce,
            site_id: siteId
        }).done(function () {
            location.reload();
        });
    });

    $('#shopify-delete-import-products').on('click', function () {
        var $btn = $(this);
        var siteId = $btn.data('site-id');
        var siteName = $btn.data('site-name');
        var productCount = $btn.data('product-count');
        var $status = $('#shopify-delete-products-status');

        if (!confirm(
            'Delete ALL ' + productCount + ' products imported from "' + siteName + '"?\n\n' +
            'This cannot be undone. Products from other imports are not affected.'
        )) {
            return;
        }

        $btn.prop('disabled', true).text('Deleting...');

        $.post(shopifyImporter.ajaxurl, {
            action: 'shopify_importer_delete_products',
            nonce: shopifyImporter.nonce,
            site_id: siteId
        }).done(function (response) {
            if (response.success) {
                showStatus($status, response.data.message, true);
                $btn.data('product-count', 0).prop('disabled', true).text('Delete All Products From This Import');
            } else {
                showStatus($status, response.data.message, false);
                $btn.prop('disabled', false).text('Delete All Products From This Import');
            }
        }).fail(function () {
            showStatus($status, 'Delete request failed', false);
            $btn.prop('disabled', false).text('Delete All Products From This Import');
        });
    });

    $('#shopify-save-site-settings').on('click', function () {
        var $status = $('#shopify-settings-status');

        $.post(shopifyImporter.ajaxurl, {
            action: 'shopify_importer_save_site',
            nonce: shopifyImporter.nonce,
            site_id: $('#shopify-site-id').val(),
            name: $('#edit-site-name').val(),
            url: $('#edit-site-url').val(),
            brand: $('#edit-site-brand').val(),
            price_multiplier: $('#edit-site-price-multiplier').val(),
            cron_enabled: $('#edit-site-cron').is(':checked') ? 1 : 0,
            cron_interval: $('#edit-site-cron-interval').val()
        }).done(function (response) {
            showStatus($status, response.data.message, response.success);
        });
    });

    $('#shopify-scan-collections').on('click', function () {
        var $btn = $(this);
        var $status = $('#shopify-status');

        $btn.prop('disabled', true).text('Scanning...');

        $.post(shopifyImporter.ajaxurl, {
            action: 'shopify_importer_scan_collections',
            nonce: shopifyImporter.nonce,
            site_id: $('#shopify-site-id').val()
        }).done(function (response) {
            if (response.success) {
                renderCollections(response.data.collections);
                showStatus($status, response.data.message, true);
            } else {
                showStatus($status, response.data.message, false);
            }
        }).fail(function () {
            showStatus($status, 'Scan failed', false);
        }).always(function () {
            $btn.prop('disabled', false).text('Scan Collections');
        });
    });

    $('#shopify-save-mappings').on('click', function () {
        var $btn = $(this);
        var $status = $('#shopify-status');
        var mappings = collectMappings();

        $btn.prop('disabled', true).text('Saving...');

        $.post(shopifyImporter.ajaxurl, {
            action: 'shopify_importer_save_mappings',
            nonce: shopifyImporter.nonce,
            site_id: $('#shopify-site-id').val(),
            mappings: JSON.stringify(mappings)
        }).done(function (response) {
            showStatus($status, response.data.message, response.success);
        }).always(function () {
            $btn.prop('disabled', false).text('Save Mappings');
        });
    });

    $('#shopify-start-import').on('click', function () {
        var resume = loadImportProgress();
        var startPage = 1;
        var startBatch = 0;
        var sessionKey = '';

        if (resume && resume.session_key) {
            if (!confirm('Resume the previous import from product ' + ((resume.batch || 0) + 1) + ' on page ' + (resume.page || 1) + '? Cancel to start fresh.')) {
                clearImportProgress();
            } else {
                startPage = resume.page || 1;
                startBatch = resume.batch || 0;
                sessionKey = resume.session_key;
            }
        } else if (!confirm('Start importing new products from Shopify?')) {
            return;
        }

        importRunning = true;
        $('#shopify-import-progress').show();
        $('#shopify-status').hide();
        $('#shopify-import-log').text('');
        $('#stat-imported, #stat-skipped, #stat-failed').text('0');
        $('#shopify-import-progress-bar').css('width', '0%').text('0%');
        $('#shopify-import-progress-text').text(resume && sessionKey ? 'Resuming import...' : 'Starting import...');
        $('#shopify-start-import').prop('disabled', true);

        runImportBatch(startPage, startBatch, sessionKey);
    });

    function runImportBatch(page, batch, sessionKey) {
        $.ajax({
            url: shopifyImporter.ajaxurl,
            type: 'POST',
            timeout: 180000,
            data: {
                action: 'shopify_importer_run_import',
                nonce: shopifyImporter.nonce,
                site_id: $('#shopify-site-id').val(),
                page: page,
                batch: batch,
                session_key: sessionKey
            }
        }).done(function (response) {
            if (!response.success) {
                importRunning = false;
                $('#shopify-start-import').prop('disabled', false);
                showStatus($('#shopify-status'), response.data.message, false);
                return;
            }

            var data = response.data;
            appendImportLog(data.log);

            if (data.has_more) {
                saveImportProgress(data.next_page, data.next_batch, data.session_key);
            }

            var progress = data.has_more ? Math.min(95, Math.round((data.processed / Math.max(data.processed + 8, 1)) * 100)) : 100;
            if (data.processed > 0) {
                progress = data.has_more ? Math.min(95, Math.round((data.processed % 250) / 250 * 100)) : 100;
            }

            $('#shopify-import-progress-bar').css('width', progress + '%').text(progress + '%');
            $('#shopify-import-progress-text').text(
                data.has_more
                    ? 'Processed ' + data.processed + ' products (page ' + data.page + ', batch ' + (data.batch + 1) + ')...'
                    : 'Import complete'
            );
            $('#stat-imported').text(data.imported);
            $('#stat-skipped').text(data.skipped);
            $('#stat-failed').text(data.failed);

            if (data.has_more) {
                runImportBatch(data.next_page, data.next_batch, data.session_key);
            } else {
                importRunning = false;
                clearImportProgress();
                $('#shopify-start-import').prop('disabled', false);
                var msg = 'Import complete. Imported: ' + data.imported + ', Skipped: ' + data.skipped + ', Failed: ' + data.failed;
                if (data.log_url) {
                    msg += '<br><a href="' + data.log_url + '" target="_blank">Download full log</a>';
                }
                showStatus($('#shopify-status'), msg, true);
            }
        }).fail(function (xhr, textStatus) {
            importRunning = false;
            $('#shopify-start-import').prop('disabled', false);

            var message = 'Import request failed';
            if (textStatus === 'timeout') {
                message = 'Request timed out. Click Start Import again to resume from where it stopped.';
            } else if (xhr.responseJSON && xhr.responseJSON.data && xhr.responseJSON.data.message) {
                message = xhr.responseJSON.data.message;
            } else if (xhr.status === 500) {
                message = 'Server error (often image processing or duplicate SKU). Check debug.log and the import log. Click Start Import again to resume.';
            }

            if (loadImportProgress()) {
                message += ' Your progress was saved — Start Import will offer to resume.';
            }

            showStatus($('#shopify-status'), message, false);
        });
    }

    function appendPriceUpdateLog(lines) {
        if (!lines || !lines.length) {
            return;
        }

        var $log = $('#shopify-price-update-log');
        var current = $log.text();
        var addition = lines.join('\n');
        $log.text(current ? current + '\n' + addition : addition);
        $log.scrollTop($log[0].scrollHeight);
    }

    $('#shopify-update-prices').on('click', function () {
        if (!confirm('Update prices for all imported products from this Shopify site?')) {
            return;
        }

        $('#shopify-price-update-progress').show();
        $('#shopify-price-update-log').text('');
        $('#price-stat-updated, #price-stat-unchanged, #price-stat-skipped').text('0');
        $('#shopify-price-update-progress-bar').css('width', '0%').text('0%');
        $('#shopify-price-update-progress-text').text('Starting price update...');
        $('#shopify-update-prices').prop('disabled', true);

        runPriceUpdateBatch(1, 0, '');
    });

    function runPriceUpdateBatch(page, batch, sessionKey) {
        $.ajax({
            url: shopifyImporter.ajaxurl,
            type: 'POST',
            timeout: 180000,
            data: {
                action: 'shopify_importer_update_prices',
                nonce: shopifyImporter.nonce,
                site_id: $('#shopify-site-id').val(),
                page: page,
                batch: batch,
                session_key: sessionKey
            }
        }).done(function (response) {
            if (!response.success) {
                $('#shopify-update-prices').prop('disabled', false);
                showStatus($('#shopify-status'), response.data.message, false);
                return;
            }

            var data = response.data;
            appendPriceUpdateLog(data.log);

            var progress = data.has_more ? Math.min(95, Math.round((data.processed % 250) / 250 * 100)) : 100;
            if (data.processed > 0 && !data.has_more) {
                progress = 100;
            }

            $('#shopify-price-update-progress-bar').css('width', progress + '%').text(progress + '%');
            $('#shopify-price-update-progress-text').text(
                data.has_more
                    ? 'Processed ' + data.processed + ' products (page ' + data.page + ', batch ' + (data.batch + 1) + ')...'
                    : 'Price update complete'
            );
            $('#price-stat-updated').text(data.updated);
            $('#price-stat-unchanged').text(data.unchanged);
            $('#price-stat-skipped').text(data.skipped);

            if (data.has_more) {
                runPriceUpdateBatch(data.next_page, data.next_batch, data.session_key);
            } else {
                $('#shopify-update-prices').prop('disabled', false);
                var msg = 'Price update complete. Updated: ' + data.updated + ', Unchanged: ' + data.unchanged + ', Skipped: ' + data.skipped;
                if (data.log_url) {
                    msg += '<br><a href="' + data.log_url + '" target="_blank">Download full log</a>';
                }
                showStatus($('#shopify-status'), msg, true);
            }
        }).fail(function (xhr, textStatus) {
            $('#shopify-update-prices').prop('disabled', false);

            var message = 'Price update request failed';
            if (textStatus === 'timeout') {
                message = 'Request timed out. Click Update Prices again to continue.';
            } else if (xhr.responseJSON && xhr.responseJSON.data && xhr.responseJSON.data.message) {
                message = xhr.responseJSON.data.message;
            }

            showStatus($('#shopify-status'), message, false);
        });
    }

    function appendCategoryUpdateLog(lines) {
        if (!lines || !lines.length) {
            return;
        }

        var $log = $('#shopify-category-update-log');
        var current = $log.text();
        var addition = lines.join('\n');
        $log.text(current ? current + '\n' + addition : addition);
        $log.scrollTop($log[0].scrollHeight);
    }

    $('#shopify-update-categories').on('click', function () {
        if (!confirm('Re-apply category mappings to all products matched by SKU from this Shopify site?')) {
            return;
        }

        $('#shopify-category-update-progress').show();
        $('#shopify-category-update-log').text('');
        $('#category-stat-updated, #category-stat-unchanged, #category-stat-skipped').text('0');
        $('#shopify-category-update-progress-bar').css('width', '0%').text('0%');
        $('#shopify-category-update-progress-text').text('Starting category update...');
        $('#shopify-update-categories').prop('disabled', true);

        runCategoryUpdateBatch(1, 0, '');
    });

    function runCategoryUpdateBatch(page, batch, sessionKey) {
        $.ajax({
            url: shopifyImporter.ajaxurl,
            type: 'POST',
            timeout: 180000,
            data: {
                action: 'shopify_importer_update_categories',
                nonce: shopifyImporter.nonce,
                site_id: $('#shopify-site-id').val(),
                page: page,
                batch: batch,
                session_key: sessionKey
            }
        }).done(function (response) {
            if (!response.success) {
                $('#shopify-update-categories').prop('disabled', false);
                showStatus($('#shopify-status'), response.data.message, false);
                return;
            }

            var data = response.data;
            appendCategoryUpdateLog(data.log);

            var progress = data.has_more ? Math.min(95, Math.round((data.processed % 250) / 250 * 100)) : 100;
            if (data.processed > 0 && !data.has_more) {
                progress = 100;
            }

            $('#shopify-category-update-progress-bar').css('width', progress + '%').text(progress + '%');
            $('#shopify-category-update-progress-text').text(
                data.has_more
                    ? 'Processed ' + data.processed + ' products (page ' + data.page + ', batch ' + (data.batch + 1) + ')...'
                    : 'Category update complete'
            );
            $('#category-stat-updated').text(data.updated);
            $('#category-stat-unchanged').text(data.unchanged);
            $('#category-stat-skipped').text(data.skipped);

            if (data.has_more) {
                runCategoryUpdateBatch(data.next_page, data.next_batch, data.session_key);
            } else {
                $('#shopify-update-categories').prop('disabled', false);
                var msg = 'Category update complete. Updated: ' + data.updated + ', Unchanged: ' + data.unchanged + ', Skipped: ' + data.skipped;
                if (data.log_url) {
                    msg += '<br><a href="' + data.log_url + '" target="_blank">Download full log</a>';
                }
                showStatus($('#shopify-status'), msg, true);
            }
        }).fail(function (xhr, textStatus) {
            $('#shopify-update-categories').prop('disabled', false);

            var message = 'Category update request failed';
            if (textStatus === 'timeout') {
                message = 'Request timed out. Click Update Categories again to continue.';
            } else if (xhr.responseJSON && xhr.responseJSON.data && xhr.responseJSON.data.message) {
                message = xhr.responseJSON.data.message;
            }

            showStatus($('#shopify-status'), message, false);
        });
    }
})(jQuery);
