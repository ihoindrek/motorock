(function ($) {
    'use strict';

    function showStatus($el, message, success) {
        $el.removeClass('is-success is-error')
            .addClass(success ? 'is-success' : 'is-error')
            .html(message)
            .show();
    }

    function collectCategoryMappings() {
        var mappings = {};
        $('.mci-category-mapping-select').each(function () {
            var source = $(this).data('source');
            var value = $(this).val();
            if (source && value) {
                mappings[source] = value;
            }
        });
        return mappings;
    }

    function collectColumnMappings() {
        var mappings = {};
        $('.mci-column-map-select, .mci-column-map-input').each(function () {
            var field = $(this).data('field');
            var value = $(this).val();
            if (field && value) {
                mappings[field] = value;
            }
        });
        return mappings;
    }

    function toggleGenericSections() {
        var isGeneric = $('#mci-feed-adapter').val() === 'generic_csv';
        $('.mci-generic-only').toggle(isGeneric);
    }

    function toggleImportDescription() {
        var isUpdate = $('#mci-import-mode').val() === 'update_only';
        $('.mci-import-desc-full').toggle(!isUpdate);
        $('.mci-import-desc-update').toggle(isUpdate);
    }

    function initCategoryMappingSelects() {
        if (typeof $.fn.selectWoo !== 'function') {
            return;
        }

        $('.mci-category-mapping-select').each(function () {
            var $select = $(this);
            if ($select.hasClass('select2-hidden-accessible')) {
                return;
            }

            $select.selectWoo({
                width: '100%',
                allowClear: true,
                placeholder: 'Search Motorock category…',
                minimumResultsForSearch: 0
            });
        });
    }

    function saveFeedSettings($status, silent) {
        var request = $.post(motorockCatalogImporter.ajaxurl, {
            action: 'motorock_catalog_save_feed',
            nonce: motorockCatalogImporter.nonce,
            feed_id: $('#mci-feed-id').val(),
            name: $('#mci-feed-name').val(),
            adapter: $('#mci-feed-adapter').val(),
            brand: $('#mci-feed-brand').val(),
            price_multiplier: $('#mci-feed-multiplier').val(),
            default_import_mode: $('#mci-default-import-mode').val(),
            category_mappings: collectCategoryMappings(),
            column_map: collectColumnMappings()
        });

        if (!silent) {
            request.done(function (response) {
                showStatus($status, response.data.message || 'Saved.', true);
            }).fail(function (xhr) {
                var message = xhr.responseJSON && xhr.responseJSON.data ? xhr.responseJSON.data.message : 'Save failed.';
                showStatus($status, message, false);
            });
        }

        return request;
    }

    $('#mci-feed-adapter').on('change', toggleGenericSections);
    $('#mci-import-mode').on('change', toggleImportDescription);
    toggleGenericSections();
    toggleImportDescription();
    initCategoryMappingSelects();

    $('#mci-save-new-feed').on('click', function () {
        var $status = $('#mci-new-feed-status');
        $.post(motorockCatalogImporter.ajaxurl, {
            action: 'motorock_catalog_save_feed',
            nonce: motorockCatalogImporter.nonce,
            name: $('#new-feed-name').val(),
            adapter: $('#new-feed-adapter').val(),
            brand: $('#new-feed-brand').val()
        }).done(function (response) {
            if (response.success && response.data.redirect) {
                window.location.href = response.data.redirect;
                return;
            }
            showStatus($status, response.data.message || 'Saved.', true);
        }).fail(function (xhr) {
            var message = xhr.responseJSON && xhr.responseJSON.data ? xhr.responseJSON.data.message : 'Save failed.';
            showStatus($status, message, false);
        });
    });

    $('.mci-delete-feed').on('click', function () {
        if (!confirm('Delete this feed configuration?')) {
            return;
        }
        var feedId = $(this).data('feed-id');
        $.post(motorockCatalogImporter.ajaxurl, {
            action: 'motorock_catalog_delete_feed',
            nonce: motorockCatalogImporter.nonce,
            feed_id: feedId
        }).done(function () {
            window.location.reload();
        });
    });

    $('#mci-save-feed, #mci-save-category-mappings').on('click', function () {
        saveFeedSettings($('#mci-status'));
    });

    $('#mci-upload-csv').on('click', function () {
        var fileInput = document.getElementById('mci-csv-file');
        var $status = $('#mci-status');
        if (!fileInput || !fileInput.files.length) {
            showStatus($status, 'Choose a CSV file first.', false);
            return;
        }

        var formData = new FormData();
        formData.append('action', 'motorock_catalog_upload_csv');
        formData.append('nonce', motorockCatalogImporter.nonce);
        formData.append('feed_id', $('#mci-feed-id').val());
        formData.append('csv_file', fileInput.files[0]);

        $.ajax({
            url: motorockCatalogImporter.ajaxurl,
            method: 'POST',
            data: formData,
            processData: false,
            contentType: false
        }).done(function (response) {
            showStatus($status, response.data.message || 'Uploaded.', true);
            window.setTimeout(function () { window.location.reload(); }, 800);
        }).fail(function (xhr) {
            var message = xhr.responseJSON && xhr.responseJSON.data ? xhr.responseJSON.data.message : 'Upload failed.';
            showStatus($status, message, false);
        });
    });

    var importRunning = false;

    function appendLog(lines) {
        var $log = $('#mci-import-log');
        if (!lines || !lines.length) {
            return;
        }
        $log.append(lines.join('\n') + '\n');
        $log.scrollTop($log[0].scrollHeight);
    }

    function runImportBatch(feedId, sessionKey, index) {
        return $.ajax({
            url: motorockCatalogImporter.ajaxurl,
            method: 'POST',
            timeout: 300000,
            data: {
                action: 'motorock_catalog_run_import',
                nonce: motorockCatalogImporter.nonce,
                feed_id: feedId,
                session_key: sessionKey,
                index: index
            }
        });
    }

    function startImport(importMode) {
        if (importRunning) {
            return;
        }

        var confirmMessage = importMode === 'update_only'
            ? 'Start stock/price update from CSV? Existing SKUs will be updated; unknown SKUs are skipped.'
            : 'Start catalog import? Existing SKUs will be updated.';

        if (!confirm(confirmMessage)) {
            return;
        }

        importRunning = true;
        var feedId = $('#mci-feed-id').val();
        var $status = $('#mci-status');
        var importModeLocal = importMode;
        var $progress = $('#mci-import-progress');
        var buttonLabel = importMode === 'update_only' ? 'Update running...' : 'Import running...';

        $progress.show();
        $('#mci-import-log').text('');
        $('#mci-import-progress-bar').css('width', '0%').text('0%');
        $('#mci-start-import').prop('disabled', true).text(buttonLabel);

        saveFeedSettings($status, true).done(function () {
            $.post(motorockCatalogImporter.ajaxurl, {
                action: 'motorock_catalog_prepare_import',
                nonce: motorockCatalogImporter.nonce,
                feed_id: feedId,
                import_mode: importModeLocal
            }).done(function (prepareResponse) {
                if (!prepareResponse.success) {
                    throw new Error(prepareResponse.data && prepareResponse.data.message ? prepareResponse.data.message : 'Prepare failed.');
                }

                var sessionKey = prepareResponse.data.session_key;
                var total = prepareResponse.data.total;
                var index = 0;

                function step() {
                    runImportBatch(feedId, sessionKey, index).done(function (response) {
                        if (!response.success) {
                            throw new Error(response.data && response.data.message ? response.data.message : 'Import batch failed.');
                        }

                        var data = response.data;
                        appendLog(data.log);
                        $('#mci-stat-imported').text(data.stats.imported);
                        $('#mci-stat-updated').text(data.stats.updated);
                        $('#mci-stat-skipped').text(data.stats.skipped);
                        $('#mci-stat-failed').text(data.stats.failed);
                        $('#mci-import-progress-bar').css('width', data.progress + '%').text(data.progress + '%');
                        $('#mci-import-progress-text').text('Processed ' + Math.min(data.index, total) + ' / ' + total);

                        if (data.done) {
                            importRunning = false;
                            $('#mci-start-import').prop('disabled', false).text('Prepare & start import');
                            showStatus($status, 'Import complete.', true);
                            return;
                        }

                        index = data.index;
                        step();
                    }).fail(function (xhr) {
                        importRunning = false;
                        $('#mci-start-import').prop('disabled', false).text('Prepare & start import');
                        var message = xhr.responseJSON && xhr.responseJSON.data ? xhr.responseJSON.data.message : 'Import failed.';
                        showStatus($status, message, false);
                    });
                }

                step();
            }).fail(function (xhr) {
                importRunning = false;
                $('#mci-start-import').prop('disabled', false).text('Prepare & start import');
                var message = xhr.responseJSON && xhr.responseJSON.data ? xhr.responseJSON.data.message : 'Prepare failed.';
                showStatus($status, message, false);
            });
        }).fail(function (xhr) {
            importRunning = false;
            $('#mci-start-import').prop('disabled', false).text('Prepare & start import');
            var message = xhr.responseJSON && xhr.responseJSON.data ? xhr.responseJSON.data.message : 'Save failed before import.';
            showStatus($status, message, false);
        });
    }

    $('#mci-start-import').on('click', function () {
        startImport($('#mci-import-mode').val());
    });
})(jQuery);
