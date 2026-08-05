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

  function renderSummary(report) {
    var summary = report.summary || {};
    return (
      '<div class="motorock-seo-audit-summary-grid">' +
      '<div class="motorock-seo-audit-summary-card"><strong>' +
      escapeHtml(String(summary.scanned || 0)) +
      '</strong>Scanned</div>' +
      '<div class="motorock-seo-audit-summary-card"><strong>' +
      escapeHtml(String(summary.errors || 0)) +
      '</strong>Errors</div>' +
      '<div class="motorock-seo-audit-summary-card"><strong>' +
      escapeHtml(String(summary.warnings || 0)) +
      '</strong>Warnings</div>' +
      '<div class="motorock-seo-audit-summary-card"><strong>' +
      escapeHtml(String(summary.avgScore || 0)) +
      '</strong>Avg score</div>' +
      "</div>"
    );
  }

  function renderItems(items) {
    if (!items || !items.length) {
      return "<p>No issues found in scanned items.</p>";
    }

    var html =
      '<table class="widefat striped motorock-seo-audit-table"><thead><tr>' +
      "<th>Score</th><th>Type</th><th>Title</th><th>Slug</th><th>Findings</th>" +
      "</tr></thead><tbody>";

    items.slice(0, 100).forEach(function (item) {
      var findings = (item.findings || [])
        .map(function (finding) {
          return (
            '<span class="severity-' +
            escapeHtml(finding.severity) +
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
        "</tr>";
    });

    html += "</tbody></table>";

    if (items.length > 100) {
      html += "<p>Showing top 100 of " + escapeHtml(String(items.length)) + " items.</p>";
    }

    return html;
  }

  runButton.addEventListener("click", function () {
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

    window.wp.apiFetch({
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
    })
      .then(function (data) {
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
})();
