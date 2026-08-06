(function () {
  if (typeof MotorockCommerceAiRelated === "undefined") {
    return;
  }

  var button = document.getElementById("motorock-related-generate");
  var resultEl = document.getElementById("motorock-related-result");
  if (!button || !resultEl) {
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
    var checked = document.querySelector('input[name="motorock-related-locale"]:checked');
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

  function renderResult(data) {
    if (!data || !data.result) {
      return "<p>" + escapeHtml(MotorockCommerceAiRelated.i18n.failed) + "</p>";
    }

    var result = data.result;
    var html = "";

    if (result.validationErrors && result.validationErrors.length) {
      html +=
        "<p><strong>Validation:</strong> " +
        escapeHtml(result.validationErrors.join("; ")) +
        "</p>";
    }

    var slugs = result.relatedSlugs || result.preview?.relatedSlugs || [];
    if (slugs.length) {
      html +=
        "<p><strong>" +
        escapeHtml(MotorockCommerceAiRelated.i18n.relatedSlugs) +
        ":</strong> " +
        escapeHtml(slugs.join(", ")) +
        "</p>";
    }

    if (result.preview?.items?.length) {
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

  button.addEventListener("click", function () {
    var productId = Number(document.getElementById("motorock-related-product-id").value);
    if (!Number.isInteger(productId) || productId <= 0) {
      resultEl.innerHTML =
        "<p>" + escapeHtml(MotorockCommerceAiRelated.i18n.needProduct) + "</p>";
      return;
    }

    button.disabled = true;
    resultEl.innerHTML =
      "<p>" + escapeHtml(MotorockCommerceAiRelated.i18n.running) + "</p>";

    window.wp.apiFetch({
      url: MotorockCommerceAiRelated.restUrl,
      method: "POST",
      headers: {
        "X-WP-Nonce": MotorockCommerceAiRelated.nonce,
      },
      data: {
        skill: "catalog.related_products",
        locale: selectedLocale(),
        target: {
          productId: productId,
        },
        options: {
          dryRun: document.getElementById("motorock-related-dry-run").checked,
        },
      },
    })
      .then(function (data) {
        var ok = data && (data.ok || (data.result && data.result.ok));
        resultEl.innerHTML =
          "<p>" +
          escapeHtml(
            ok
              ? document.getElementById("motorock-related-dry-run").checked
                ? MotorockCommerceAiRelated.i18n.dryRunOk
                : MotorockCommerceAiRelated.i18n.saved
              : formatFailureMessage(data)
          ) +
          "</p>" +
          renderResult(data);
      })
      .catch(function (error) {
        resultEl.innerHTML =
          "<p>" +
          escapeHtml(formatFailureMessage(null, error)) +
          "</p>";
      })
      .finally(function () {
        button.disabled = false;
      });
  });
})();
