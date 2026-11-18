(function () {
  "use strict";

  const tabs = Array.from(document.querySelectorAll("[role='tab']"));
  const panels = {
    about: document.getElementById("panel-about"),
    links: document.getElementById("panel-links"),
    app: document.getElementById("panel-app")
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

  // ---------- Релизы приложения: подтягиваем с GitHub ----------
  const RELEASES_API = "https://api.github.com/repos/reidis-new/OrangeBeat/releases?per_page=10";
  const releaseListEl = document.getElementById("release-list");
  const releaseNoteEl = document.getElementById("releases-note");
  const versionEl = document.getElementById("app-version");
  const sizeEl = document.getElementById("app-size");
  const downloadEl = document.getElementById("app-download");

  function formatSize(bytes) {
    if (!bytes) return "";
    return (bytes / 1048576).toFixed(1).replace(".", ",") + " МБ";
  }

  function formatDate(iso) {
    const date = new Date(iso);
    if (isNaN(date)) return "";
    return date.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  }

  function versionOf(release) {
    const source = (release.tag_name || "") + " " + (release.name || "");
    const match = source.match(/\d+(?:\.\d+)+/);
    return match ? match[0] : (release.tag_name || "");
  }

  function apkOf(release) {
    const assets = Array.isArray(release.assets) ? release.assets : [];
    const apk = assets.find(function (a) { return /\.apk$/i.test(a.name); });
    return apk || assets[0] || null;
  }

  function buildReleaseItem(release) {
    const apk = apkOf(release);

    const item = document.createElement("li");
    item.className = "release-item";

    const badge = document.createElement("span");
    badge.className = "release-badge";
    badge.textContent = versionOf(release);

    const main = document.createElement("span");
    main.className = "release-main";

    const name = document.createElement("span");
    name.className = "release-name";
    name.textContent = release.name || release.tag_name || "Релиз";

    const meta = document.createElement("span");
    meta.className = "release-meta";
    meta.textContent = [formatDate(release.published_at), apk ? formatSize(apk.size) : ""]
      .filter(Boolean)
      .join(" · ");

    main.append(name, meta);
    item.append(badge, main);

    if (apk) {
      const link = document.createElement("a");
      link.className = "release-link";
      link.href = apk.browser_download_url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Скачать";
      item.append(link);
    }

    return item;
  }

  function renderReleases(releases) {
    const published = releases
      .filter(function (r) { return r && !r.draft && !r.prerelease && apkOf(r); })
      .slice(0, 6);

    if (!published.length) return;

    if (releaseListEl) {
      releaseListEl.replaceChildren.apply(releaseListEl, published.map(buildReleaseItem));
    }

    const latest = published[0];
    const apk = apkOf(latest);
    if (versionEl) versionEl.textContent = "v" + versionOf(latest);
    if (sizeEl && apk) sizeEl.textContent = formatSize(apk.size);
    if (downloadEl && apk) downloadEl.href = apk.browser_download_url;
  }

  if (releaseListEl) {
    fetch(RELEASES_API, { headers: { Accept: "application/vnd.github+json" } })
      .then(function (response) {
        return response.ok ? response.json() : Promise.reject(new Error(String(response.status)));
      })
      .then(function (data) {
        if (Array.isArray(data)) renderReleases(data);
      })
      .catch(function () {
        // остаёмся на статичном списке, показываем пояснение
        if (releaseNoteEl) releaseNoteEl.hidden = false;
      });
  }
})();
