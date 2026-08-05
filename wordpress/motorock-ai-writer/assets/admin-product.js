(function () {
  if (typeof MotorockAiAdmin === "undefined") {
    return;
  }

  var button = document.getElementById("motorock-ai-generate");
  var publishButton = document.getElementById("motorock-ai-publish");
  var resultEl = document.getElementById("motorock-ai-result");
  if (!button || !resultEl) {
    return;
  }

  function checkedValues(name) {
    return Array.prototype.slice
      .call(document.querySelectorAll('input[name="' + name + '"]:checked'))
      .map(function (input) {
        return input.value;
      });
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderPreview(data) {
    if (!data || !data.jobs) {
      if (data && data.results) {
        return renderJobPreview(data);
      }
      return "";
    }

    return data.jobs
      .map(function (job) {
        if (!job.ok && job.error) {
          return (
            "<p><strong>" +
            escapeHtml(job.locale || "") +
            "</strong>: " +
            escapeHtml(job.error) +
            "</p>"
          );
        }
        return renderJobPreview(job);
      })
      .join("");
  }

  function renderJobPreview(job) {
    if (!job || !job.results) {
      return "";
    }

    var html =
      "<p><strong>" +
      escapeHtml(job.locale || "") +
      "</strong> (" +
      escapeHtml(job.jobId || "") +
      ")</p><ul>";

    job.results.forEach(function (result) {
      html +=
        "<li>" +
        escapeHtml(result.section) +
        ": " +
        escapeHtml(result.status) +
        (result.message ? " — " + escapeHtml(result.message) : "");

      if (result.validationErrors && result.validationErrors.length) {
        html +=
          "<br /><small>" +
          escapeHtml(result.validationErrors.join("; ")) +
          "</small>";
      }

      if (result.preview) {
        if (result.preview.section === "description") {
          html +=
            "<br /><em>" +
            escapeHtml((result.preview.shortDescription || "").slice(0, 160)) +
            "…</em>";
        } else if (result.preview.section === "seo") {
          html +=
            "<br /><em>" +
            escapeHtml(result.preview.title || "") +
            "</em>";
        } else if (result.preview.section === "faq") {
          html +=
            "<br /><em>" +
            escapeHtml((result.preview.items[0]?.question || "").slice(0, 120)) +
            "…</em>";
        } else if (result.preview.section === "alt_text") {
          html +=
            "<br /><em>" +
            escapeHtml((result.preview.items[0]?.altText || "").slice(0, 120)) +
            "…</em>";
        }
      }

      html += "</li>";
    });

    html += "</ul>";
    return html;
  }

  button.addEventListener("click", function () {
    var locales = checkedValues("motorock_ai_locale");
    var sections = checkedValues("motorock_ai_section");
    var dryRun = document.getElementById("motorock-ai-dry-run").checked;
    var overwrite = document.getElementById("motorock-ai-overwrite").value;
    var providerEl = document.getElementById("motorock-ai-provider");
    var provider = providerEl ? providerEl.value : "";
    var publishStatus = document.getElementById("motorock-ai-publish-status").value;

    if (!locales.length || !sections.length) {
      resultEl.innerHTML = "<p>" + escapeHtml(MotorockAiAdmin.i18n.pickSections) + "</p>";
      return;
    }

    button.disabled = true;
    resultEl.innerHTML = "<p>" + escapeHtml(MotorockAiAdmin.i18n.running) + "</p>";

    window.wp.apiFetch({
      url: MotorockAiAdmin.restUrl,
      method: "POST",
      headers: {
        "X-WP-Nonce": MotorockAiAdmin.nonce,
      },
      data: {
        productId: MotorockAiAdmin.productId,
        locales: locales,
        sections: sections,
        dryRun: dryRun,
        overwrite: overwrite,
        publishStatus: publishStatus,
        provider: provider,
      },
    })
      .then(function (data) {
        var ok = data && (data.ok || data.succeeded > 0);
        var headline = dryRun
          ? MotorockAiAdmin.i18n.dryRunOk
          : ok
            ? publishStatus === "draft"
              ? MotorockAiAdmin.i18n.savedDraft
              : MotorockAiAdmin.i18n.saved
            : MotorockAiAdmin.i18n.failed;

        resultEl.innerHTML =
          "<p><strong>" +
          escapeHtml(headline) +
          "</strong></p>" +
          renderPreview(data);

        if (!dryRun && publishStatus === "draft" && ok) {
          window.location.reload();
        }
      })
      .catch(function (error) {
        var message =
          (error && error.message) ||
          MotorockAiAdmin.i18n.failed;
        if (error && error.code === "motorock_ai_api_not_configured") {
          message = MotorockAiAdmin.i18n.notConfigured;
        }
        resultEl.innerHTML = "<p>" + escapeHtml(message) + "</p>";
      })
      .finally(function () {
        button.disabled = false;
      });
  });

  if (publishButton) {
    publishButton.addEventListener("click", function () {
      var draftLocales =
        MotorockAiAdmin.draftLocales && MotorockAiAdmin.draftLocales.length
          ? MotorockAiAdmin.draftLocales
          : checkedValues("motorock_ai_locale");
      if (!draftLocales.length) {
        draftLocales = ["en", "et"];
      }

      publishButton.disabled = true;
      resultEl.innerHTML =
        "<p>" +
        escapeHtml(
          draftLocales.length > 1
            ? MotorockAiAdmin.i18n.publishingAll
            : MotorockAiAdmin.i18n.publishing,
        ) +
        "</p>";

      window.wp.apiFetch({
        url: MotorockAiAdmin.publishUrl,
        method: "POST",
        headers: {
          "X-WP-Nonce": MotorockAiAdmin.nonce,
        },
        data: {
          productId: MotorockAiAdmin.productId,
          locales: draftLocales,
        },
      })
        .then(function (data) {
          if (data && data.ok) {
            resultEl.innerHTML =
              "<p><strong>" + escapeHtml(MotorockAiAdmin.i18n.published) + "</strong></p>";
            window.location.reload();
            return;
          }

          resultEl.innerHTML = "<p>" + escapeHtml(MotorockAiAdmin.i18n.failed) + "</p>";
        })
        .catch(function (error) {
          resultEl.innerHTML =
            "<p>" + escapeHtml((error && error.message) || MotorockAiAdmin.i18n.failed) + "</p>";
        })
        .finally(function () {
          publishButton.disabled = false;
        });
    });
  }
})();
