(function () {
  var button = document.getElementById("motorock-blog-generate");
  var resultEl = document.getElementById("motorock-blog-result");
  var config = window.MotorockCommerceAiBlog || {};
  var i18n = config.i18n || {};

  // Preview panels awaiting "Save as draft" (index → state).
  var previewPanels = [];

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

  function selectedLocaleValue() {
    var checked = document.querySelector('input[name="motorock-blog-locale"]:checked');
    return checked ? checked.value : "en";
  }

  function selectValue(id) {
    var el = document.getElementById(id);
    return el && el.value ? el.value.trim() : "";
  }

  function buildTarget() {
    var target = {};
    var topic = document.getElementById("motorock-blog-topic").value.trim();
    var brief = document.getElementById("motorock-blog-brief").value.trim();
    var productId = Number(document.getElementById("motorock-blog-product-id").value);
    var categorySlug = selectValue("motorock-blog-category");
    var brandSlug = selectValue("motorock-blog-brand");
    var articleType = selectValue("motorock-blog-article-type");

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
    if (brandSlug) {
      target.brandSlug = brandSlug;
    }
    if (articleType) {
      target.articleType = articleType;
    }
    if (selectedLocaleValue() === "both") {
      target.bothLocales = true;
    }

    return target;
  }

  function previewField(result, field) {
    return result.preview && result.preview[field] ? result.preview[field] : "";
  }

  function renderNotices(result) {
    var html = "";

    if (result.warnings && result.warnings.length) {
      html +=
        '<p class="notice notice-warning" style="padding:8px 12px"><strong>Warning:</strong> ' +
        escapeHtml(result.warnings.join(" ")) +
        "</p>";
    }

    if (result.validationErrors && result.validationErrors.length) {
      html += "<p><strong>Validation:</strong> " + escapeHtml(result.validationErrors.join("; ")) + "</p>";
    }

    return html;
  }

  function renderSavedResult(result) {
    var html = "<h2>" + escapeHtml(previewField(result, "title")) + " (" + escapeHtml(result.locale || "") + ")</h2>";
    html += renderNotices(result);

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

  function renderEditablePreview(result, index) {
    var html =
      '<div class="motorock-blog-preview" data-panel-index="' +
      index +
      '" style="border:1px solid #ccd0d4;background:#fff;padding:16px;margin-top:16px">';

    html +=
      '<p style="margin-top:0"><strong>' +
      escapeHtml((result.locale || "").toUpperCase()) +
      "</strong></p>";
    html += renderNotices(result);

    html +=
      '<p><label>Title<br /><input type="text" class="widefat motorock-preview-title" value="' +
      escapeHtml(previewField(result, "title")) +
      '" /></label></p>';

    html +=
      '<p><label>Slug<br /><input type="text" class="regular-text motorock-preview-slug" value="' +
      escapeHtml(previewField(result, "slugSuggestion")) +
      '" /></label></p>';

    html +=
      '<p><label>Excerpt<br /><textarea class="widefat motorock-preview-excerpt" rows="3">' +
      escapeHtml(previewField(result, "excerpt")) +
      "</textarea></label></p>";

    html +=
      '<div class="motorock-preview-content" contenteditable="true" style="max-height:380px;overflow:auto;border:1px solid #dcdcde;padding:12px;background:#fbfbfb">' +
      previewField(result, "contentHtml") +
      "</div>";

    html +=
      '<p style="margin-bottom:0"><button type="button" class="button button-primary motorock-save-draft" data-panel-index="' +
      index +
      '">' +
      escapeHtml(i18n.saveDraft || "Save as draft") +
      '</button> <span class="motorock-save-status"></span></p>';

    html += "</div>";
    return html;
  }

  function collectResults(data) {
    var results = [];
    var primary = data && data.result ? data.result : null;

    if (primary) {
      results.push(primary);
      if (primary.pair) {
        results.push(primary.pair);
      }
    }

    return results;
  }

  function renderAll(data, headline) {
    previewPanels = [];
    var results = collectResults(data);
    var html = "<p>" + escapeHtml(headline) + "</p>";

    results.forEach(function (result, index) {
      if (result.dryRun && result.preview) {
        previewPanels.push({
          locale: result.locale,
          categorySlugs: (result.preview && result.preview.categorySlugs) || [],
          savedPostId: null,
        });
        html += renderEditablePreview(result, previewPanels.length - 1);
      } else {
        if (index > 0) {
          html += "<hr /><p><strong>" + escapeHtml(i18n.secondLocale || "Second language version") + "</strong></p>";
        }
        html += renderSavedResult(result);
      }
    });

    resultEl.innerHTML = html;
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

  function saveDraftFromPanel(panelIndex, panelEl, statusEl, saveButton) {
    var state = previewPanels[panelIndex];
    if (!state) {
      return;
    }

    var payload = {
      locale: state.locale,
      title: panelEl.querySelector(".motorock-preview-title").value.trim(),
      slug: panelEl.querySelector(".motorock-preview-slug").value.trim(),
      excerpt: panelEl.querySelector(".motorock-preview-excerpt").value.trim(),
      contentHtml: panelEl.querySelector(".motorock-preview-content").innerHTML,
      categorySlugs: state.categorySlugs,
      publishStatus: "draft",
    };

    // Link as WPML translation if the other panel is already saved.
    previewPanels.forEach(function (other, otherIndex) {
      if (otherIndex !== panelIndex && other.savedPostId) {
        payload.translationOfPostId = other.savedPostId;
      }
    });

    saveButton.disabled = true;
    statusEl.textContent = i18n.savingDraft || "Saving draft…";

    window.wp
      .apiFetch({
        path: "/motorock/v1/commerce-ai/save-draft",
        method: "POST",
        data: payload,
      })
      .then(function (result) {
        if (result && result.postId) {
          state.savedPostId = result.postId;
          var editUrl =
            result.editUrl ||
            (config.postEditUrl || "").replace("POST_ID", String(result.postId));
          statusEl.innerHTML =
            escapeHtml(i18n.draftSaved || "Draft saved.") +
            ' <a href="' +
            escapeHtml(editUrl) +
            '">' +
            escapeHtml(i18n.openDraft || "Open draft in editor") +
            "</a>";
        } else {
          statusEl.textContent = extractError(null, result);
          saveButton.disabled = false;
        }
      })
      .catch(function (error) {
        statusEl.textContent = (i18n.draftFailed || "Saving draft failed.") + " " + extractError(error);
        saveButton.disabled = false;
      });
  }

  resultEl.addEventListener("click", function (event) {
    var saveButton = event.target.closest(".motorock-save-draft");
    if (!saveButton) {
      return;
    }

    var panelIndex = Number(saveButton.getAttribute("data-panel-index"));
    var panelEl = resultEl.querySelector('.motorock-blog-preview[data-panel-index="' + panelIndex + '"]');
    var statusEl = saveButton.parentElement.querySelector(".motorock-save-status");

    if (panelEl && statusEl) {
      saveDraftFromPanel(panelIndex, panelEl, statusEl, saveButton);
    }
  });

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
    if (!target.topic && !target.brief && !target.productId && !target.categorySlug && !target.brandSlug) {
      showMessage(i18n.needTopic || "Enter a topic, brief, product ID, category, or brand.");
      return;
    }

    var localeValue = selectedLocaleValue();
    var isBoth = localeValue === "both";

    button.disabled = true;
    showMessage(
      isBoth
        ? i18n.runningBoth || "Generating EN + ET articles… this can take 1–3 minutes."
        : i18n.running || "Generating article… this can take 30–90 seconds.",
    );

    runBlogGenerate({
      skill: "content.blog_generate",
      locale: isBoth ? "en" : localeValue,
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
          if (data && data.result) {
            resultEl.innerHTML += renderSavedResult(data.result);
          }
          return;
        }

        var headline = document.getElementById("motorock-blog-dry-run").checked
          ? i18n.dryRunOk || "Dry run complete — preview below."
          : i18n.saved || "Draft post created in WordPress.";

        renderAll(data, headline);
      })
      .catch(function (error) {
        showMessage(extractError(error), true);
      })
      .finally(function () {
        button.disabled = false;
      });
  });
})();
