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

  function showProgress(percent, label, busy) {
    var safePercent = Math.max(0, Math.min(100, percent));
    var trackClass = "motorock-seo-audit-progress-track" + (busy ? " is-busy" : "");
    var barStyle = busy ? "" : ' style="width:' + safePercent + '%"';
    var ariaValueNow = busy ? "0" : String(safePercent);

    summaryEl.innerHTML =
      '<div class="' +
      trackClass +
      '" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' +
      ariaValueNow +
      '"' +
      (busy ? ' aria-busy="true"' : "") +
      ">" +
      '<div class="motorock-seo-audit-progress-bar"' +
      barStyle +
      "></div></div>" +
      '<p class="motorock-seo-audit-progress-label">' +
      escapeHtml(label) +
      "</p>";
  }

  function findDuplicateGroups(items, pickValue) {
    var groups = {};

    items.forEach(function (item) {
      var value = (pickValue(item) || "").trim().toLowerCase();
      if (!value) {
        return;
      }
      if (!groups[value]) {
        groups[value] = [];
      }
      groups[value].push(item.databaseId);
    });

    return Object.keys(groups)
      .filter(function (key) {
        return groups[key].length > 1;
      })
      .map(function (key) {
        return { value: key, databaseIds: groups[key] };
      });
  }

  function mergeAuditReport(allItems, scope, locale) {
    var items = allItems.slice().sort(function (a, b) {
      return b.score - a.score || a.title.localeCompare(b.title);
    });

    var byCode = {};
    var errors = 0;
    var warnings = 0;

    items.forEach(function (item) {
      (item.findings || []).forEach(function (finding) {
        byCode[finding.code] = (byCode[finding.code] || 0) + 1;
        if (finding.severity === "error") {
          errors += 1;
        } else if (finding.severity === "warning") {
          warnings += 1;
        }
      });
    });

    var productItems = items.filter(function (item) {
      return item.entityType === "product";
    });
    var postItems = items.filter(function (item) {
      return item.entityType === "post";
    });

    return {
      ok: true,
      locale: locale,
      scope: scope,
      dryRun: true,
      summary: {
        scanned: items.length,
        products: productItems.length,
        posts: postItems.length,
        errors: errors,
        warnings: warnings,
        avgScore:
          items.length > 0
            ? Math.round(
                (items.reduce(function (sum, item) {
                  return sum + item.score;
                }, 0) /
                  items.length) *
                  10,
              ) / 10
            : 0,
        byCode: byCode,
      },
      duplicates: {
        titles: findDuplicateGroups(items, function (item) {
          return item.title;
        }),
        seoTitles: findDuplicateGroups(productItems, function (item) {
          return item.seoTitle;
        }),
      },
      items: items,
    };
  }

  function progressLabel(phase, scanned, totalExpected, fetching) {
    var phaseLabel =
      phase === "posts"
        ? MotorockCommerceAiSeoAudit.i18n.progressPosts
        : MotorockCommerceAiSeoAudit.i18n.progressProducts;

    if (fetching) {
      return (
        phaseLabel +
        " — " +
        MotorockCommerceAiSeoAudit.i18n.progressFetching
          .replace("%1$d", String(scanned))
          .replace("%2$d", String(totalExpected))
      );
    }

    return (
      phaseLabel +
      " — " +
      MotorockCommerceAiSeoAudit.i18n.progressCount
        .replace("%1$d", String(scanned))
        .replace("%2$d", String(totalExpected))
    );
  }

  function fetchAuditChunk(target) {
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

  function runAudit() {
    runButton.disabled = true;
    resultsEl.innerHTML = "";

    var category = document.getElementById("motorock-seo-audit-category").value.trim();
    var scope = document.getElementById("motorock-seo-audit-scope").value;
    var limit = Number(document.getElementById("motorock-seo-audit-limit").value) || 200;
    var chunkSize = Number(MotorockCommerceAiSeoAudit.chunkSize) || 20;
    var phases = [];

    if (scope === "all" || scope === "products") {
      phases.push("products");
    }
    if (scope === "all" || scope === "posts") {
      phases.push("posts");
    }

    var perPhaseLimit = scope === "all" ? Math.ceil(limit / 2) : limit;
    var totalExpected = perPhaseLimit * phases.length;
    var allItems = [];
    var scanned = 0;

    showProgress(0, MotorockCommerceAiSeoAudit.i18n.running, true);

    var chain = Promise.resolve();

    phases.forEach(function (phase) {
      chain = chain.then(function () {
        var phaseScanned = 0;

        function nextChunk() {
          if (phaseScanned >= perPhaseLimit) {
            return Promise.resolve();
          }

          var chunkLimit = Math.min(chunkSize, perPhaseLimit - phaseScanned);
          var percent =
            totalExpected > 0 ? Math.min(99, (scanned / totalExpected) * 100) : 0;

          showProgress(percent, progressLabel(phase, scanned, totalExpected, true), true);

          var target = {
            scope: phase,
            limit: perPhaseLimit,
            offset: phaseScanned,
            chunkSize: chunkLimit,
          };

          if (category) {
            target.category = category;
          }

          return fetchAuditChunk(target).then(function (data) {
            if (data && data.ok === false) {
              throw new Error(data.error || MotorockCommerceAiSeoAudit.i18n.failed);
            }

            if (data && data.error) {
              throw new Error(data.error);
            }

            var report = data && data.result ? data.result : null;
            if (!report) {
              throw new Error(MotorockCommerceAiSeoAudit.i18n.failed);
            }

            var chunkItems = report.items || [];
            allItems = allItems.concat(chunkItems);
            scanned += chunkItems.length;
            phaseScanned += chunkItems.length;

            showProgress(
              totalExpected > 0 ? Math.min(99, (scanned / totalExpected) * 100) : 0,
              progressLabel(phase, scanned, totalExpected, false),
              false,
            );

            if (report.pagination && report.pagination.hasMore && chunkItems.length > 0) {
              return nextChunk();
            }

            if (!report.pagination && chunkItems.length === chunkLimit && phaseScanned < perPhaseLimit) {
              return nextChunk();
            }
          });
        }

        return nextChunk();
      });
    });

    return chain.then(function () {
      showProgress(100, MotorockCommerceAiSeoAudit.i18n.finalizing, false);
      return mergeAuditReport(allItems, scope, selectedLocale());
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
      .then(function (report) {
        summaryEl.innerHTML =
          '<p class="motorock-seo-audit-done">' +
          escapeHtml(MotorockCommerceAiSeoAudit.i18n.done) +
          "</p>" +
          renderSummary(report);
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
