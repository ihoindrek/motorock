(function () {
  var button = document.getElementById("motorock-blog-generate");
  var resultEl = document.getElementById("motorock-blog-result");
  var config = window.MotorockCommerceAiBlog || {};
  var i18n = config.i18n || {};

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function showMessage(message, isError) {
    if (!resultEl) {
      return;
    }

    resultEl.innerHTML =
      '<p class="' +
      (isError ? "notice notice-error" : "notice notice-info") +
      '" style="padding:8px 12px">' +
      escapeHtml(message) +
      "</p>";
  }

  if (!button || !resultEl) {
    return;
  }

  function extractError(error, data) {
    if (data) {
      if (typeof data.error === "string" && data.error) {
        return data.error;
      }

      if (data.code && typeof data.code === "string") {
        if (data.result && data.result.validationErrors && data.result.validationErrors.length) {
          return data.code + ": " + data.result.validationErrors.join("; ");
        }
      }

      if (data.result && data.result.validationErrors && data.result.validationErrors.length) {
        return data.result.validationErrors.join("; ");
      }

      if (typeof data.message === "string" && data.message) {
        return data.message;
      }
    }

    if (error && error.data) {
      if (typeof error.data.error === "string" && error.data.error) {
        return error.data.error;
      }

      if (typeof error.data.message === "string" && error.data.message) {
        return error.data.message;
      }

      if (error.data.result && error.data.result.validationErrors && error.data.result.validationErrors.length) {
        return error.data.result.validationErrors.join("; ");
      }
    }

    if (error && error.message) {
      return error.message;
    }

    if (error && error.code) {
      return String(error.code);
    }

    return i18n.failed || "Generation failed.";
  }

  function selectedLocale() {
    var checked = document.querySelector('input[name="motorock-blog-locale"]:checked');
    return checked ? checked.value : "en";
  }

  function buildTarget() {
    var target = {};
    var topic = document.getElementById("motorock-blog-topic").value.trim();
    var brief = document.getElementById("motorock-blog-brief").value.trim();
    var productId = Number(document.getElementById("motorock-blog-product-id").value);
    var categoryEl = document.getElementById("motorock-blog-category");
    var categorySlug = categoryEl ? categoryEl.value.trim() : "";

    if (topic) {
      target.topic = topic;
    }
    if (brief) {
      target.brief = brief;
    }
    if (Number.isInteger(productId) && productId > 0) {
      target.productId = productId;
    }
    if (categorySlug) {
      target.categorySlug = categorySlug;
    }

    return target;
  }

  function previewField(result, field) {
    return result.preview && result.preview[field] ? result.preview[field] : "";
  }

  function renderResult(data) {
    if (!data || !data.result) {
      return "";
    }

    var result = data.result;
    var html = "<h2>" + escapeHtml(previewField(result, "title")) + "</h2>";

    if (result.warnings && result.warnings.length) {
      html +=
        '<p class="notice notice-warning" style="padding:8px 12px"><strong>Warning:</strong> ' +
        escapeHtml(result.warnings.join(" ")) +
        "</p>";
    }

    if (result.validationErrors && result.validationErrors.length) {
      html += "<p><strong>Validation:</strong> " + escapeHtml(result.validationErrors.join("; ")) + "</p>";
    }

    if (previewField(result, "excerpt")) {
      html += "<p><em>" + escapeHtml(previewField(result, "excerpt")) + "</em></p>";
    }

    if (previewField(result, "contentHtml")) {
      html +=
        '<div style="max-height:320px;overflow:auto;border:1px solid #ccd0d4;padding:12px;background:#fff">' +
        previewField(result, "contentHtml") +
        "</div>";
    }

    if (result.postId) {
      html +=
        "<p>Post ID: " +
        escapeHtml(String(result.postId)) +
        " · slug: " +
        escapeHtml(result.slug || "") +
        "</p>";

      var editUrl =
        result.editUrl ||
        (config.postEditUrl || "").replace("POST_ID", String(result.postId));

      if (editUrl) {
        html +=
          '<p><a class="button button-primary" href="' +
          escapeHtml(editUrl) +
          '">' +
          escapeHtml(i18n.openDraft || "Open draft in editor") +
          "</a></p>";
      }
    }

    return html;
  }

  function runBlogGenerate(payload) {
    if (window.wp && window.wp.apiFetch) {
      return window.wp.apiFetch({
        path: "/motorock/v1/commerce-ai/run",
        method: "POST",
        data: payload,
      });
    }

    if (window.MotorockAiStorefront && window.MotorockAiStorefront.runCommerceAi) {
      return window.MotorockAiStorefront.runCommerceAi(payload);
    }

    return Promise.reject(
      new Error("WordPress REST client is unavailable. Hard-refresh this page."),
    );
  }

  function checkHealth() {
    if (!window.wp || !window.wp.apiFetch) {
      return;
    }

    window.wp
      .apiFetch({ path: "/motorock/v1/commerce-ai/health" })
      .then(function (health) {
        if (health && health.ok) {
          return;
        }

        showMessage(
          "Storefront connection failed: " +
            extractError(null, health) +
            (health && health.storefrontUrl ? " (" + health.storefrontUrl + ")" : ""),
          true,
        );
      })
      .catch(function (error) {
        showMessage("Storefront connection failed: " + extractError(error), true);
      });
  }

  checkHealth();

  button.addEventListener("click", function () {
    var target = buildTarget();
    if (!target.topic && !target.brief && !target.productId) {
      showMessage(i18n.needTopic || "Enter a topic, brief, or product ID.");
      return;
    }

    button.disabled = true;
    showMessage(i18n.running || "Generating article… this can take 30–90 seconds.");

    runBlogGenerate({
      skill: "content.blog_generate",
      locale: selectedLocale(),
      target: target,
      options: {
        dryRun: document.getElementById("motorock-blog-dry-run").checked,
        publishStatus: "draft",
      },
    })
      .then(function (data) {
        var ok = data && (data.ok || (data.result && data.result.ok));

        if (!ok) {
          showMessage(extractError(null, data), true);
          resultEl.innerHTML += renderResult(data);
          return;
        }

        var headline = document.getElementById("motorock-blog-dry-run").checked
          ? i18n.dryRunOk || "Dry run complete — preview below."
          : i18n.saved || "Draft post created in WordPress.";

        resultEl.innerHTML = "<p>" + escapeHtml(headline) + "</p>" + renderResult(data);
      })
      .catch(function (error) {
        showMessage(extractError(error), true);
      })
      .finally(function () {
        button.disabled = false;
      });
  });
})();
