(function () {
  if (typeof MotorockCommerceAiBlog === "undefined") {
    return;
  }

  var button = document.getElementById("motorock-blog-generate");
  var resultEl = document.getElementById("motorock-blog-result");
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
    var checked = document.querySelector('input[name="motorock-blog-locale"]:checked');
    return checked ? checked.value : "en";
  }

  function buildTarget() {
    var target = {};
    var topic = document.getElementById("motorock-blog-topic").value.trim();
    var brief = document.getElementById("motorock-blog-brief").value.trim();
    var productId = Number(document.getElementById("motorock-blog-product-id").value);

    if (topic) {
      target.topic = topic;
    }
    if (brief) {
      target.brief = brief;
    }
    if (Number.isInteger(productId) && productId > 0) {
      target.productId = productId;
    }

    return target;
  }

  function renderResult(data) {
    if (!data || !data.result) {
      return "<p>" + escapeHtml(MotorockCommerceAiBlog.i18n.failed) + "</p>";
    }

    var result = data.result;
    var html = "<h2>" + escapeHtml(result.preview?.title || "") + "</h2>";

    if (result.validationErrors && result.validationErrors.length) {
      html += "<p><strong>Validation:</strong> " + escapeHtml(result.validationErrors.join("; ")) + "</p>";
    }

    if (result.preview?.excerpt) {
      html += "<p><em>" + escapeHtml(result.preview.excerpt) + "</em></p>";
    }

    if (result.preview?.contentHtml) {
      html +=
        '<div style="max-height:320px;overflow:auto;border:1px solid #ccd0d4;padding:12px;background:#fff">' +
        result.preview.contentHtml +
        "</div>";
    }

    if (result.postId) {
      html += "<p>Post ID: " + escapeHtml(String(result.postId)) + " · slug: " + escapeHtml(result.slug || "") + "</p>";
    }

    return html;
  }

  button.addEventListener("click", function () {
    var target = buildTarget();
    if (!target.topic && !target.brief && !target.productId) {
      resultEl.innerHTML = "<p>" + escapeHtml(MotorockCommerceAiBlog.i18n.needTopic) + "</p>";
      return;
    }

    button.disabled = true;
    resultEl.innerHTML = "<p>" + escapeHtml(MotorockCommerceAiBlog.i18n.running) + "</p>";

    window.wp.apiFetch({
      url: MotorockCommerceAiBlog.restUrl,
      method: "POST",
      headers: {
        "X-WP-Nonce": MotorockCommerceAiBlog.nonce,
      },
      data: {
        skill: "content.blog_generate",
        locale: selectedLocale(),
        target: target,
        options: {
          dryRun: document.getElementById("motorock-blog-dry-run").checked,
          publishStatus: "draft",
        },
      },
    })
      .then(function (data) {
        var ok = data && (data.ok || (data.result && data.result.ok));
        resultEl.innerHTML =
          "<p>" +
          escapeHtml(
            ok
              ? document.getElementById("motorock-blog-dry-run").checked
                ? MotorockCommerceAiBlog.i18n.dryRunOk
                : MotorockCommerceAiBlog.i18n.saved
              : MotorockCommerceAiBlog.i18n.failed
          ) +
          "</p>" +
          renderResult(data);
      })
      .catch(function (error) {
        resultEl.innerHTML =
          "<p>" +
          escapeHtml(MotorockCommerceAiBlog.i18n.failed) +
          " " +
          escapeHtml(error.message || "") +
          "</p>";
      })
      .finally(function () {
        button.disabled = false;
      });
  });
})();
