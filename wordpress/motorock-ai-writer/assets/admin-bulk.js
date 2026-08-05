(function () {
  if (typeof MotorockAiBulk === "undefined") {
    return;
  }

  var startButton = document.getElementById("motorock-ai-bulk-start");
  var progressEl = document.getElementById("motorock-ai-bulk-progress");
  var logEl = document.getElementById("motorock-ai-bulk-log");
  var selectAll = document.getElementById("motorock-ai-bulk-select-all");

  if (!startButton || !progressEl || !logEl) {
    return;
  }

  function checkedValues(name) {
    return Array.prototype.slice
      .call(document.querySelectorAll('input[name="' + name + '"]:checked'))
      .map(function (input) {
        return input.value;
      });
  }

  function selectedProductIds() {
    return Array.prototype.slice
      .call(document.querySelectorAll(".motorock-ai-bulk-product:checked"))
      .map(function (input) {
        return parseInt(input.value, 10);
      })
      .filter(function (id) {
        return id > 0;
      });
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function chunkArray(items, size) {
    var chunks = [];
    for (var i = 0; i < items.length; i += size) {
      chunks.push(items.slice(i, i + size));
    }
    return chunks;
  }

  function formatDuration(ms) {
    return (ms / 1000).toFixed(1) + "s";
  }

  function renderJobSummary(job) {
    if (!job) {
      return "";
    }

    if (!job.ok && job.error) {
      return (
        "<li class='motorock-ai-bulk-log-item motorock-ai-bulk-log-item--error'>" +
        "#" +
        escapeHtml(job.productId) +
        " " +
        escapeHtml(job.locale || "") +
        ": " +
        escapeHtml(job.error) +
        "</li>"
      );
    }

    var sections = (job.results || [])
      .map(function (result) {
        return escapeHtml(result.section) + ":" + escapeHtml(result.status);
      })
      .join(", ");

    return (
      "<li class='motorock-ai-bulk-log-item'>" +
      "#" +
      escapeHtml(job.productId) +
      " " +
      escapeHtml(job.locale || "") +
      " — " +
      sections +
      "</li>"
    );
  }

  if (selectAll) {
    selectAll.addEventListener("change", function () {
      var checked = selectAll.checked;
      Array.prototype.slice
        .call(document.querySelectorAll(".motorock-ai-bulk-product"))
        .forEach(function (input) {
          input.checked = checked;
        });
    });
  }

  startButton.addEventListener("click", function () {
    var productIds = selectedProductIds();
    var locales = checkedValues("motorock_ai_bulk_locale");
    var sections = checkedValues("motorock_ai_bulk_section");
    var dryRun = document.getElementById("motorock-ai-bulk-dry-run").checked;
    var overwrite = document.getElementById("motorock-ai-bulk-overwrite").value;
    var chunkSize = MotorockAiBulk.chunkSize || 2;

    if (!productIds.length) {
      progressEl.innerHTML =
        "<p class='notice notice-warning inline'>" +
        escapeHtml(MotorockAiBulk.i18n.pickProducts) +
        "</p>";
      return;
    }

    if (!locales.length || !sections.length) {
      progressEl.innerHTML =
        "<p class='notice notice-warning inline'>" +
        escapeHtml(MotorockAiBulk.i18n.pickSections) +
        "</p>";
      return;
    }

    var chunks = chunkArray(productIds, chunkSize);
    var totalSucceeded = 0;
    var totalFailed = 0;
    var startedAt = Date.now();

    startButton.disabled = true;
    progressEl.innerHTML = "<p><strong>" + escapeHtml(MotorockAiBulk.i18n.starting) + "</strong></p>";
    logEl.innerHTML = "<ul class='motorock-ai-bulk-log-list'></ul>";
    var logList = logEl.querySelector(".motorock-ai-bulk-log-list");

    function runChunk(index) {
      if (index >= chunks.length) {
        progressEl.innerHTML =
          "<p><strong>" +
          escapeHtml(MotorockAiBulk.i18n.done) +
          "</strong> " +
          escapeHtml(MotorockAiBulk.i18n.succeeded) +
          ": " +
          totalSucceeded +
          ", " +
          escapeHtml(MotorockAiBulk.i18n.failedCount) +
          ": " +
          totalFailed +
          " (" +
          formatDuration(Date.now() - startedAt) +
          ")</p>";
        startButton.disabled = false;
        return;
      }

      var ids = chunks[index];
      progressEl.innerHTML =
        "<p><strong>" +
        escapeHtml(MotorockAiBulk.i18n.chunk) +
        " " +
        (index + 1) +
        "/" +
        chunks.length +
        "</strong> [" +
        escapeHtml(ids.join(", ")) +
        "]</p>";

      window.wp
        .apiFetch({
          url: MotorockAiBulk.restBatchUrl,
          method: "POST",
          headers: {
            "X-WP-Nonce": MotorockAiBulk.nonce,
          },
          data: {
            productIds: ids,
            locales: locales,
            sections: sections,
            dryRun: dryRun,
            overwrite: overwrite,
            publishStatus: "draft",
          },
        })
        .then(function (data) {
          totalSucceeded += data && typeof data.succeeded === "number" ? data.succeeded : 0;
          totalFailed += data && typeof data.failed === "number" ? data.failed : 0;

          (data && data.jobs ? data.jobs : []).forEach(function (job) {
            logList.insertAdjacentHTML("beforeend", renderJobSummary(job));
          });

          if (data && data.error) {
            logList.insertAdjacentHTML(
              "beforeend",
              "<li class='motorock-ai-bulk-log-item motorock-ai-bulk-log-item--error'>" +
                escapeHtml(data.error) +
                "</li>",
            );
          }

          runChunk(index + 1);
        })
        .catch(function (error) {
          var message =
            (error && error.message) || MotorockAiBulk.i18n.failed;
          if (error && error.code === "motorock_ai_api_not_configured") {
            message = MotorockAiBulk.i18n.notConfigured;
          }

          logList.insertAdjacentHTML(
            "beforeend",
            "<li class='motorock-ai-bulk-log-item motorock-ai-bulk-log-item--error'>" +
              escapeHtml(message) +
              "</li>",
          );
          progressEl.innerHTML =
            "<p class='notice notice-error inline'>" + escapeHtml(message) + "</p>";
          startButton.disabled = false;
        });
    }

    runChunk(0);
  });
})();
