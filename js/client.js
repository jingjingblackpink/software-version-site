/* =========================================================
   client.js —— 客户端页面逻辑（只读）
   ---------------------------------------------------------
   同名项目自动归拢为一张"版本卡片"：
   · 卡片标题：项目名称 + 版本数 + 最新版本 + 屏幕版本 + 最新时间
   · 点击标题展开/收起完整版本历史（时间线样式）
   · 搜索时自动展开所有匹配分组
   ========================================================= */
(function () {
  // admin 登录后也可以预览客户端页面
  const login = requireLogin("client", true);
  if (!login) return;

  const state = loadData();
  const expanded = new Set(); // 已展开的分组（按项目名）

  document.getElementById("btnLogout").addEventListener("click", logout);
  document.getElementById("searchInput").addEventListener("input", render);

  // 事件委托：卡片展开收起 + README 查看按钮
  document.getElementById("groupList").addEventListener("click", function (e) {
    // 1) 点击卡片标题（非按钮区域）→ 展开 / 收起
    const head = e.target.closest(".group-head");
    if (head && !e.target.closest("a,button")) {
      const card = head.closest(".group-card");
      const name = card.dataset.name;
      if (expanded.has(name)) expanded.delete(name);
      else expanded.add(name);
      card.classList.toggle("open");
      return;
    }
    // 2) 点击【📖 说明 / 查看】按钮
    const btn = e.target.closest("button.btn-readme");
    if (!btn) return;
    const p = state.projects.find(function (x) { return x.id === btn.dataset.vid; });
    if (p) showReadmeModal(p.name, p.version, p.readme, p.screenVersion);
  });

  render();

  function render() {
    const kw = document.getElementById("searchInput").value.trim().toLowerCase();
    const list = state.projects.filter(function (p) {
      if (!kw) return true;
      return [p.name, p.version, p.screenVersion, p.readme].join(" ").toLowerCase().indexOf(kw) !== -1;
    });

    // ---- 按项目名称分组 ----
    const groups = {};
    list.forEach(function (p) {
      const key = (p.name || "未命名项目").trim();
      (groups[key] = groups[key] || []).push(p);
    });

    // 组内按时间倒序（最新在最上）；组间按最新版本时间倒序
    const keys = Object.keys(groups).map(function (k) {
      const versions = groups[k].slice().sort(function (a, b) {
        return String(b.date || "").localeCompare(String(a.date || ""));
      });
      return { name: k, versions: versions, latest: versions[0] };
    }).sort(function (a, b) {
      return String(b.latest.date || "").localeCompare(String(a.latest.date || ""));
    });

    // 统计条
    document.getElementById("sumProjects").textContent = keys.length;
    document.getElementById("sumVersions").textContent = list.length;

    const wrap = document.getElementById("groupList");
    if (!keys.length) {
      wrap.innerHTML =
        '<div class="empty-box">' + (kw ? "🔍 未找到匹配的项目" : "📭 暂无公开项目") + "</div>";
      return;
    }

    wrap.innerHTML = keys.map(function (g) {
      const isOpen = expanded.has(g.name) || kw !== "";
      const L = g.latest;

      // ---- 卡片标题 ----
      const dlLatest = L.download
        ? '<a class="btn btn-sm btn-primary" href="' + escapeHtml(normalizeUrl(L.download)) + '" target="_blank" rel="noopener">⬇ 下载最新</a>'
        : "";
      const head =
        '<div class="group-head">' +
        '  <div class="g-info">' +
        '    <div class="g-name">' + escapeHtml(g.name) +
        '      <span class="g-count">' + g.versions.length + " 个版本</span>" +
        "    </div>" +
        '    <div class="g-meta">最新 <span class="badge">' + escapeHtml(L.version || "—") + "</span>" +
        (L.screenVersion ? ' <span class="badge badge-green">屏幕 ' + escapeHtml(L.screenVersion) + "</span>" : "") +
        " · 📅 " + escapeHtml(L.date || "—") +
        "    </div>" +
        "  </div>" +
        '  <div class="g-actions">' +
        '    <button class="btn btn-sm btn-readme" data-vid="' + escapeHtml(L.id) + '">📖 说明</button>' +
        "    " + dlLatest +
        '    <span class="g-arrow">▾</span>' +
        "  </div>" +
        "</div>";

      // ---- 版本时间线 ----
      const items = g.versions.map(function (p, i) {
        const dl = p.download
          ? '<a class="btn btn-sm btn-primary" href="' + escapeHtml(normalizeUrl(p.download)) + '" target="_blank" rel="noopener">⬇ 下载</a>'
          : "";
        const screen = p.screenVersion
          ? '<span class="badge badge-green">屏幕 ' + escapeHtml(p.screenVersion) + "</span>"
          : "";
        const latestTag = i === 0 ? '<span class="v-latest">最新</span>' : "";
        const preview = String(p.readme || "").split("\n")[0] || "（暂无说明）";
        return '<div class="ver-item">' +
          '<div class="v-top">' +
          '  <span class="badge">' + escapeHtml(p.version || "—") + "</span>" +
          screen + latestTag +
          '  <span class="v-date">📅 ' + escapeHtml(p.date || "—") + "</span>" +
          '  <span class="v-actions">' +
          '    <button class="btn btn-sm btn-readme" data-vid="' + escapeHtml(p.id) + '">📖 查看</button>' +
          "    " + dl +
          "  </span>" +
          "</div>" +
          '<div class="v-preview">' + escapeHtml(preview) + "</div>" +
          "</div>";
      }).join("");

      return '<div class="group-card' + (isOpen ? " open" : "") + '" data-name="' + escapeHtml(g.name) + '">' +
        head +
        '<div class="group-body">' + items + "</div>" +
        "</div>";
    }).join("");
  }
})();
