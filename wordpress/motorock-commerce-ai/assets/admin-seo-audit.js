(function () {
  if (typeof MotorockCommerceAiSeoAudit === "undefined") {
    return;
  }

  var runButton = document.getElementById("motorock-seo-audit-run");
  var summaryEl = document.getElementById("motorock-seo-audit-summary");
  var resultsEl = document.getElementById("motorock-seo-audit-results");

  if (!runButton || !summaryEl || !resultsEl) {
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
    var checked = document.querySelector('input[name="motorock-seo-audit-locale"]:checked');
    return checked ? checked.value : "en";
  }

  function sectionsFromFindings(findings) {
    var codes = (findings || []).map(function (finding) {
      return finding.code;
    });
    var sections = [];

    if (codes.some(function (code) { return code.indexOf("description") === 0; })) {
      sections.push("description");
    }
    if (codes.some(function (code) { return code.indexOf("seo") === 0; })) {
      sections.push("seo");
    }
    if (codes.indexOf("faq.missing") !== -1) {
      sections.push("faq");
    }
    if (codes.indexOf("alt_text.gap") !== -1) {
      sections.push("alt_text");
    }

    return sections.length ? sections : ["description", "seo"];
  }

  function productEditUrl(productId) {
    return (MotorockCommerceAiSeoAudit.productEditUrl || "").replace(
      "PRODUCT_ID",
      String(productId),
    );
  }

  function renderSummary(report) {
    var summary = report.summary || {};
    return (
      '<div class="motorock-seo-audit-summary-grid">' +
      '<div class="motorock-seo-audit-summary-card"><strong>' +
      escapeHtml(String(summary.scanned || 0)) +
      "</strong>" +
      escapeHtml(MotorockCommerceAiSeoAudit.i18n.scanned) +
      "</div>" +
      '<div class="motorock-seo-audit-summary-card"><strong>' +
      escapeHtml(String(summary.errors || 0)) +
      "</strong>" +
      escapeHtml(MotorockCommerceAiSeoAudit.i18n.errors) +
      "</div>" +
      '<div class="motorock-seo-audit-summary-card"><strong>' +
      escapeHtml(String(summary.warnings || 0)) +
      "</strong>" +
      escapeHtml(MotorockCommerceAiSeoAudit.i18n.warnings) +
      "</div>" +
      '<div class="motorock-seo-audit-summary-card"><strong>' +
      escapeHtml(String(summary.avgScore || 0)) +
      "</strong>" +
      escapeHtml(MotorockCommerceAiSeoAudit.i18n.avgScore) +
      "</div>" +
      "</div>"
    );
  }

  function renderActionCell(item) {
    if (item.entityType !== "product" || !item.databaseId) {
      return "—";
    }

    var editUrl = productEditUrl(item.databaseId);
    var html = "";

    if (item.score > 0) {
      var sections = sectionsFromFindings(item.findings);
      html +=
        '<button type="button" class="button button-secondary motorock-seo-audit-fix-btn" ' +
        'data-product-id="' +
        escapeHtml(String(item.databaseId)) +
        '" data-sections="' +
        escapeHtml(sections.join(",")) +
        '">' +
        escapeHtml(MotorockCommerceAiSeoAudit.i18n.fixWithAi) +
        "</button> ";
    }

    if (editUrl) {
      html +=
        '<a class="button-link" href="' +
        escapeHtml(editUrl) +
        '">' +
        escapeHtml(MotorockCommerceAiSeoAudit.i18n.openProduct) +
        "</a>";
    }

    html += '<div class="motorock-seo-audit-fix-status" aria-live="polite"></div>';

    return html;
  }

  function renderItems(items) {
    if (!items || !items.length) {
      return "<p>" + escapeHtml(MotorockCommerceAiSeoAudit.i18n.noIssues) + "</p>";
    }

    var html =
      '<table class="widefat striped motorock-seo-audit-table"><thead><tr>' +
      "<th>Score</th><th>Type</th><th>Title</th><th>Slug</th><th>Findings</th><th>Actions</th>" +
      "</tr></thead><tbody>";

    items.slice(0, 100).forEach(function (item) {
      var findings = (item.findings || [])
        .map(function (finding) {
          return (
            '<span class="severity-' +
            escapeHtml(finding.severity) +
            '" title="' +
            escapeHtml(finding.message || finding.code) +
            '">' +
            escapeHtml(finding.code) +
            "</span>"
          );
        })
        .join(", ");

      html +=
        "<tr>" +
        '<td class="motorock-seo-audit-score">' +
        escapeHtml(String(item.score)) +
        "</td>" +
        "<td>" +
        escapeHtml(item.entityType) +
        "</td>" +
        "<td>" +
        escapeHtml(item.title) +
        "</td>" +
        "<td>" +
        escapeHtml(item.slug) +
        "</td>" +
        "<td>" +
        findings +
        "</td>" +
        '<td class="motorock-seo-audit-actions">' +
        renderActionCell(item) +
        "</td>" +
        "</tr>";
    });

    html += "</tbody></table>";

    if (items.length > 100) {
      html +=
        "<p>" +
        escapeHtml(MotorockCommerceAiSeoAudit.i18n.showingTop100.replace("%d", String(items.length))) +
        "</p>";
    }

    return html;
  }

  function runAudit() {
    runButton.disabled = true;
    summaryEl.innerHTML = "<p>" + escapeHtml(MotorockCommerceAiSeoAudit.i18n.running) + "</p>";
    resultsEl.innerHTML = "";

    var category = document.getElementById("motorock-seo-audit-category").value.trim();
    var target = {
      scope: document.getElementById("motorock-seo-audit-scope").value,
      limit: Number(document.getElementById("motorock-seo-audit-limit").value) || 200,
    };

    if (category) {
      target.category = category;
    }

    return window.wp.apiFetch({
      url: MotorockCommerceAiSeoAudit.restUrl,
      method: "POST",
      headers: {
        "X-WP-Nonce": MotorockCommerceAiSeoAudit.nonce,
      },
      data: {
        skill: "seo.audit",
        locale: selectedLocale(),
        target: target,
        options: { dryRun: true },
      },
    });
  }

  function fixProductWithAi(button) {
    var productId = Number(button.getAttribute("data-product-id"));
    var sections = (button.getAttribute("data-sections") || "description,seo")
      .split(",")
      .filter(Boolean);
    var statusEl = button.parentElement.querySelector(".motorock-seo-audit-fix-status");

    if (!productId || !sections.length) {
      return;
    }

    button.disabled = true;
    if (statusEl) {
      statusEl.textContent = MotorockCommerceAiSeoAudit.i18n.fixRunning;
      statusEl.className = "motorock-seo-audit-fix-status is-running";
    }

    window.wp
      .apiFetch({
        url: MotorockCommerceAiSeoAudit.restUrl,
        method: "POST",
        headers: {
          "X-WP-Nonce": MotorockCommerceAiSeoAudit.nonce,
        },
        data: {
          skill: "product.content_writer",
          locale: selectedLocale(),
          target: { productId: productId },
          options: {
            dryRun: false,
            publishStatus: "draft",
            sections: sections,
          },
        },
      })
      .then(function (data) {
        var inner = data && data.result ? data.result : data;
        var ok = Boolean(
          (data && data.ok) ||
            (inner && inner.ok) ||
            (inner && inner.results && inner.results.some(function (result) {
              return result.status === "written" || result.status === "skipped";
            })),
        );

        if (!ok) {
          var errorMessage =
            (data && data.error) ||
            (inner && inner.error) ||
            MotorockCommerceAiSeoAudit.i18n.fixFailed;
          if (statusEl) {
            statusEl.textContent = errorMessage;
            statusEl.className = "motorock-seo-audit-fix-status is-error";
          }
          button.disabled = false;
          return;
        }

        if (statusEl) {
          statusEl.textContent = MotorockCommerceAiSeoAudit.i18n.fixDone;
          statusEl.className = "motorock-seo-audit-fix-status is-success";
        }

        button.textContent = MotorockCommerceAiSeoAudit.i18n.fixDone;
      })
      .catch(function (error) {
        if (statusEl) {
          statusEl.textContent =
            MotorockCommerceAiSeoAudit.i18n.fixFailed + " " + (error.message || "");
          statusEl.className = "motorock-seo-audit-fix-status is-error";
        }
        button.disabled = false;
      });
  }

  runButton.addEventListener("click", function () {
    runAudit()
      .then(function (data) {
        if (data && data.error) {
          summaryEl.innerHTML =
            "<p>" +
            escapeHtml(MotorockCommerceAiSeoAudit.i18n.failed) +
            " " +
            escapeHtml(data.error) +
            "</p>";
          return;
        }

        var report = data && data.result ? data.result : null;
        if (!report) {
          summaryEl.innerHTML = "<p>" + escapeHtml(MotorockCommerceAiSeoAudit.i18n.failed) + "</p>";
          return;
        }

        summaryEl.innerHTML =
          "<p>" + escapeHtml(MotorockCommerceAiSeoAudit.i18n.done) + "</p>" + renderSummary(report);
        resultsEl.innerHTML = renderItems(report.items || []);
      })
      .catch(function (error) {
        summaryEl.innerHTML =
          "<p>" +
          escapeHtml(MotorockCommerceAiSeoAudit.i18n.failed) +
          " " +
          escapeHtml(error.message || "") +
          "</p>";
      })
      .finally(function () {
        runButton.disabled = false;
      });
  });

  resultsEl.addEventListener("click", function (event) {
    var target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    var button = target.closest(".motorock-seo-audit-fix-btn");
    if (button instanceof HTMLButtonElement) {
      fixProductWithAi(button);
    }
  });
})();
