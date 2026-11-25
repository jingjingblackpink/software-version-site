/* =========================================================
   github-publish.js —— 后台【🚀 一键发布】到 GitHub
   ---------------------------------------------------------
   原理：调用 GitHub Contents API，把浏览器中的最新数据
         直接提交（PUT）为仓库里的 data.js 文件
   安全：Token 只保存在本浏览器 localStorage 中，
         绝不写入网站代码；泄露时到 GitHub 撤销即可
   ========================================================= */
(function () {
  const TOKEN_KEY = "svm_github_token";
  const REPO_KEY  = "svm_github_repo";
  const DEFAULT_REPO = "jingjingblackpink/software-version-site";

  function getToken() {
    return localStorage.getItem(TOKEN_KEY) || "";
  }

  function getRepo() {
    return (localStorage.getItem(REPO_KEY) || "").trim() || DEFAULT_REPO;
  }

  function apiHeaders(token) {
    return {
      Authorization: "Bearer " + token,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json"
    };
  }

  // UTF-8 文本 → Base64（btoa 只支持拉丁字符，需先转字节）
  function utf8ToBase64(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = "";
    const CHUNK = 0x8000;
    for (let i = 0; i < bytes.length; i += CHUNK) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
    }
    return btoa(bin);
  }

  // 读取当前线上 data.js 的 sha（404 = 文件尚不存在，可新建）
  async function getSha(token, repo) {
    const res = await fetch("https://api.github.com/repos/" + repo + "/contents/data.js", {
      headers: apiHeaders(token)
    });
    if (res.status === 404) return null;
    if (res.status === 401 || res.status === 403) throw new Error("AUTH");
    if (!res.ok) throw new Error("HTTP " + res.status);
    const j = await res.json();
    return j.sha;
  }

  async function putDataJs(token, repo, sha) {
    const body = {
      message: "更新数据（后台一键发布） " + new Date().toLocaleString("zh-CN"),
      content: utf8ToBase64(makeDataJsContent())
    };
    if (sha) body.sha = sha;
    return fetch("https://api.github.com/repos/" + repo + "/contents/data.js", {
      method: "PUT",
      headers: apiHeaders(token),
      body: JSON.stringify(body)
    });
  }

  async function commitDataJs() {
    const token = getToken();
    if (!token) {
      openPublishCfg("首次使用：请先在下方填入 GitHub Token 并保存设置");
      return;
    }

    const repo = getRepo();
    const btn = document.getElementById("btnPublish");
    const oldText = btn.textContent;
    btn.disabled = true;
    btn.textContent = "⏳ 发布中…";

    try {
      let sha = await getSha(token, repo);
      let res = await putDataJs(token, repo, sha);

      // 远端文件刚被别处修改过：取最新 sha 自动重试一次
      if (res.status === 409 || res.status === 422) {
        sha = await getSha(token, repo);
        res = await putDataJs(token, repo, sha);
      }

      if (res.status === 401 || res.status === 403) {
        openPublishCfg("Token 无效、过期或没有权限，请更新 Token");
        toast("❌ Token 无效或没有权限，请在发布设置里更新", true);
        return;
      }
      if (!res.ok) {
        toast("❌ 发布失败：HTTP " + res.status, true);
        return;
      }

      // 发布成功：本机数据与线上已一致，隐藏"未发布"提醒
      const banner = document.getElementById("unpublishedBanner");
      if (banner) banner.style.display = "none";
      toast("✅ 已发布到 GitHub！其他设备 1~2 分钟内即可看到最新数据");
    } catch (e) {
      if (e && e.message === "AUTH") {
        openPublishCfg("Token 无效或已过期，请更新 Token");
        toast("❌ Token 无效或已过期", true);
      } else {
        toast("❌ 发布失败（网络问题）：" + (e && e.message ? e.message : e), true);
      }
    } finally {
      btn.disabled = false;
      btn.textContent = oldText;
    }
  }

  function openPublishCfg(notice) {
    document.getElementById("pfToken").value = getToken();
    document.getElementById("pfRepo").value = getRepo();
    const note = document.getElementById("pfNote");
    if (notice) {
      note.textContent = "⚠️ " + notice;
      note.style.display = "block";
    } else {
      note.style.display = "none";
    }
    document.getElementById("publishModal").classList.add("open");
  }

  function closePublishCfg() {
    document.getElementById("publishModal").classList.remove("open");
  }

  // ---------- 事件绑定 ----------
  document.getElementById("btnPublish").addEventListener("click", commitDataJs);

  document.getElementById("btnPubCfg").addEventListener("click", function () {
    openPublishCfg();
  });

  document.getElementById("pfCancel").addEventListener("click", closePublishCfg);

  document.getElementById("pfSave").addEventListener("click", function () {
    const t = document.getElementById("pfToken").value.trim();
    const r = document.getElementById("pfRepo").value.trim() || DEFAULT_REPO;
    if (!t) { toast("请填写 Token", true); return; }
    if (!/^[^/]+\/[^/]+$/.test(r)) { toast("仓库格式应为：用户名/仓库名", true); return; }
    localStorage.setItem(TOKEN_KEY, t);
    localStorage.setItem(REPO_KEY, r);
    closePublishCfg();
    toast("设置已保存 ✓ 以后点【🚀 一键发布】即可直接更新线上数据");
  });

  document.getElementById("publishModal").addEventListener("click", function (e) {
    if (e.target === e.currentTarget) closePublishCfg();
  });
})();
