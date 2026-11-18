(function () {
  "use strict";

  const tabs = Array.from(document.querySelectorAll("[role='tab']"));
  const panels = {
    about: document.getElementById("panel-about"),
    links: document.getElementById("panel-links")
  };
  const DEFAULT_TAB = "about";

  let activeTab = DEFAULT_TAB;

  function showTab(name, options) {
    const opts = options || {};
    const id = panels[name] ? name : DEFAULT_TAB;

    if (id === activeTab && !opts.force) {
      syncHash(id);
      return;
    }

    activeTab = id;

    tabs.forEach(function (tab) {
      const isActive = tab.dataset.tab === id;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", String(isActive));
      tab.tabIndex = isActive ? 0 : -1;
    });

    Object.keys(panels).forEach(function (key) {
      const panel = panels[key];
      if (!panel) return;
      const isActive = key === id;
      panel.hidden = !isActive;
      panel.classList.toggle("is-active", isActive);
      if (isActive) {
        // перезапускаем анимацию появления
        panel.style.animation = "none";
        void panel.offsetWidth;
        panel.style.animation = "";
      }
    });

    syncHash(id);
  }

  function syncHash(id) {
    const next = "#" + id;
    if (window.location.hash !== next) {
      history.replaceState(null, "", next);
    }
  }

  function tabFromHash() {
    const hash = window.location.hash.replace("#", "").toLowerCase();
    return panels[hash] ? hash : DEFAULT_TAB;
  }

  // Клики по вкладкам
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      showTab(tab.dataset.tab);
    });
  });

  // Клики по любым элементам с data-tab-link (кнопки, логотип)
  document.querySelectorAll("[data-tab-link]").forEach(function (el) {
    el.addEventListener("click", function (event) {
      event.preventDefault();
      showTab(el.dataset.tabLink);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  // Управление стрелками с клавиатуры
  document.querySelector(".tabs").addEventListener("keydown", function (event) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

    const index = tabs.findIndex(function (tab) {
      return tab.dataset.tab === activeTab;
    });
    if (index === -1) return;

    const step = event.key === "ArrowRight" ? 1 : -1;
    const next = tabs[(index + step + tabs.length) % tabs.length];

    showTab(next.dataset.tab);
    next.focus();
    event.preventDefault();
  });

  // Переключение кнопками «назад/вперёд» в браузере
  window.addEventListener("hashchange", function () {
    showTab(tabFromHash());
  });

  // Стартовое состояние: берём вкладку из адресной строки
  showTab(tabFromHash(), { force: true });

  // Актуальный год в подвале
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
