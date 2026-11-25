/* =========================================================
   admin.js —— 管理后台逻辑
   ========================================================= */
(function () {
  const login = requireLogin("admin");
  if (!login) return;

  let state = loadData();
  let editingId = null;

  // ---------- 顶栏 ----------
  document.getElementById("btnLogout").addEventListener("click", logout);

  // ---------- 工具栏 ----------
  document.getElementById("btnAdd").addEventListener("click", function () {
    openEditModal(null);
  });

  document.getElementById("btnExport").addEventListener("click", function () {
    exportDataJs();
    toast("已导出 data.js ✓ 请按【发布指南】更新到 GitHub");
  });

  document.getElementById("btnImport").addEventListener("click", function () {
    document.getElementById("importFile").click();
  });

  document.getElementById("importFile").addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) return;
    importDataFile(file, function (err) {
      if (err) {
        toast("导入失败：" + err.message, true);
      } else {
        state = loadData();
        render();
        toast("导入成功 ✓");
      }
    });
    e.target.value = "";
  });

  document.getElementById("btnReset").addEventListener("click", function () {
    if (!confirm("确定放弃浏览器中保存的本地编辑，重新加载仓库 data.js 的数据吗？")) return;
    resetLocalData();
    state = loadData();
    render();
    toast("已重新加载仓库数据 ✓");
  });

  document.getElementById("btnGuide").addEventListener("click", function () {
    document.getElementById("guideModal").classList.add("open");
  });
  document.getElementById("guideClose").addEventListener("click", function () {
    document.getElementById("guideModal").classList.remove("open");
  });
  document.getElementById("guideModal").addEventListener("click", function (e) {
    if (e.target === e.currentTarget) e.currentTarget.classList.remove("open");
  });

  document.getElementById("searchInput").addEventListener("input", render);

  // ---------- 未发布提醒横幅 ----------
  document.getElementById("unpubGuide").addEventListener("click", function () {
    document.getElementById("guideModal").classList.add("open");
  });
  document.getElementById("unpubClose").addEventListener("click", function () {
    document.getElementById("unpublishedBanner").style.display = "none";
  });
  checkUnpublished();

  // ---------- 编辑弹窗 ----------
  document.getElementById("editForm").addEventListener("submit", function (e) {
    e.preventDefault();
    saveEdit();
  });
  document.getElementById("btnCancel").addEventListener("click", closeEditModal);
  document.getElementById("editModal").addEventListener("click", function (e) {
    if (e.target === e.currentTarget) closeEditModal();
  });

  // ---------- 表格按钮（事件委托） ----------
  document.getElementById("tableBody").addEventListener("click", function (e) {
    const tr = e.target.closest("tr");
    if (!tr || !tr.dataset.id) return;
    const p = state.projects.find(function (x) { return x.id === tr.dataset.id; });
    if (!p) return;
    if (e.target.classList.contains("btn-readme")) {
      showReadmeModal(p.name, p.version, p.readme);
    } else if (e.target.classList.contains("btn-edit")) {
      openEditModal(p);
    } else if (e.target.classList.contains("btn-del")) {
      removeProject(p);
    }
  });

  render();

  // ---------- 渲染 ----------
  function render() {
    // 统计卡片
    const total = state.projects.length;
    let latest = "—";
    if (total > 0) {
      const sorted = state.projects.slice().sort(function (a, b) {
        return String(b.date || "").localeCompare(String(a.date || ""));
      });
      latest = sorted[0].date + "（" + sorted[0].name + "）";
    }
    document.getElementById("statTotal").textContent = total;
    document.getElementById("statLatest").textContent = latest;
    document.getElementById("statLatest").title = latest;
    document.getElementById("statUpdated").textContent = formatDateTime(state.updatedAt);

    // 表格
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
        '<tr class="empty-row"><td colspan="6">' +
        (kw ? "未找到匹配的项目" : "暂无项目，点击【➕ 新增项目】添加") +
        "</td></tr>";
      return;
    }

    tbody.innerHTML = list.map(function (p) {
      const dl = p.download
        ? '<a class="btn btn-sm btn-primary" href="' + escapeHtml(normalizeUrl(p.download)) + '" target="_blank" rel="noopener">⬇ 下载</a>'
        : '<span class="td-muted">—</span>';
      return '<tr data-id="' + escapeHtml(p.id) + '">' +
        '<td class="td-name">' + escapeHtml(p.name) + "</td>" +
        "<td>" + escapeHtml(p.date || "—") + "</td>" +
        '<td><span class="badge">' + escapeHtml(p.version || "—") + "</span></td>" +
        '<td><button class="btn btn-sm btn-readme">📖 查看</button></td>' +
        "<td>" + dl + "</td>" +
        '<td class="td-actions">' +
        '  <button class="btn btn-sm btn-edit">✏️ 编辑</button>' +
        '  <button class="btn btn-sm btn-danger btn-del">🗑 删除</button>' +
        "</td></tr>";
    }).join("");
  }

  function removeProject(p) {
    if (!confirm("确定删除项目【" + p.name + "】吗？")) return;
    state.projects = state.projects.filter(function (x) { return x.id !== p.id; });
    saveData(state);
    render();
    toast("已删除 ✓");
  }

  // ---------- 编辑弹窗 ----------
  function openEditModal(p) {
    editingId = p ? p.id : null;
    document.getElementById("modalTitle").textContent = p ? "✏️ 编辑项目" : "➕ 新增项目";
    document.getElementById("fName").value = p ? (p.name || "") : "";
    document.getElementById("fDate").value = p ? (p.date || "") : todayStr();
    document.getElementById("fVersion").value = p ? (p.version || "") : "";
    document.getElementById("fReadme").value = p ? (p.readme || "") : "";
    document.getElementById("fDownload").value = p ? (p.download || "") : "";
    document.getElementById("editModal").classList.add("open");
    document.getElementById("fName").focus();
  }

  function closeEditModal() {
    document.getElementById("editModal").classList.remove("open");
  }

  function saveEdit() {
    const name = document.getElementById("fName").value.trim();
    const date = document.getElementById("fDate").value;
    const version = document.getElementById("fVersion").value.trim();
    const readme = document.getElementById("fReadme").value.trim();
    const download = normalizeUrl(document.getElementById("fDownload").value);

    if (!name) { toast("请填写项目名称", true); return; }
    if (!date) { toast("请选择上传日期", true); return; }

    if (editingId) {
      const p = state.projects.find(function (x) { return x.id === editingId; });
      if (p) {
        p.name = name; p.date = date; p.version = version; p.readme = readme; p.download = download;
      }
    } else {
      state.projects.push({
        id: genId(),
        name: name,
        date: date,
        version: version,
        readme: readme,
        download: download
      });
    }

    saveData(state);
    closeEditModal();
    render();
    toast("已保存 ✓ 别忘了【导出 data.js】并更新到 GitHub");
  }

  // ---------- 发布状态检测：线上 data.js 与本机数据不一致时提醒 ----------
  function normForCompare(data) {
    const one = function (p) {
      return JSON.stringify({
        id: p.id, name: p.name, date: p.date, version: p.version,
        readme: p.readme, download: normalizeUrl(p.download)
      });
    };
    const list = (data.projects || []).slice()
      .sort(function (a, b) { return String(a.id).localeCompare(String(b.id)); })
      .map(one);
    return JSON.stringify(list);
  }

  function checkUnpublished() {
    if (location.protocol === "file:") return; // 本地打开时跳过
    fetch("data.js", { cache: "no-store" })
      .then(function (r) {
        return r.ok ? r.text() : Promise.reject(new Error("HTTP " + r.status));
      })
      .then(function (text) {
        const remote = new Function(text + "\n;return PROJECTS_DATA;")();
        if (normForCompare(remote) === normForCompare(state)) return;
        const n = state.projects.length;
        const m = (remote.projects || []).length;
        document.getElementById("unpubText").textContent =
          "⚠️ 有修改尚未发布到线上：本浏览器已显示 " + n + " 个项目，但线上仍是 " + m +
          " 个——其他设备 / 其他浏览器暂时看不到你的新数据！请点【📤 导出 data.js】，再更新到 GitHub 仓库。";
        document.getElementById("unpublishedBanner").style.display = "flex";
      })
      .catch(function () { /* 本地打开或网络问题时忽略 */ });
  }
})();
