(function (window) {
  function config() {
    return window.MotorockAiStorefrontConfig || {};
  }

  function apiBase() {
    var base = String(config().apiUrl || "").replace(/\/$/, "");
    return base || "https://motorock.eu";
  }

  function apiSecret() {
    return String(config().apiSecret || "");
  }

  function storefrontFetch(path, body) {
    if (!apiSecret()) {
      return Promise.reject(new Error(config().i18n?.notConfigured || "AI API not configured"));
    }

    return fetch(apiBase() + path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + apiSecret(),
      },
      body: JSON.stringify(body),
      credentials: "omit",
    }).then(function (response) {
      return response
        .json()
        .catch(function () {
          return {};
        })
        .then(function (data) {
          if (!response.ok) {
            var error = new Error(
              (data && data.error) || config().i18n?.failed || "Generation failed",
            );
            if (data && data.code) {
              error.code = data.code;
            }
            throw error;
          }

          return data;
        });
    });
  }

  window.MotorockAiStorefront = {
    generateProductContent: function generateProductContent(payload) {
      var locales = payload.locales || [];
      var options = {
        dryRun: Boolean(payload.dryRun),
        overwrite: payload.overwrite,
        publishStatus: payload.publishStatus,
      };

      if (payload.provider) {
        options.provider = payload.provider;
      }

      if (locales.length > 1) {
        return storefrontFetch("/api/ai/batch", {
          productIds: [payload.productId],
          locales: locales,
          sections: payload.sections,
          options: options,
        });
      }

      return storefrontFetch("/api/ai/generate", {
        productId: payload.productId,
        locale: locales[0] || "en",
        sections: payload.sections,
        options: options,
      });
    },

    batchProductContent: function batchProductContent(payload) {
      return storefrontFetch("/api/ai/batch", payload);
    },

    runCommerceAi: function runCommerceAi(payload) {
      return storefrontFetch("/api/commerce-ai/run", payload);
    },

    runCommerceAiBatch: function runCommerceAiBatch(payload) {
      return storefrontFetch("/api/commerce-ai/batch", payload);
    },
  };
})(window);
