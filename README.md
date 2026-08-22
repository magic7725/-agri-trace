# 🌾 农产品鉴真溯源系统

一个基于 **HTML + CSS + JavaScript** 的纯前端「农产品鉴真溯源」演示系统，实现"一物一码、全程可溯、放心消费"的核心场景。无需任何后端即可在浏览器中运行，可直接部署到 **GitHub Pages**。

## ✨ 功能板块

| 板块 | 说明 |
|---|---|
| 📊 系统概览 | 关键指标卡片、快捷入口、最新公告 |
| 🥬 农产品介绍 | 产品卡片、分类筛选、关键词搜索、详情弹窗 |
| 📷 扫码检索 | 手动输入溯源码 / 摄像头扫码，真伪判定 + 全链路溯源时间轴 |
| 🛰 追踪监视 | 在途批次实时温湿度、车速、位置，每 30 秒自动刷新 |
| 📈 数据统计 | Chart.js 柱状图 / 环形图 / 折线图 + 认证类型占比 |
| 📰 新闻公告 | 政策公告 / 行业新闻 / 通知，分类筛选，点击展开全文 |
| 💬 用户交流 | 留言板 + 话题讨论双 Tab，支持发帖、点赞、回复 |
| 🔐 登录界面 | 注册 / 登录 / 会话管理（localStorage） |

## 🛠 技术栈

- HTML5 + CSS3（自定义绿色农业主题，响应式布局）
- 原生 JavaScript（ES6+）
- [Chart.js](https://www.chartjs.org/) — 数据可视化
- [html5-qrcode](https://github.com/mebjas/html5-qrcode) — 摄像头扫码
- localStorage — 用户、会话、帖子等数据的本地存储

## 📁 目录结构

```
.
├── index.html          # 登录 / 注册页
├── app.html            # 主系统（七大板块）
├── css/
│   └── style.css       # 全局样式
└── js/
    ├── data.js         # 农产品 / 溯源 / 新闻 / 统计（模拟数据）
    ├── auth.js         # 登录注册、会话管理
    └── app.js          # 各板块交互逻辑
```

## ▶️ 本地运行

直接用浏览器打开 `index.html` 即可；或启动一个本地静态服务器：

```bash
cd agri-trace
python -m http.server 8000
# 然后访问 http://localhost:8000
```

**演示账号**：`admin / 123456` 或 `user / 123456`（也可自行注册）。

**演示溯源码**（扫码检索页可点击）：`NY20260001` ~ `NY20260008`。

## 🚀 部署到 GitHub Pages

> 项目内所有资源均为**相对路径**，因此无论部署在根域名还是子路径（如 `https://用户名.github.io/仓库名/`）都能正常访问。

### 方式一：网页上传（最简单，无需命令行）

1. 登录 GitHub，点击右上角 `+` → `New repository`，仓库名填 `agri-trace`（Public 即可）。
2. 进入仓库，点击 `uploading an existing file`，把本目录内的 `index.html`、`app.html`、`css/`、`js/`、`README.md`、`.nojekyll` **拖拽到仓库根目录**（注意：是上传 `agri-trace` 文件夹的**内容**，而不是整个文件夹）。
3. 提交后，打开仓库 `Settings` → 左侧 `Pages`。
4. `Source` 选择 `Deploy from a branch`，`Branch` 选择 `main`、目录选 `/ (root)`，点击 `Save`。
5. 等待 1~2 分钟，即可通过 `https://<你的用户名>.github.io/agri-trace/` 访问。

### 方式二：Git 命令行

```bash
cd agri-trace            # 进入项目目录
git init
git add .
git commit -m "feat: 农产品鉴真溯源系统"
git branch -M main
git remote add origin https://github.com/<你的用户名>/agri-trace.git
git push -u origin main
```

推送后，再按「方式一」的第 3~5 步在 `Settings → Pages` 中开启即可。

### 方式三：使用 GitHub CLI（gh）

```bash
cd agri-trace
git init && git add . && git commit -m "init"
gh repo create agri-trace --public --source=. --push
```

然后在仓库 `Settings → Pages` 开启 `Deploy from a branch → main / (root)`。

## 🔧 接入真实后端

当前为纯前端演示，模拟数据集中在 `js/data.js`，认证与帖子存储在 `localStorage`。接入真实后端时：

1. 将 `data.js` 中的 `PRODUCTS`、`NEWS`、`STATS` 改为接口 `fetch` 返回；
2. 将 `auth.js` 中的注册 / 登录改为调用后端鉴权接口；
3. 社区帖子的读写改为后端 API。

## ⚠️ 说明

- **摄像头扫码**需联网加载扫码库并授权浏览器摄像头，离线时自动降级为手动输入。
- **图表**需联网加载 Chart.js，离线时统计页会给出提示，其余功能不受影响。
