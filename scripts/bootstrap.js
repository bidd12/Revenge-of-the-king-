/* Startup diagnostics must not depend on game modules or game CSS. */
(() => {
  "use strict";
  const overlay = document.getElementById("bootScreen");
  const status = document.getElementById("bootStatus");
  const progress = document.getElementById("bootProgress");
  const details = document.getElementById("bootDetails");
  const retry = document.getElementById("bootRetry");
  const app = document.getElementById("app");
  const TIMEOUT = 12000;
  const THREE_URL = "vendor/three.min.js";
  let running = false;
  let importStarted = false;
  let resolveThree;
  window.threeReadyPromise = new Promise(resolve => { resolveThree = resolve; });

  function step(value, message) {
    progress.value = value;
    status.textContent = message;
  }

  async function verify(path, expectedType) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT);
    try {
      const response = await fetch(path, { cache: "no-store", signal: controller.signal });
      if (!response.ok) throw new Error(path + " — HTTP " + response.status);
      const type = response.headers.get("content-type") || "";
      if (!expectedType.test(type)) throw new Error(path + " — сервер вернул неверный тип: " + type);
      // Consume the response so stalled bodies also hit the deadline.
      await response.text();
    } catch (error) {
      if (error.name === "AbortError") throw new Error(path + " — превышено время ожидания (12 секунд)");
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  function loadScript(url) {
    return new Promise(resolve => {
      const script = document.createElement("script");
      let finished = false;
      const finish = ok => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        script.onload = script.onerror = null;
        if (!ok) script.remove();
        resolve(ok);
      };
      const timer = setTimeout(() => finish(false), TIMEOUT);
      script.src = url;
      script.crossOrigin = "anonymous";
      script.onload = () => finish(Boolean(window.THREE));
      script.onerror = () => finish(false);
      document.head.appendChild(script);
    });
  }

  async function start() {
    if (running) return;
    running = true;
    retry.hidden = true;
    details.textContent = "";
    app.hidden = true;
    app.inert = true;
    overlay.hidden = false;
    step(0, "Проверяем файлы игры…");
    try {
      if (location.protocol === "file:") throw new Error("Откройте игру через HTTP-сервер: python launcher.py. ES-модули не запускаются через file://.");
      const results = await Promise.allSettled([
        verify("css/style-v3.css?v=4", /text\/css/i),
        verify("js/main.js?v=4", /(javascript|ecmascript)/i),
        verify("js/scene.js", /(javascript|ecmascript)/i),
        verify("js/models.js", /(javascript|ecmascript)/i),
        verify("js/item-visuals.js", /(javascript|ecmascript)/i)
      ]);
      const failures = results.filter(r => r.status === "rejected").map(r => r.reason.message);
      if (failures.length) throw new Error(failures.join("\n"));
      step(1, "Файлы найдены. Загружаем оформление…");
      await new Promise((resolve, reject) => {
        const css = document.createElement("link");
        const timer = setTimeout(() => { css.remove(); reject(new Error("css/style-v3.css — превышено время загрузки")); }, TIMEOUT);
        css.rel = "stylesheet";
        css.href = "css/style-v3.css?v=4";
        css.onload = () => { clearTimeout(timer); resolve(); };
        css.onerror = () => { clearTimeout(timer); css.remove(); reject(new Error("css/style-v3.css — ошибка загрузки")); };
        document.head.appendChild(css);
      });
      step(2, "Подключаем 3D-библиотеку…");
      const hasThree = Boolean(window.THREE) || await loadScript(THREE_URL);
      resolveThree(hasThree);
      if (!hasThree) console.warn("Three.js недоступен: запускается предусмотренный проектом режим без 3D.");
      step(3, "Запускаем игровые модули…");
      // Import once per page: retry after a failed/partial evaluation must reload.
      importStarted = true;
      let timer;
      try {
        await Promise.race([
          import("../js/main.js?v=4"),
          new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("js/main.js — запуск не завершён за 12 секунд")), TIMEOUT); })
        ]);
      } finally {
        clearTimeout(timer);
      }
      const {createPlatform} = await import("../js/platform.js");
      const platform = createPlatform();
      step(3, "Подключаем платформу…");
      await platform.init();
      window.game.platform = platform;
      step(4, "Игровые модули загружены");
      app.hidden = false;
      app.inert = false;
      overlay.hidden = true;
      platform.ready();
      if(window.game.scene.constructor.name==="FallbackScene") window.game.ui.toast("3D недоступно. Бой работает в упрощённом режиме.");
      window.dispatchEvent(new CustomEvent("game-bootstrap-loaded", { detail: { hasThree } }));
    } catch (error) {
      app.hidden = true;
      app.inert = true;
      overlay.hidden = false;
      console.error("[startup]", error);
      status.textContent = "Не удалось загрузить игру";
      details.textContent = error.message + "\n\nПроверьте соединение и повторите загрузку. Если указана ошибка HTTP 404, в сборке отсутствует файл: разработчикам нужно добавить полные папки css/ и js/.";
      retry.hidden = false;
      retry.focus();
    } finally {
      running = false;
    }
  }
  retry.addEventListener("click", () => importStarted ? location.reload() : start());
  start();
})();
