# GitHub 上传与上线操作指南（定制版）

> 本指南专门为账号 **jingjingblackpink** 编写，配合《软件版本管理微型网站建设方案.md》使用。
> ⚠️ 安全提醒：**GitHub 早已禁止使用"账号密码"推送代码**，推送时需要使用 **Personal Access Token（访问令牌）**，密码不要写在任何文件或命令里。

---

## 第 0 步：本地测试网站（1 分钟）

直接**双击 `index.html`** 用浏览器打开（推荐 Chrome / Edge）：

- 输入管理员账号 `admin` / `admin` → 进入管理后台
- 输入客户端账号 `001` / `001` → 进入客户端表格页
- 在后台试一下"新增项目 → 导出 data.js"是否正常

✅ 测试通过后，再进行上传。

---

## 第 1 步：在 GitHub 上创建空仓库

1. 浏览器打开 https://github.com/new （用 jingjingblackpink 登录）
2. 填写：
   - **Repository name**：`software-version-site`（也可自定，但下面命令中的名字要一致）
   - **可见性**：选择 `Public`（Pages 免费版要求公开）
3. **不要**勾选 "Add a README file"、**不要**添加 .gitignore / license（本地已经有了）
4. 点击 **Create repository**

---

## 第 2 步：把本地代码推送上去（二选一）

### 方式 A：命令行推送（推荐，文件齐全不出错）

#### A-1. 先创建访问令牌（Token）

1. 打开 https://github.com/settings/tokens
2. 点击 **Generate new token → Generate new token (classic)**
3. 填写 Note（如 `site-push`），Expiration 选 `90 days` 或 `No expiration`
4. 权限勾选 **repo**（第一项，包含全部子项）
5. 点击页面底部 **Generate token**
6. **立即复制**生成的令牌（`ghp_` 开头，只显示一次）

> 🔒 令牌相当于密码，不要发给任何人；不用了可以随时回到同一页面 Revoke（撤销）。

#### A-2. 推送命令

在 `F:\移植+驱动\00泉心泉意\00软件信息版本管理2` 目录打开终端（PowerShell），执行：

```powershell
git remote add origin https://github.com/jingjingblackpink/software-version-site.git
git push -u origin main
```

弹出登录窗口时：

- **Username**：`jingjingblackpink`
- **Password**：粘贴刚才的**令牌**（不是账号密码）

> 如果没有弹窗而是在终端里询问，同样：Username 填账号，Password 粘贴令牌（粘贴时屏幕不显示，属正常）。

### 方式 B：网页上传（完全不需要令牌）

1. 打开刚创建的空仓库页面
2. 点击 **uploading an existing file**（或 Add file → Upload files）
3. 把文件夹里的以下文件**逐个拖入**（文件夹不能直接拖）：
   `index.html`、`admin.html`、`client.html`、`data.js`、`README.md`、`.nojekyll`、`css/style.css`、`js/common.js`、`js/admin.js`、`js/client.js`
4. 底部填写提交信息（如 `网站初始化`）→ 点 **Commit changes**

> 注意：网页上传时 `.gitignore` 可以省略；如果以后更新数据，也可以随时用这个方式替换 `data.js`。

---

## 第 3 步：开启 GitHub Pages（上线）

1. 仓库页面 → **Settings** → 左侧 **Pages**
2. **Build and deployment → Source**：选择 `Deploy from a branch`
3. **Branch**：选 `main`，目录选 `/(root)` → 点击 **Save**
4. 等待 1~2 分钟，页面顶部会出现绿色提示

## 第 4 步：访问你的网站

```
https://jingjingblackpink.github.io/software-version-site/
```

- 管理员：`admin` / `admin` → 后台管理
- 客户端：`001` / `001` → 只读浏览

把这个网址和 `001/001` 账号发给你需要分享的人即可。

---

## 第 5 步：以后如何更新数据（日常流程）

1. 登录后台 → 新增 / 编辑 / 删除项目
2. 点【📤 导出 data.js】
3. 更新 GitHub 仓库里的 `data.js`（后台【🚀 发布指南】弹窗里有图文步骤）：
   - 网页方式：仓库中打开 `data.js` → 铅笔编辑 → 全选替换 → Commit
   - 命令方式：把新文件覆盖到本地文件夹 → `git add -A` → `git commit -m "更新数据"` → `git push`
4. 约 1 分钟后线上生效

---

## 🔒 账号安全（重要）

1. **你的账号密码曾在聊天中发送过，强烈建议尽快修改**：https://github.com/settings/security → Change password
2. 建议开启 **两步验证（2FA）**：同一页面 → Two-factor authentication
3. 令牌（Token）与密码分开保管；泄露了就在 GitHub 上撤销即可，不用改密码
4. 以后也不要把密码发到任何对话、文件、代码里
