(function () {
  var button = document.getElementById("motorock-fix-404-run");
  var resultEl = document.getElementById("motorock-fix-404-result");
  var i18n = (window.MotorockCommerceAiFix404 || {}).i18n || {};

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
    var checked = document.querySelector('input[name="motorock-fix-404-locale"]:checked');
    return checked ? checked.value : "en";
  }

  function renderRedirects(data) {
    var result = data && data.result ? data.result : null;
    if (!result) {
      return "";
    }

    var html = "";

    if (result.redirects && result.redirects.length) {
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

      html += "<h3>Vercel redirect format</h3><textarea class='large-text code' rows='8' readonly>";
      result.redirects.forEach(function (entry) {
        html += escapeHtml(entry.from) + " " + escapeHtml(entry.to) + "\n";
      });
      html += "</textarea>";
    } else {
      html += "<p><em>No redirect suggestions.</em></p>";
    }

    if (result.unmatched && result.unmatched.length) {
      html += "<h3>" + escapeHtml(i18n.unmatched || "No match:") + "</h3><ul>";
      result.unmatched.forEach(function (url) {
        html += "<li><code>" + escapeHtml(url) + "</code></li>";
      });
      html += "</ul>";
    }

    return html;
  }

  button.addEventListener("click", function () {
    var urls = document.getElementById("motorock-fix-404-urls").value.trim();
    if (!urls) {
      resultEl.innerHTML = "<p>" + escapeHtml(i18n.needUrls || "Paste URLs.") + "</p>";
      return;
    }

    button.disabled = true;
    resultEl.innerHTML = "<p>" + escapeHtml(i18n.running || "Analyzing…") + "</p>";

    window.MotorockAiStorefront.runCommerceAi({
      skill: "seo.fix_404",
      locale: selectedLocale(),
      target: { urls: urls },
      options: { dryRun: true },
    })
      .then(function (data) {
        var ok = data && (data.ok || (data.result && data.result.ok));
        if (!ok) {
          resultEl.innerHTML = "<p>" + escapeHtml((data && data.error) || i18n.failed) + "</p>";
          return;
        }
        resultEl.innerHTML = "<p>" + escapeHtml(i18n.done || "Done.") + "</p>" + renderRedirects(data);
      })
      .catch(function (error) {
        resultEl.innerHTML = "<p>" + escapeHtml(i18n.failed) + " " + escapeHtml(error.message || "") + "</p>";
      })
      .finally(function () {
        button.disabled = false;
      });
  });
})();
