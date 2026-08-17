(function (window) {
  var LOCK_ID = "motorock-commerce-ai";
  var depth = 0;

  function suspend() {
    depth += 1;
    if (depth > 1) {
      return;
    }

    if (window.wp && wp.heartbeat && typeof wp.heartbeat.suspend === "function") {
      wp.heartbeat.suspend();
    }

    if (
      window.wp &&
      wp.autosave &&
      wp.autosave.server &&
      typeof wp.autosave.server.suspend === "function"
    ) {
      wp.autosave.server.suspend();
    }

    if (window.wp && wp.data && typeof wp.data.dispatch === "function") {
      try {
        wp.data.dispatch("core/editor").lockPostSaving(LOCK_ID);
      } catch (error) {
        // Classic editor or non-block screens.
      }
    }
  }

  function resume() {
    if (depth <= 0) {
      return;
    }

    depth -= 1;
    if (depth > 0) {
      return;
    }

    if (window.wp && wp.heartbeat && typeof wp.heartbeat.unsuspend === "function") {
      wp.heartbeat.unsuspend();
    }

    if (
      window.wp &&
      wp.autosave &&
      wp.autosave.server &&
      typeof wp.autosave.server.unsuspend === "function"
    ) {
      wp.autosave.server.unsuspend();
    }

    if (window.wp && wp.data && typeof wp.data.dispatch === "function") {
      try {
        wp.data.dispatch("core/editor").unlockPostSaving(LOCK_ID);
      } catch (error) {
        // Classic editor or non-block screens.
      }
    }
  }

  window.MotorockAiConnectionGuard = {
    suspend: suspend,
    resume: resume,
    wrap: function wrap(promise) {
      suspend();
      return Promise.resolve(promise).finally(resume);
    },
  };
})(window);
