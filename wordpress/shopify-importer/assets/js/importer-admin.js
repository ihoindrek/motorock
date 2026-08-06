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
                ? '<br><span style="color:#996800;font-size:12px;">Lai kollektsioon — kategooria seostamisel ignoreeritakse</span>'
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

            if ((/^shopify\s+(collection|kollektsioon)$/i.test(shopifyName) || /^shopify\s+kollektsioon$/i.test(shopifyName))
                && (/^woo?commerce\s+(category|kategooria)$/i.test(categoryName) || /^woo?commerce\s+kategooria$/i.test(categoryName))) {
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

        html += '<strong>' + result.matched.length + ' seost rakendati tabelile.</strong>';
        html += ' Klõpsa <strong>Salvesta seosed</strong>, et need salvestada.';

        if (result.skippedEmpty) {
            html += '<br><span style="color:#666;">Jäeti vahele ' + result.skippedEmpty + ' rida ilma WooCommerce kategooriata (jääb vaikimisi).</span>';
        }

        if (result.missingCollections.length) {
            html += '<br><span style="color:#996800;">Kollektsioone ei leitud (' + result.missingCollections.length + '): ' +
                escapeHtml(result.missingCollections.slice(0, 20).join(', ')) +
                (result.missingCollections.length > 20 ? '…' : '') + '</span>';
        }

        if (result.missingCategories.length) {
            html += '<br><span style="color:#996800;">Kategooriaid ei leitud (' + result.missingCategories.length + '): ' +
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
                missingCategories.push(row.category + ' (kollektsioon "' + row.shopify + '")');
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
            showStatus($status, 'Vali esmalt CSV fail.', false);
            return;
        }

        if (!$('#shopify-mapping-table tbody tr').length) {
            showStatus($status, 'Skaneeri esmalt kollektsioonid, et laadida seoste tabel.', false);
            return;
        }

        $btn.prop('disabled', true).text('Loen CSV-d...');
        $status.hide().empty();

        var reader = new FileReader();
        reader.onload = function (event) {
            var rows = parseCsvMappings(event.target.result);
            if (!rows.length) {
                showStatus($status, 'Kehtivaid ridu ei leitud. Kasuta kahte veergu: Shopify kollektsioon, WooCommerce kategooria.', false);
                $btn.prop('disabled', false).text('Rakenda CSV tabelile');
                return;
            }

            showCsvImportStatus(applyCsvMappings(rows));
            $btn.prop('disabled', false).text('Rakenda CSV tabelile');
        };
        reader.onerror = function () {
            showStatus($status, 'CSV faili lugemine ebaõnnestus.', false);
            $btn.prop('disabled', false).text('Rakenda CSV tabelile');
        };
        reader.readAsText(fileInput.files[0]);
    });

    $('#shopify-save-new-site').on('click', function () {
        var $btn = $(this);
        var $status = $('#shopify-new-site-status');

        $btn.prop('disabled', true).text('Salvestan...');

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
            showStatus($status, response.data ? response.data.message : 'Salvestamine ebaõnnestus', response.success);
        }).fail(function () {
            showStatus($status, 'Päring ebaõnnestus', false);
        }).always(function () {
            $btn.prop('disabled', false).text('Salvesta ja seadista');
        });
    });

    $('.shopify-delete-site').on('click', function () {
        var siteId = $(this).data('site-id');
        var siteName = $(this).data('site-name');

        if (!confirm('Kustuta impordipood "' + siteName + '"? Salvestatud seosed eemaldatakse.')) {
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
            'Kustuta KÕIK ' + productCount + ' toodet, mis on imporditud poest "' + siteName + '"?\n\n' +
            'Seda ei saa tagasi võtta. Teiste importide tooted jäävad puutumata.'
        )) {
            return;
        }

        $btn.prop('disabled', true).text('Kustutan...');

        $.post(shopifyImporter.ajaxurl, {
            action: 'shopify_importer_delete_products',
            nonce: shopifyImporter.nonce,
            site_id: siteId
        }).done(function (response) {
            if (response.success) {
                showStatus($status, response.data.message, true);
                $btn.data('product-count', 0).prop('disabled', true).text('Kustuta kõik selle impordi tooted');
            } else {
                showStatus($status, response.data.message, false);
                $btn.prop('disabled', false).text('Kustuta kõik selle impordi tooted');
            }
        }).fail(function () {
            showStatus($status, 'Kustutamise päring ebaõnnestus', false);
            $btn.prop('disabled', false).text('Kustuta kõik selle impordi tooted');
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
            price_sync_mode: $('#edit-site-price-sync-mode').val(),
            auto_draft_stale: $('#edit-site-auto-draft-stale').is(':checked') ? 1 : 0,
            cron_enabled: $('#edit-site-cron').is(':checked') ? 1 : 0,
            cron_interval: $('#edit-site-cron-interval').val()
        }).done(function (response) {
            showStatus($status, response.data.message, response.success);
        });
    });

    $('#shopify-scan-collections').on('click', function () {
        var $btn = $(this);
        var $status = $('#shopify-status');

        $btn.prop('disabled', true).text('Skaneerin...');

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
            showStatus($status, 'Skaneerimine ebaõnnestus', false);
        }).always(function () {
            $btn.prop('disabled', false).text('Skaneeri kollektsioonid');
        });
    });

    $('#shopify-save-mappings').on('click', function () {
        var $btn = $(this);
        var $status = $('#shopify-status');
        var mappings = collectMappings();

        $btn.prop('disabled', true).text('Salvestan...');

        $.post(shopifyImporter.ajaxurl, {
            action: 'shopify_importer_save_mappings',
            nonce: shopifyImporter.nonce,
            site_id: $('#shopify-site-id').val(),
            mappings: JSON.stringify(mappings)
        }).done(function (response) {
            showStatus($status, response.data.message, response.success);
        }).always(function () {
            $btn.prop('disabled', false).text('Salvesta seosed');
        });
    });

    $('#shopify-start-import').on('click', function () {
        var resume = loadImportProgress();
        var startPage = 1;
        var startBatch = 0;
        var sessionKey = '';

        if (resume && resume.session_key) {
            if (confirm('Jätkan eelmist importi tootelt ' + ((resume.batch || 0) + 1) + ' lehel ' + (resume.page || 1) + '?')) {
                startPage = resume.page || 1;
                startBatch = resume.batch || 0;
                sessionKey = resume.session_key;
            } else {
                clearImportProgress();
                if (!confirm('Alustan Shopify toodete importi otsast?')) {
                    return;
                }
            }
        } else if (!confirm('Alustan Shopify toodete importi?')) {
            return;
        }

        importRunning = true;
        $('#shopify-import-progress').show();
        $('#shopify-status').hide();
        $('#shopify-import-log').text('');
        $('#stat-imported, #stat-updated, #stat-skipped, #stat-failed').text('0');
        $('#shopify-import-progress-bar').css('width', '0%').text('0%');
        $('#shopify-import-progress-text').text(sessionKey ? 'Jätkan importi...' : 'Ühendun Shopify\'ga — esimene toode võtab hetke...');
        $('#shopify-start-import').prop('disabled', true).text('Import käib...');

        var $progress = $('#shopify-import-progress');
        if ($progress.length) {
            $progress[0].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

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
                $('#shopify-start-import').prop('disabled', false).text('Alusta importi');
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
                    ? 'Töödeldud ' + data.processed + ' toodet (leht ' + data.page + ', partii ' + (data.batch + 1) + ')...'
                    : 'Import lõpetatud'
            );
            $('#stat-imported').text(data.imported);
            $('#stat-updated').text(data.updated || 0);
            $('#stat-skipped').text(data.skipped);
            $('#stat-failed').text(data.failed);

            if (data.has_more) {
                runImportBatch(data.next_page, data.next_batch, data.session_key);
            } else {
                importRunning = false;
                clearImportProgress();
                $('#shopify-import-progress-bar').css('width', '100%').text('100%');
                $('#shopify-import-progress-text').html(
                    '<span style="color:#00a32a;font-size:18px;">✓ Import on lõpetatud</span>'
                );
                $('#shopify-start-import').prop('disabled', false).text('Alusta importi');
                var msg = '<strong style="font-size:16px;">Import on lõpetatud.</strong><br>' +
                    'Imporditud: <strong>' + data.imported + '</strong>, ' +
                    'uuendatud: <strong>' + (data.updated || 0) + '</strong>, ' +
                    'vahele jäetud: <strong>' + data.skipped + '</strong>, ' +
                    'ebaõnnestunud: <strong>' + data.failed + '</strong>.';
                if (data.log_url) {
                    msg += '<br><a href="' + data.log_url + '" target="_blank">Laadi täielik logi alla</a>';
                }
                showStatus($('#shopify-status'), msg, true);
                $('#shopify-status')[0].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }).fail(function (xhr, textStatus) {
            importRunning = false;
            $('#shopify-start-import').prop('disabled', false);

            var message = 'Impordi päring ebaõnnestus';
            if (textStatus === 'timeout') {
                message = 'Päring aegus. Klõpsa uuesti Alusta importi, et sealt jätkata.';
            } else if (xhr.responseJSON && xhr.responseJSON.data && xhr.responseJSON.data.message) {
                message = xhr.responseJSON.data.message;
            } else if (xhr.status === 500) {
                message = 'Serveri viga (sageli pildi töötlus või duplikaat SKU). Vaata debug.log ja impordi logi. Klõpsa Alusta importi, et jätkata.';
            }

            if (loadImportProgress()) {
                message += ' Edenemine on salvestatud — Alusta importi pakub jätkamist.';
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
        if (!confirm(
            'Uuendan Shopify tavahinnad?\n\n' +
            'Kampaania soodushindu ei kasutata — allahinnatud variandid kasutavad tavahinda (compare-at).'
        )) {
            return;
        }

        $('#shopify-price-update-log').text('');
        $('#price-stat-updated, #price-stat-unchanged, #price-stat-skipped').text('0');
        $('#shopify-price-update-progress-bar').css('width', '0%').text('0%');
        $('#shopify-price-update-progress-text').text('Käivitan hinnauuendust...');
        $('#shopify-update-prices').prop('disabled', true).text('Uuendan...');
        var $priceProgress = $('#shopify-price-update-progress');
        $priceProgress.show();
        if ($priceProgress.length) {
            $priceProgress[0].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

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
                $('#shopify-update-prices').prop('disabled', false).text('Uuenda hindu');
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
                    ? 'Töödeldud ' + data.processed + ' toodet (leht ' + data.page + ', partii ' + (data.batch + 1) + ')...'
                    : 'Hinnauuendus lõpetatud'
            );
            $('#price-stat-updated').text(data.updated);
            $('#price-stat-unchanged').text(data.unchanged);
            $('#price-stat-skipped').text(data.skipped);

            if (data.has_more) {
                runPriceUpdateBatch(data.next_page, data.next_batch, data.session_key);
            } else {
                $('#shopify-update-prices').prop('disabled', false).text('Uuenda hindu');
                var msg = 'Hinnauuendus lõpetatud. Uuendatud: ' + data.updated + ', muutumata: ' + data.unchanged + ', vahele jäetud: ' + data.skipped;
                if (data.log_url) {
                    msg += '<br><a href="' + data.log_url + '" target="_blank">Laadi täielik logi alla</a>';
                }
                showStatus($('#shopify-status'), msg, true);
            }
        }).fail(function (xhr, textStatus) {
            $('#shopify-update-prices').prop('disabled', false);

            var message = 'Hinnauuenduse päring ebaõnnestus';
            if (textStatus === 'timeout') {
                message = 'Päring aegus. Klõpsa Uuenda hindu uuesti, et jätkata.';
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
        if (!confirm('Rakendan kategooria seosed uuesti kõigile toodetele SKU järgi sellest Shopify poest?')) {
            return;
        }

        $('#shopify-category-update-progress').show();
        $('#shopify-category-update-log').text('');
        $('#category-stat-updated, #category-stat-unchanged, #category-stat-skipped').text('0');
        $('#shopify-category-update-progress-bar').css('width', '0%').text('0%');
        $('#shopify-category-update-progress-text').text('Käivitan kategooriauuendust...');
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
                    ? 'Töödeldud ' + data.processed + ' toodet (leht ' + data.page + ', partii ' + (data.batch + 1) + ')...'
                    : 'Kategooriauuendus lõpetatud'
            );
            $('#category-stat-updated').text(data.updated);
            $('#category-stat-unchanged').text(data.unchanged);
            $('#category-stat-skipped').text(data.skipped);

            if (data.has_more) {
                runCategoryUpdateBatch(data.next_page, data.next_batch, data.session_key);
            } else {
                $('#shopify-update-categories').prop('disabled', false);
                var msg = 'Kategooriauuendus lõpetatud. Uuendatud: ' + data.updated + ', muutumata: ' + data.unchanged + ', vahele jäetud: ' + data.skipped;
                if (data.log_url) {
                    msg += '<br><a href="' + data.log_url + '" target="_blank">Laadi täielik logi alla</a>';
                }
                showStatus($('#shopify-status'), msg, true);
            }
        }).fail(function (xhr, textStatus) {
            $('#shopify-update-categories').prop('disabled', false);

            var message = 'Kategooriauuenduse päring ebaõnnestus';
            if (textStatus === 'timeout') {
                message = 'Päring aegus. Klõpsa Uuenda kategooriaid uuesti, et jätkata.';
            } else if (xhr.responseJSON && xhr.responseJSON.data && xhr.responseJSON.data.message) {
                message = xhr.responseJSON.data.message;
            }

            showStatus($('#shopify-status'), message, false);
        });
    }
})(jQuery);
