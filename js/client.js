/* =========================================================
   client.js —— 客户端页面逻辑（只读）
   ========================================================= */
(function () {
  // admin 登录后也可以预览客户端页面
  const login = requireLogin("client", true);
  if (!login) return;

  const state = loadData();

  document.getElementById("btnLogout").addEventListener("click", logout);
  document.getElementById("searchInput").addEventListener("input", render);

  // README 查看按钮（事件委托）
  document.getElementById("tableBody").addEventListener("click", function (e) {
    const tr = e.target.closest("tr");
    if (!tr || !tr.dataset.id) return;
    const p = state.projects.find(function (x) { return x.id === tr.dataset.id; });
    if (!p) return;
    if (e.target.classList.contains("btn-readme")) {
      showReadmeModal(p.name, p.version, p.readme);
    }
  });

  render();

  function render() {
    const kw = document.getElementById("searchInput").value.trim().toLowerCase();
    const list = state.projects
      .filter(function (p) {
        if (!kw) return true;
        return [p.name, p.version, p.readme].join(" ").toLowerCase().indexOf(kw) !== -1;
      })
      .sort(function (a, b) {
        return String(b.date || "").localeCompare(String(a.date || ""));
      });

    const tbody = document.getElementById("tableBody");
    if (!list.length) {
      tbody.innerHTML =
        '<tr class="empty-row"><td colspan="5">' +
        (kw ? "未找到匹配的项目" : "暂无公开项目") +
        "</td></tr>";
      return;
    }

    tbody.innerHTML = list.map(function (p) {
      const dl = p.download
        ? '<a class="btn btn-sm btn-primary" href="' + escapeHtml(p.download) + '" target="_blank" rel="noopener">⬇ 下载</a>'
        : '<span class="td-muted">—</span>';
      return '<tr data-id="' + escapeHtml(p.id) + '">' +
        '<td class="td-name">' + escapeHtml(p.name) + "</td>" +
        "<td>" + escapeHtml(p.date || "—") + "</td>" +
        '<td><span class="badge">' + escapeHtml(p.version || "—") + "</span></td>" +
        '<td><button class="btn btn-sm btn-readme">📖 查看</button></td>' +
        "<td>" + dl + "</td></tr>";
    }).join("");
  }
})();
