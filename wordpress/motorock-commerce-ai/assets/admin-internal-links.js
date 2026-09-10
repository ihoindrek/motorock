(function () {
  var button = document.getElementById("motorock-internal-links-run");
  var resultEl = document.getElementById("motorock-internal-links-result");
  var i18n = (window.MotorockCommerceAiInternalLinks || {}).i18n || {};

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
    var checked = document.querySelector('input[name="motorock-internal-links-locale"]:checked');
    return checked ? checked.value : "en";
  }

  function renderSuggestions(data) {
    var result = data && data.result ? data.result : null;
    if (!result || !result.posts || !result.posts.length) {
      return "<p>No suggestions.</p>";
    }

    var html = "";
    result.posts.forEach(function (post) {
      html += "<h2>" + escapeHtml(post.postTitle) + " <code>" + escapeHtml(post.postSlug) + "</code></h2>";
      if (post.skippedReason) {
        html += "<p><em>" + escapeHtml(post.skippedReason) + "</em></p>";
        return;
      }
      if (!post.suggestions || !post.suggestions.length) {
        html += "<p><em>No link opportunities found.</em></p>";
        return;
      }
      html += "<table class='widefat striped'><thead><tr><th>Anchor text</th><th>URL</th><th>Reason</th></tr></thead><tbody>";
      post.suggestions.forEach(function (suggestion) {
        html +=
          "<tr><td>" +
          escapeHtml(suggestion.anchorText) +
          "</td><td><code>" +
          escapeHtml(suggestion.url) +
          "</code></td><td>" +
          escapeHtml(suggestion.reason || "") +
          "</td></tr>";
      });
      html += "</tbody></table>";
    });

    return html;
  }

  button.addEventListener("click", function () {
    var postSlug = document.getElementById("motorock-internal-links-slug").value.trim();
    var limit = Number(document.getElementById("motorock-internal-links-limit").value) || 5;

    button.disabled = true;
    resultEl.innerHTML = "<p>" + escapeHtml(i18n.running || "Analyzing…") + "</p>";

    var target = { limit: limit };
    if (postSlug) {
      target.postSlug = postSlug;
    }

    window.MotorockAiStorefront.runCommerceAi({
      skill: "seo.internal_links",
      locale: selectedLocale(),
      target: target,
      options: { dryRun: true },
    })
      .then(function (data) {
        var ok = data && (data.ok || (data.result && data.result.ok));
        if (!ok) {
          resultEl.innerHTML = "<p>" + escapeHtml((data && data.error) || i18n.failed) + "</p>";
          return;
        }
        resultEl.innerHTML = "<p>" + escapeHtml(i18n.done || "Done.") + "</p>" + renderSuggestions(data);
      })
      .catch(function (error) {
        resultEl.innerHTML = "<p>" + escapeHtml(i18n.failed) + " " + escapeHtml(error.message || "") + "</p>";
      })
      .finally(function () {
        button.disabled = false;
      });
  });
})();
