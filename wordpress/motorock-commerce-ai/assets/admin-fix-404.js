(function () {
  var button = document.getElementById("motorock-fix-404-run");
  var resultEl = document.getElementById("motorock-fix-404-result");
  var i18n = (window.MotorockCommerceAiFix404 || {}).i18n || {};

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
      if (typeof data.message === "string" && data.message) {
        return data.message;
      }
      if (data.result && data.result.warnings && data.result.warnings.length) {
        return data.result.warnings.join("; ");
      }
    }

    if (error && error.data) {
      if (typeof error.data.error === "string" && error.data.error) {
        return error.data.error;
      }
      if (typeof error.data.message === "string" && error.data.message) {
        return error.data.message;
      }
    }

    if (error && error.message) {
      return error.message;
    }

    return i18n.failed || "Analysis failed.";
  }

  function selectedLocale() {
    var checked = document.querySelector('input[name="motorock-fix-404-locale"]:checked');
    return checked ? checked.value : "en";
  }

  function renderRedirects(data) {
    var result = data && data.result ? data.result : data;
    if (!result) {
      return "";
    }

    var html = "";

    if (result.warnings && result.warnings.length) {
      html +=
        '<p class="notice notice-warning" style="padding:8px 12px"><strong>Note:</strong> ' +
        escapeHtml(result.warnings.join(" ")) +
        "</p>";
    }

    if (result.redirects && result.redirects.length) {
      html +=
        "<p><strong>" +
        escapeHtml(String(result.redirects.length)) +
        " redirect(s) suggested</strong> (from " +
        escapeHtml(String(result.inputCount || "?")) +
        " URLs)</p>";

      html +=
        "<table class='widefat striped'><thead><tr><th>From</th><th>To</th><th>Confidence</th><th>Reason</th></tr></thead><tbody>";
      result.redirects.forEach(function (entry) {
        html +=
          "<tr><td><code>" +
          escapeHtml(entry.from) +
          "</code></td><td><code>" +
          escapeHtml(entry.to) +
          "</code></td><td>" +
          escapeHtml(entry.confidence) +
          "</td><td>" +
          escapeHtml(entry.reason || entry.targetTitle || "") +
          "</td></tr>";
      });
      html += "</tbody></table>";

      html += "<h3>Vercel redirect format</h3><textarea class='large-text code' rows='10' readonly>";
      result.redirects.forEach(function (entry) {
        html += escapeHtml(entry.from) + " " + escapeHtml(entry.to) + "\n";
      });
      html += "</textarea>";
    } else {
      html += "<p><em>No redirect suggestions — see unmatched URLs below.</em></p>";
    }

    if (result.unmatched && result.unmatched.length) {
      html +=
        "<h3>" +
        escapeHtml(i18n.unmatched || "No match found for:") +
        " (" +
        escapeHtml(String(result.unmatched.length)) +
        ")</h3><ul style='max-height:240px;overflow:auto'>";
      result.unmatched.forEach(function (url) {
        html += "<li><code>" + escapeHtml(url) + "</code></li>";
      });
      html += "</ul>";
    }

    return html;
  }

  function runFix404(payload) {
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
      new Error("WordPress REST client is unavailable. Hard-refresh this page (Cmd+Shift+R)."),
    );
  }

  button.addEventListener("click", function () {
    var urls = document.getElementById("motorock-fix-404-urls").value.trim();
    if (!urls) {
      showMessage(i18n.needUrls || "Paste at least one broken URL.", true);
      return;
    }

    var lineCount = urls.split(/\r?\n/).filter(function (line) {
      return line.trim().length > 0;
    }).length;

    button.disabled = true;
    showMessage(
      (i18n.running || "Matching broken URLs…") +
        " (" +
        lineCount +
        " URLs — rule-based first, then AI for the rest; can take 1–2 minutes)",
    );

    runFix404({
      skill: "seo.fix_404",
      locale: selectedLocale(),
      target: { urls: urls },
      options: { dryRun: true },
    })
      .then(function (data) {
        var result = data && data.result ? data.result : data;
        var ok = data && (data.ok || (result && result.ok));

        if (!ok && !(result && (result.redirects || result.unmatched))) {
          showMessage(extractError(null, data), true);
          if (result) {
            resultEl.innerHTML += renderRedirects(data);
          }
          return;
        }

        resultEl.innerHTML =
          "<p>" + escapeHtml(i18n.done || "Done.") + "</p>" + renderRedirects(data);
      })
      .catch(function (error) {
        showMessage(extractError(error), true);
      })
      .finally(function () {
        button.disabled = false;
      });
  });
})();
