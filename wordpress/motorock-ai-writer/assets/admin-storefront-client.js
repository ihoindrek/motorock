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

  function normalizeOptions(source) {
    if (!source || typeof source !== "object") {
      return undefined;
    }

    var options = source.options && typeof source.options === "object" ? source.options : source;
    var normalized = {};

    if (typeof options.dryRun === "boolean") {
      normalized.dryRun = options.dryRun;
    }
    if (typeof options.revalidate === "boolean") {
      normalized.revalidate = options.revalidate;
    }
    if (options.overwrite) {
      normalized.overwrite = options.overwrite;
    }
    if (options.publishStatus) {
      normalized.publishStatus = options.publishStatus;
    }
    if (options.provider) {
      normalized.provider = options.provider;
    }

    return Object.keys(normalized).length ? normalized : undefined;
  }

  function normalizeBatchPayload(payload) {
    var body = {
      productIds: (payload.productIds || []).map(function (id) {
        return Number(id);
      }),
      locales: payload.locales || [],
      sections: payload.sections || [],
    };

    var options = normalizeOptions(payload);
    if (options) {
      body.options = options;
    }

    return body;
  }

  window.MotorockAiStorefront = {
    generateProductContent: function generateProductContent(payload) {
      var locales = payload.locales || [];
      var options = normalizeOptions(payload) || {};

      if (locales.length > 1) {
        return storefrontFetch(
          "/api/ai/batch",
          normalizeBatchPayload({
            productIds: [payload.productId],
            locales: locales,
            sections: payload.sections,
            options: options,
          }),
        );
      }

      return storefrontFetch("/api/ai/generate", {
        productId: Number(payload.productId),
        locale: locales[0] || "en",
        sections: payload.sections,
        options: options,
      });
    },

    batchProductContent: function batchProductContent(payload) {
      return storefrontFetch("/api/ai/batch", normalizeBatchPayload(payload));
    },

    runCommerceAi: function runCommerceAi(payload) {
      return storefrontFetch("/api/commerce-ai/run", payload);
    },

    runCommerceAiBatch: function runCommerceAiBatch(payload) {
      return storefrontFetch("/api/commerce-ai/batch", payload);
    },
  };
})(window);
