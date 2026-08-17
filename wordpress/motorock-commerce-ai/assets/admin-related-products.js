(function () {
  if (typeof MotorockCommerceAiRelated === "undefined" || typeof MotorockAiStorefront === "undefined") {
    return;
  }

  var singleButton = document.getElementById("motorock-related-generate");
  var singleResultEl = document.getElementById("motorock-related-result");
  var bulkStartButton = document.getElementById("motorock-related-bulk-start");
  var bulkSelectAll = document.getElementById("motorock-related-bulk-select-all");
  var maxBulk = Number(MotorockCommerceAiRelated.maxBulk) || 25;

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function selectedSingleLocale() {
    var checked = document.querySelector('input[name="motorock-related-locale"]:checked');
    return checked ? checked.value : "en";
  }

  function selectedBulkLocale() {
    var checked = document.querySelector('input[name="motorock-related-bulk-locale"]:checked');
    return checked ? checked.value : "en";
  }

  function formatFailureMessage(data, error) {
    if (error && error.message) {
      return error.message;
    }

    if (!data) {
      return MotorockCommerceAiRelated.i18n.failed;
    }

    if (data.code === "not_implemented") {
      return MotorockCommerceAiRelated.i18n.notDeployed || data.error;
    }

    if (data.error) {
      return data.error;
    }

    if (data.result && data.result.validationErrors && data.result.validationErrors.length) {
      return data.result.validationErrors.join("; ");
    }

    if (data.result && data.result.error) {
      return data.result.error;
    }

    if (data.code) {
      return MotorockCommerceAiRelated.i18n.failed + " (" + data.code + ")";
    }

    return MotorockCommerceAiRelated.i18n.failed;
  }

  function renderSingleResult(data) {
    if (!data || !data.result) {
      return "";
    }

    var result = data.result;
    var html = "";

    if (result.validationErrors && result.validationErrors.length) {
      html +=
        "<p><strong>Validation:</strong> " +
        escapeHtml(result.validationErrors.join("; ")) +
        "</p>";
    }

    var slugs = result.relatedSlugs || (result.preview && result.preview.relatedSlugs) || [];
    if (slugs.length) {
      html +=
        "<p><strong>" +
        escapeHtml(MotorockCommerceAiRelated.i18n.relatedSlugs) +
        ":</strong> " +
        escapeHtml(slugs.join(", ")) +
        "</p>";
    }

    if (result.preview && result.preview.items && result.preview.items.length) {
      html += "<ul>";
      result.preview.items.forEach(function (item) {
        html +=
          "<li><code>" +
          escapeHtml(item.slug) +
          "</code> — " +
          escapeHtml(item.reason) +
          "</li>";
      });
      html += "</ul>";
    }

    return html;
  }

  function wrapRequest(promise) {
    if (window.MotorockAiConnectionGuard) {
      return MotorockAiConnectionGuard.wrap(promise);
    }
    return promise;
  }

  function runRelatedRequest(productId, locale, dryRun) {
    return wrapRequest(
      window.MotorockAiStorefront.runCommerceAi({
        skill: "catalog.related_products",
        locale: locale,
        target: {
          productId: productId,
        },
        options: {
          dryRun: dryRun,
        },
      })
    ).then(function (data) {
      var ok = data && (data.ok || (data.result && data.result.ok));
      return {
        ok: Boolean(ok),
        data: data,
        error: ok ? "" : formatFailureMessage(data),
        slugs:
          (data.result && (data.result.relatedSlugs || (data.result.preview && data.result.preview.relatedSlugs))) ||
          [],
      };
    });
  }

  if (singleButton && singleResultEl) {
    singleButton.addEventListener("click", function () {
      var productId = Number(document.getElementById("motorock-related-product-id").value);
      if (!Number.isInteger(productId) || productId <= 0) {
        singleResultEl.innerHTML =
          "<p>" + escapeHtml(MotorockCommerceAiRelated.i18n.needProduct) + "</p>";
        return;
      }

      var dryRun = document.getElementById("motorock-related-dry-run").checked;
      singleButton.disabled = true;
      singleResultEl.innerHTML =
        "<p>" + escapeHtml(MotorockCommerceAiRelated.i18n.running) + "</p>";

      runRelatedRequest(productId, selectedSingleLocale(), dryRun)
        .then(function (result) {
          singleResultEl.innerHTML =
            "<p>" +
            escapeHtml(
              result.ok
                ? dryRun
                  ? MotorockCommerceAiRelated.i18n.dryRunOk
                  : MotorockCommerceAiRelated.i18n.saved
                : result.error
            ) +
            "</p>" +
            renderSingleResult(result.data);
        })
        .catch(function (error) {
          singleResultEl.innerHTML =
            "<p>" + escapeHtml(formatFailureMessage(null, error)) + "</p>";
        })
        .finally(function () {
          singleButton.disabled = false;
        });
    });
  }

  function appendBulkLog(message, isError) {
    var logEl = document.getElementById("motorock-related-bulk-log");
    if (!logEl) {
      return;
    }

    var list = logEl.querySelector(".motorock-related-bulk-log-list");
    if (!list) {
      logEl.innerHTML = "<ul class='motorock-related-bulk-log-list'></ul>";
      list = logEl.querySelector(".motorock-related-bulk-log-list");
    }

    list.insertAdjacentHTML(
      "beforeend",
      "<li class='motorock-related-bulk-log-item" +
        (isError ? " motorock-related-bulk-log-item--error" : "") +
        "'>" +
        message +
        "</li>"
    );
  }

  function selectedBulkTargets() {
    return Array.prototype.slice
      .call(document.querySelectorAll(".motorock-related-bulk-product:checked"))
      .map(function (input) {
        return {
          productId: Number(input.value),
          title: input.getAttribute("data-title") || input.value,
        };
      })
      .filter(function (target) {
        return Number.isInteger(target.productId) && target.productId > 0;
      });
  }

  if (bulkSelectAll) {
    bulkSelectAll.addEventListener("change", function () {
      var checked = bulkSelectAll.checked;
      document.querySelectorAll(".motorock-related-bulk-product").forEach(function (input) {
        input.checked = checked;
      });
    });
  }

  if (bulkStartButton) {
    bulkStartButton.addEventListener("click", function () {
      var targets = selectedBulkTargets();
      var progressEl = document.getElementById("motorock-related-bulk-progress");
      var dryRun = document.getElementById("motorock-related-bulk-dry-run").checked;
      var locale = selectedBulkLocale();

      if (!targets.length) {
        if (progressEl) {
          progressEl.innerHTML =
            "<p class='notice notice-warning inline'>" +
            escapeHtml(MotorockCommerceAiRelated.i18n.bulkPick) +
            "</p>";
        }
        return;
      }

      if (targets.length > maxBulk) {
        targets = targets.slice(0, maxBulk);
        appendBulkLog(
          escapeHtml(
            MotorockCommerceAiRelated.i18n.bulkTruncated.replace("%d", String(maxBulk))
          ),
          false
        );
      }

      var succeeded = 0;
      var failed = 0;
      var startedAt = Date.now();

      bulkStartButton.disabled = true;
      if (singleButton) {
        singleButton.disabled = true;
      }

      if (progressEl) {
        progressEl.innerHTML =
          "<p><strong>" +
          escapeHtml(MotorockCommerceAiRelated.i18n.bulkStarting) +
          "</strong></p>";
      }

      var chain = Promise.resolve();

      targets.forEach(function (target, index) {
        chain = chain.then(function () {
          if (progressEl) {
            progressEl.innerHTML =
              "<p><strong>" +
              escapeHtml(
                MotorockCommerceAiRelated.i18n.bulkProgress
                  .replace("%1$d", String(index + 1))
                  .replace("%2$d", String(targets.length))
              ) +
              "</strong> — " +
              escapeHtml(target.title) +
              " (#" +
              escapeHtml(String(target.productId)) +
              ")</p>";
          }

          return runRelatedRequest(target.productId, locale, dryRun).then(function (result) {
            if (result.ok) {
              succeeded += 1;
              appendBulkLog(
                "#" +
                  escapeHtml(String(target.productId)) +
                  " " +
                  escapeHtml(target.title) +
                  " — " +
                  escapeHtml(
                    dryRun
                      ? MotorockCommerceAiRelated.i18n.bulkItemDryRun
                      : MotorockCommerceAiRelated.i18n.bulkItemOk
                  ) +
                  (result.slugs.length
                    ? ": " + escapeHtml(result.slugs.join(", "))
                    : ""),
                false
              );
            } else {
              failed += 1;
              appendBulkLog(
                "#" +
                  escapeHtml(String(target.productId)) +
                  " " +
                  escapeHtml(target.title) +
                  ": " +
                  escapeHtml(result.error || MotorockCommerceAiRelated.i18n.failed),
                true
              );
            }
          });
        });
      });

      chain
        .then(function () {
          var seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
          if (progressEl) {
            progressEl.innerHTML =
              "<p><strong>" +
              escapeHtml(MotorockCommerceAiRelated.i18n.bulkDone) +
              "</strong> " +
              escapeHtml(
                MotorockCommerceAiRelated.i18n.bulkSummary
                  .replace("%1$d", String(succeeded))
                  .replace("%2$d", String(failed))
              ) +
              " (" +
              escapeHtml(seconds) +
              "s)</p>";
          }
        })
        .catch(function (error) {
          if (progressEl) {
            progressEl.innerHTML =
              "<p class='notice notice-error inline'>" +
              escapeHtml(formatFailureMessage(null, error)) +
              "</p>";
          }
        })
        .finally(function () {
          bulkStartButton.disabled = false;
          if (singleButton) {
            singleButton.disabled = false;
          }
        });
    });
  }
})();
