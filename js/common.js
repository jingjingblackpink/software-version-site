/* =========================================================
   common.js —— 公共逻辑（账号配置、登录、数据读写、工具函数）
   ---------------------------------------------------------
   ★ 修改账号密码：改下面 USERS 里的内容即可
   ========================================================= */

// ===== 账号配置 =====
const USERS = {
  admin: { password: "admin", role: "admin", page: "admin.html" },
  "001": { password: "001", role: "client", page: "client.html" }
};

const LOGIN_KEY = "svm_login"; // 登录状态（浏览器会话内有效）
const DATA_KEY  = "svm_data";  // 后台编辑后的数据（长期保存在浏览器中）

// ---------- 登录 ----------
function getLogin() {
  try {
    return JSON.parse(sessionStorage.getItem(LOGIN_KEY));
  } catch (e) {
    return null;
  }
}

// 进入内页前必须调用：role 传 "admin" 或 "client"
function requireLogin(role, allowAdmin) {
  const login = getLogin();
  if (!login) {
    location.replace("index.html");
    return null;
  }
  const ok = (login.role === role) || (allowAdmin === true && login.role === "admin");
  if (!ok) {
    location.replace("index.html");
    return null;
  }
  return login;
}

function logout() {
  sessionStorage.removeItem(LOGIN_KEY);
  location.href = "index.html";
}

// ---------- 数据读写 ----------
// 优先级：按 updatedAt 比较，浏览器中后台编辑的数据 > data.js 出厂数据
function loadData() {
  let local = null;
  try {
    local = JSON.parse(localStorage.getItem(DATA_KEY));
  } catch (e) {
    local = null;
  }
  const base = (typeof PROJECTS_DATA !== "undefined" && PROJECTS_DATA) ? PROJECTS_DATA : null;

  if (local && Array.isArray(local.projects) && base && Array.isArray(base.projects)) {
    return new Date(local.updatedAt || 0) >= new Date(base.updatedAt || 0)
      ? local
      : JSON.parse(JSON.stringify(base));
  }
  if (local && Array.isArray(local.projects)) return local;
  if (base) return JSON.parse(JSON.stringify(base));
  return { updatedAt: "", projects: [] };
}

function saveData(data) {
  data.updatedAt = new Date().toISOString();
  localStorage.setItem(DATA_KEY, JSON.stringify(data));
}

// 清除浏览器中保存的数据，重新读取仓库里的 data.js（线上数据更新后可用）
function resetLocalData() {
  localStorage.removeItem(DATA_KEY);
}

// 导出 data.js：用当前最新数据生成文件并下载
function exportDataJs() {
  const data = loadData();
  const content =
    "// data.js —— 软件版本管理网站数据文件\n" +
    "// 本文件由管理后台于 " + new Date().toLocaleString("zh-CN") + " 自动导出\n" +
    "// 用法：在 GitHub 仓库中打开 data.js → 编辑 → 用本文件全部内容替换 → Commit，约 1 分钟后线上生效\n" +
    "const PROJECTS_DATA = " + JSON.stringify(data, null, 2) + ";\n";
  downloadFile("data.js", content, "text/javascript;charset=utf-8");
}

// 导入 data.js / .json 数据文件
function importDataFile(file, callback) {
  const reader = new FileReader();
  reader.onload = function () {
    try {
      const text = String(reader.result);
      let data;
      if (text.trim().charAt(0) === "{") {
        data = JSON.parse(text); // 纯 JSON 文件
      } else {
        // data.js 文件：执行后取出 PROJECTS_DATA
        data = new Function(text + "\n;return PROJECTS_DATA;")();
      }
      if (!data || !Array.isArray(data.projects)) throw new Error("文件中缺少 projects 字段");
      saveData(data);
      callback(null, data);
    } catch (err) {
      callback(err);
    }
  };
  reader.onerror = function () { callback(new Error("文件读取失败")); };
  reader.readAsText(file, "utf-8");
}

function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
}

// ---------- 工具函数 ----------
function escapeHtml(str) {
  return String(str == null ? "" : str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// 规范化下载链接：缺少 http/https 前缀时自动补全，避免点击后跳到错误页面
function normalizeUrl(u) {
  const s = String(u == null ? "" : u).trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  return "https://" + s.replace(/^\/+/, "");
}

function genId() {
  return "p-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  function p(n) { return String(n).padStart(2, "0"); }
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) +
         " " + p(d.getHours()) + ":" + p(d.getMinutes());
}

function todayStr() {
  const d = new Date();
  function p(n) { return String(n).padStart(2, "0"); }
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
}

function toast(msg, isError) {
  const t = document.createElement("div");
  t.className = "toast" + (isError ? " toast-err" : "");
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(function () { t.classList.add("show"); }, 10);
  setTimeout(function () {
    t.classList.remove("show");
    setTimeout(function () { t.remove(); }, 350);
  }, 2600);
}

// README 查看弹窗（admin / client 共用）
function showReadmeModal(name, version, readme) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay open";
  overlay.innerHTML =
    '<div class="modal">' +
    '  <h2>📖 README 信息</h2>' +
    '  <p class="td-muted" style="margin-bottom:10px">' + escapeHtml(name) + ' · <span class="badge">' + escapeHtml(version || "—") + "</span></p>" +
    '  <div class="readme-body">' + escapeHtml(readme || "（暂无 README 信息）") + "</div>" +
    '  <div class="modal-actions"><button class="btn" id="rmClose">关 闭</button></div>' +
    "</div>";
  document.body.appendChild(overlay);
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) overlay.remove();
  });
  overlay.querySelector("#rmClose").addEventListener("click", function () {
    overlay.remove();
  });
}
