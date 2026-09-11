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

  if (!window.wp || !window.wp.apiFetch) {
    var setupError =
      "WordPress REST client did not load. Hard-refresh this page (Cmd+Shift+R).";

    generateButton.addEventListener("click", function () {
      resultEl.innerHTML = "<p>" + escapeHtml(setupError) + "</p>";
    });

    return;
  }

  function selectedLocale() {
    var checked = document.querySelector('input[name="motorock-cat-content-locale"]:checked');
    return checked ? checked.value : "en";
  }

  function selectedCategoryMeta() {
    var select = document.getElementById("motorock-cat-content-category");
    if (!select) {
      return null;
    }

    var option = select.options[select.selectedIndex];
    if (!option || !option.value) {
      return null;
    }

    return {
      categorySlug: option.value,
      categoryName: option.getAttribute("data-name") || option.text.replace(/\s*\(\d+\)\s*$/, "").trim(),
      productCount: Number(option.getAttribute("data-count") || "0"),
    };
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

  function formatFailure(data, fallback) {
    if (data && data.result && data.result.validationErrors && data.result.validationErrors.length) {
      return data.result.validationErrors.join("; ");
    }

    if (data && data.error) {
      return data.error;
    }

    return fallback || i18n.failed || "Generation failed.";
  }

  function renderResult(data) {
    var result = data && data.result ? data.result : null;
    if (!result) {
      return "";
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
    var category = selectedCategoryMeta();
    if (!category) {
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

    window.wp
      .apiFetch({
        path: "/motorock/v1/commerce-ai/run",
        method: "POST",
        data: {
          skill: "seo.category_content",
          locale: localeValue === "both" ? "en" : localeValue,
          target: {
            categorySlug: category.categorySlug,
            categoryName: category.categoryName,
            productCount: category.productCount,
            bothLocales: localeValue === "both",
          },
          options: {
            dryRun: true,
          },
        },
      })
      .then(function (data) {
        var ok = data && (data.ok || (data.result && data.result.ok));
        if (!ok) {
          resultEl.innerHTML =
            "<p>" + escapeHtml(formatFailure(data, i18n.failed)) + "</p>" + renderResult(data);
          setSaveEnabled(false);
          return;
        }

        var entries = collectEntries(data.result);
        lastPreview = {
          categorySlug: category.categorySlug,
          result: data.result,
          entries: entries,
        };

        resultEl.innerHTML =
          "<p>" + escapeHtml(i18n.previewReady || "Preview below — click Save when you are happy with the text.") + "</p>" +
          renderResult(data);
        setSaveEnabled(entries.length > 0);
      })
      .catch(function (error) {
        resultEl.innerHTML =
          "<p>" + escapeHtml(formatFailure(error && error.data, error.message || i18n.failed)) + "</p>";
        setSaveEnabled(false);
      })
      .finally(function () {
        generateButton.disabled = false;
      });
  });

  saveButton.addEventListener("click", savePreview);
})();
