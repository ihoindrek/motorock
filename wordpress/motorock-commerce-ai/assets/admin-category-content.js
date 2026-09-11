(function () {
  var generateButton = document.getElementById("motorock-cat-content-generate");
  var saveButton = document.getElementById("motorock-cat-content-save");
  var resultEl = document.getElementById("motorock-cat-content-result");
  var config = window.MotorockCommerceAiCategoryContent || {};
  var i18n = config.i18n || {};
  var lastPreview = null;

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  if (!generateButton || !saveButton || !resultEl) {
    return;
  }

  if (!window.MotorockAiStorefront) {
    var storefrontConfig = window.MotorockAiStorefrontConfig || {};
    var storefrontI18n = storefrontConfig.i18n || {};
    var setupError =
      storefrontI18n.notConfigured ||
      "Commerce AI scripts did not load. Hard-refresh this page (Cmd+Shift+R).";

    generateButton.addEventListener("click", function () {
      resultEl.innerHTML = "<p>" + escapeHtml(setupError) + "</p>";
    });

    return;
  }

  function selectedLocale() {
    var checked = document.querySelector('input[name="motorock-cat-content-locale"]:checked');
    return checked ? checked.value : "en";
  }

  function collectEntries(result) {
    if (!result) {
      return [];
    }

    var entries = [result];
    if (result.pair) {
      entries.push(result.pair);
    }

    return entries.filter(function (entry) {
      return entry && entry.descriptionHtml;
    });
  }

  function renderResult(data) {
    var result = data && data.result ? data.result : null;
    if (!result) {
      return "<p>" + escapeHtml(i18n.failed || "Generation failed.") + "</p>";
    }

    var html = "";
    collectEntries(result).forEach(function (entry) {
      html += "<h2>" + escapeHtml(entry.categoryName || entry.categorySlug || "") + " (" + escapeHtml(entry.locale || "") + ")</h2>";
      if (entry.warnings && entry.warnings.length) {
        html += '<p class="notice notice-warning" style="padding:8px 12px">' + escapeHtml(entry.warnings.join(" ")) + "</p>";
      }
      if (entry.validationErrors && entry.validationErrors.length) {
        html += "<p><strong>Validation:</strong> " + escapeHtml(entry.validationErrors.join("; ")) + "</p>";
      }
      if (entry.seoTitle) {
        html += "<p><strong>SEO title:</strong> " + escapeHtml(entry.seoTitle) + "</p>";
      }
      if (entry.metaDescription) {
        html += "<p><strong>Meta description:</strong> " + escapeHtml(entry.metaDescription) + "</p>";
      }
      if (entry.descriptionHtml) {
        html += '<div style="border:1px solid #ccd0d4;padding:12px;background:#fff;max-width:720px">' + entry.descriptionHtml + "</div>";
      }
      if (entry.termId) {
        html += "<p>Term ID: " + escapeHtml(String(entry.termId)) + "</p>";
      }
    });

    return html;
  }

  function setSaveEnabled(enabled) {
    saveButton.disabled = !enabled;
  }

  function savePreview() {
    if (!lastPreview || !lastPreview.entries.length) {
      resultEl.innerHTML = "<p>" + escapeHtml(i18n.needPreview || "Generate a preview first.") + "</p>";
      return;
    }

    if (!window.wp || !window.wp.apiFetch) {
      resultEl.innerHTML =
        "<p>" + escapeHtml("WordPress REST client is unavailable. Hard-refresh this page.") + "</p>" +
        renderResult({ result: lastPreview.result });
      return;
    }

    saveButton.disabled = true;
    generateButton.disabled = true;
    resultEl.innerHTML =
      "<p>" + escapeHtml(i18n.saving || "Saving…") + "</p>" + renderResult({ result: lastPreview.result });

    window.wp
      .apiFetch({
        path: "/motorock/v1/commerce-ai/save-category-content",
        method: "POST",
        data: {
          categorySlug: lastPreview.categorySlug,
          entries: lastPreview.entries.map(function (entry) {
            return {
              locale: entry.locale,
              descriptionHtml: entry.descriptionHtml,
              seoTitle: entry.seoTitle || "",
              metaDescription: entry.metaDescription || "",
            };
          }),
        },
      })
      .then(function (response) {
        if (!response || !response.ok) {
          throw new Error((response && response.message) || i18n.saveFailed || "Saving failed.");
        }

        resultEl.innerHTML =
          "<p>" + escapeHtml(i18n.saved || "Category SEO content saved in WooCommerce.") + "</p>" +
          renderResult({ result: lastPreview.result });
        setSaveEnabled(false);
      })
      .catch(function (error) {
        resultEl.innerHTML =
          "<p>" +
          escapeHtml(i18n.saveFailed || "Saving failed.") +
          " " +
          escapeHtml(error.message || "") +
          "</p>" +
          renderResult({ result: lastPreview.result });
        setSaveEnabled(true);
      })
      .finally(function () {
        generateButton.disabled = false;
      });
  }

  generateButton.addEventListener("click", function () {
    var categorySlug = document.getElementById("motorock-cat-content-category").value.trim();
    if (!categorySlug) {
      resultEl.innerHTML = "<p>" + escapeHtml(i18n.needCategory || "Select a category.") + "</p>";
      lastPreview = null;
      setSaveEnabled(false);
      return;
    }

    var localeValue = selectedLocale();
    generateButton.disabled = true;
    saveButton.disabled = true;
    lastPreview = null;
    resultEl.innerHTML = "<p>" + escapeHtml(i18n.running || "Generating…") + "</p>";

    window.MotorockAiStorefront.runCommerceAi({
      skill: "seo.category_content",
      locale: localeValue === "both" ? "en" : localeValue,
      target: {
        categorySlug: categorySlug,
        bothLocales: localeValue === "both",
      },
      options: {
        dryRun: true,
      },
    })
      .then(function (data) {
        var ok = data && (data.ok || (data.result && data.result.ok));
        if (!ok) {
          resultEl.innerHTML = "<p>" + escapeHtml((data && data.error) || i18n.failed) + "</p>" + renderResult(data);
          setSaveEnabled(false);
          return;
        }

        var entries = collectEntries(data.result);
        lastPreview = {
          categorySlug: categorySlug,
          result: data.result,
          entries: entries,
        };

        resultEl.innerHTML =
          "<p>" + escapeHtml(i18n.previewReady || "Preview below — click Save when you are happy with the text.") + "</p>" +
          renderResult(data);
        setSaveEnabled(entries.length > 0);
      })
      .catch(function (error) {
        resultEl.innerHTML = "<p>" + escapeHtml(i18n.failed) + " " + escapeHtml(error.message || "") + "</p>";
        setSaveEnabled(false);
      })
      .finally(function () {
        generateButton.disabled = false;
      });
  });

  saveButton.addEventListener("click", savePreview);
})();
