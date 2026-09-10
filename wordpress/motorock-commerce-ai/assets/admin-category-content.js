(function () {
  var button = document.getElementById("motorock-cat-content-generate");
  var resultEl = document.getElementById("motorock-cat-content-result");
  var config = window.MotorockCommerceAiCategoryContent || {};
  var i18n = config.i18n || {};

  if (!button || !resultEl || !window.MotorockAiStorefront) {
    return;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function selectedLocale() {
    var checked = document.querySelector('input[name="motorock-cat-content-locale"]:checked');
    return checked ? checked.value : "en";
  }

  function renderResult(data) {
    var result = data && data.result ? data.result : null;
    if (!result) {
      return "<p>" + escapeHtml(i18n.failed || "Generation failed.") + "</p>";
    }

    var html = "";
    var entries = [result];
    if (result.pair) {
      entries.push(result.pair);
    }

    entries.forEach(function (entry) {
      html += "<h2>" + escapeHtml(entry.categoryName || entry.categorySlug || "") + " (" + escapeHtml(entry.locale || "") + ")</h2>";
      if (entry.warnings && entry.warnings.length) {
        html += '<p class="notice notice-warning" style="padding:8px 12px">' + escapeHtml(entry.warnings.join(" ")) + "</p>";
      }
      if (entry.validationErrors && entry.validationErrors.length) {
        html += "<p><strong>Validation:</strong> " + escapeHtml(entry.validationErrors.join("; ")) + "</p>";
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

  button.addEventListener("click", function () {
    var categorySlug = document.getElementById("motorock-cat-content-category").value.trim();
    if (!categorySlug) {
      resultEl.innerHTML = "<p>" + escapeHtml(i18n.needCategory || "Select a category.") + "</p>";
      return;
    }

    var localeValue = selectedLocale();
    button.disabled = true;
    resultEl.innerHTML = "<p>" + escapeHtml(i18n.running || "Generating…") + "</p>";

    window.MotorockAiStorefront.runCommerceAi({
      skill: "seo.category_content",
      locale: localeValue === "both" ? "en" : localeValue,
      target: {
        categorySlug: categorySlug,
        bothLocales: localeValue === "both",
      },
      options: {
        dryRun: document.getElementById("motorock-cat-content-dry-run").checked,
      },
    })
      .then(function (data) {
        var ok = data && (data.ok || (data.result && data.result.ok));
        if (!ok) {
          resultEl.innerHTML = "<p>" + escapeHtml((data && data.error) || i18n.failed) + "</p>" + renderResult(data);
          return;
        }
        var headline = document.getElementById("motorock-cat-content-dry-run").checked
          ? i18n.dryRunOk
          : i18n.saved;
        resultEl.innerHTML = "<p>" + escapeHtml(headline) + "</p>" + renderResult(data);
      })
      .catch(function (error) {
        resultEl.innerHTML = "<p>" + escapeHtml(i18n.failed) + " " + escapeHtml(error.message || "") + "</p>";
      })
      .finally(function () {
        button.disabled = false;
      });
  });
})();
