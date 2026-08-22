/* =========================================================
   主应用逻辑 - 概览 / 产品 / 扫码 / 追踪 / 统计 / 新闻 / 社区
   ========================================================= */

/* ---------- 会话守卫：未登录跳转回登录页 ---------- */
const currentUser = getCurrentUser();
if (!currentUser) {
  // 未登录：跳转登录页，下方初始化逻辑将被跳过
  location.replace("index.html");
}

/* ---------- 通用 DOM 工具 ---------- */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

/* =========================================================
   1. 侧边栏导航与用户信息
   ========================================================= */
function initShell() {
  // 用户信息
  $("#sideName").textContent = currentUser.nickname || currentUser.username;
  $("#sideRole").textContent = currentUser.role || "普通用户";
  $("#sideAvatar").textContent = (currentUser.nickname || currentUser.username).slice(0, 1);
  $("#postAsName").textContent = currentUser.nickname || currentUser.username;

  // 顶部日期
  const now = new Date();
  $("#topbarDate").textContent =
    `${now.getFullYear()} 年 ${now.getMonth() + 1} 月 ${now.getDate()} 日 ` +
    "星期" + "日一二三四五六"[now.getDay()];

  // 导航切换
  const pageTitles = {
    overview: "系统概览", products: "农产品介绍", scan: "扫码检索",
    track: "追踪监视", stats: "数据统计", news: "新闻公告", community: "用户交流",
  };
  $$(".nav-item").forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      $$(".nav-item").forEach(n => n.classList.remove("active"));
      item.classList.add("active");
      const page = item.dataset.page;
      $$(".page").forEach(p => p.classList.remove("active"));
      $("#page-" + page).classList.add("active");
      $("#pageTitle").textContent = pageTitles[page] || "";
      if (page === "stats") renderStats(); // 进入统计页时再绘制图表，保证 canvas 可见
    });
  });

  // 退出登录
  $("#logoutBtn").addEventListener("click", () => {
    logout();
    location.href = "index.html";
  });
}

/* =========================================================
   2. 系统概览
   ========================================================= */
function renderOverview() {
  $("#overviewStats").innerHTML = `
    <div class="stat-card"><div class="stat-icon">🥬</div><div><div class="num">${STATS.totalProducts}</div><div class="label">在库农产品</div></div></div>
    <div class="stat-card"><div class="stat-icon">📷</div><div><div class="num">${STATS.todayScans}</div><div class="label">今日扫码次数</div></div></div>
    <div class="stat-card"><div class="stat-icon">📦</div><div><div class="num">${STATS.traceBatches}</div><div class="label">溯源批次</div></div></div>
    <div class="stat-card"><div class="stat-icon">🏅</div><div><div class="num">${STATS.certified}%</div><div class="label">认证覆盖率</div></div></div>
  `;

  $("#quickActions").innerHTML = `
    <button class="btn btn-primary" data-go="scan">📷 扫码溯源</button>
    <button class="btn btn-outline" data-go="products">🥬 浏览产品</button>
    <button class="btn btn-outline" data-go="track">🛰 追踪监视</button>
    <button class="btn btn-outline" data-go="stats">📈 数据统计</button>
  `;
  $$("#quickActions [data-go]").forEach(btn => {
    btn.addEventListener("click", () => switchPage(btn.dataset.go));
  });

  $("#overviewNews").innerHTML = NEWS.slice(0, 4).map(n =>
    `<li><span>📌 ${n.title}</span><span class="muted small">${n.date}</span></li>`
  ).join("");
}

function switchPage(page) {
  const nav = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (nav) nav.click();
}

/* =========================================================
   3. 农产品介绍
   ========================================================= */
function renderProducts() {
  // 分类筛选
  const cats = getAllCategories();
  $("#categoryChips").innerHTML = cats.map(c =>
    `<span class="chip ${c === "全部" ? "active" : ""}" data-cat="${c}">${c}</span>`
  ).join("");

  let activeCat = "全部";
  $$("#categoryChips .chip").forEach(chip => {
    chip.addEventListener("click", () => {
      $$("#categoryChips .chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      activeCat = chip.dataset.cat;
      drawProductGrid();
    });
  });

  $("#productSearch").addEventListener("input", drawProductGrid);

  function drawProductGrid() {
    const kw = $("#productSearch").value.trim();
    const list = PRODUCTS.filter(p =>
      (activeCat === "全部" || p.category === activeCat) &&
      (p.name.includes(kw) || p.origin.includes(kw) || p.category.includes(kw))
    );
    $("#productGrid").innerHTML = list.map(p => `
      <div class="product-card" data-id="${p.id}">
        <div class="product-cover" style="background:${p.color}">${p.emoji}</div>
        <div class="product-body">
          <h4>${p.name}</h4>
          <div class="origin">📍 ${p.origin} · ${p.brand}</div>
          <div class="badges">
            ${p.certs.map(c => `<span class="badge green">${c}</span>`).join("")}
          </div>
        </div>
      </div>
    `).join("") || `<p class="muted">未找到匹配的产品。</p>`;

    $$("#productGrid .product-card").forEach(card => {
      card.addEventListener("click", () => showProductModal(card.dataset.id));
    });
  }
  drawProductGrid();
}

function showProductModal(id) {
  const p = getProductById(id);
  if (!p) return;
  $("#modalBody").innerHTML = `
    <button class="modal-close" id="modalClose">✕</button>
    <h2>${p.emoji} ${p.name}</h2>
    <div class="origin">📍 ${p.origin} · ${p.brand} · ${p.price}</div>
    <div class="badges" style="margin-bottom:14px">
      ${p.certs.map(c => `<span class="badge green">${c}</span>`).join("")}
      ${p.features.map(f => `<span class="badge blue">${f}</span>`).join("")}
    </div>
    <p style="font-size:14px;margin-bottom:14px">${p.desc}</p>
    <h3 style="font-size:14px;color:var(--green-dark);margin-bottom:8px">🛰 溯源流程</h3>
    <div class="timeline">
      ${p.journey.map(n => `
        <div class="tl-node ${n.status}">
          <div class="tl-title">${n.stage}</div>
          <div class="tl-meta">${n.time} · ${n.location} · ${n.operator}</div>
          <div class="tl-note">${n.note}</div>
        </div>`).join("")}
    </div>
    <div style="margin-top:16px">
      <button class="btn btn-primary" data-scan="${p.traceCodes[0]}">📷 扫码溯源此产品</button>
    </div>
  `;
  $("#modalMask").classList.remove("hidden");
  $("#modalClose").addEventListener("click", closeModal);
  const scanBtn = $("#modalBody [data-scan]");
  if (scanBtn) scanBtn.addEventListener("click", () => {
    closeModal();
    switchPage("scan");
    $("#traceInput").value = scanBtn.dataset.scan;
    queryTrace();
  });
}

function closeModal() {
  $("#modalMask").classList.add("hidden");
}

/* =========================================================
   4. 扫码检索
   ========================================================= */
function initScan() {
  // 演示码
  $("#demoCodes").innerHTML = getAllDemoCodes().map(c =>
    `<span class="chip" data-code="${c}">${c}</span>`
  ).join("");
  $$("#demoCodes .chip").forEach(chip => {
    chip.addEventListener("click", () => {
      $("#traceInput").value = chip.dataset.code;
      queryTrace();
    });
  });

  $("#scanManualBtn").addEventListener("click", queryTrace);
  $("#traceInput").addEventListener("keydown", (e) => { if (e.key === "Enter") queryTrace(); });

  // 摄像头扫码
  $("#scanCameraBtn").addEventListener("click", toggleCamera);
  $("#cameraCloseBtn").addEventListener("click", stopCamera);
}

let scanner = null;
async function toggleCamera() {
  if (scanner) { stopCamera(); return; }
  if (typeof Html5Qrcode === "undefined") {
    alert("摄像头扫码库加载失败（可能离线）。请使用手动输入溯源码查询。");
    return;
  }
  $("#cameraBox").classList.remove("hidden");
  try {
    scanner = new Html5Qrcode("qrReader");
    await scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 220, height: 220 } },
      (decodedText) => {
        $("#traceInput").value = decodedText;
        stopCamera();
        queryTrace();
      },
      () => {} // 忽略未识别帧
    );
    $("#scanCameraBtn").textContent = "🛑 停止扫码";
  } catch (err) {
    alert("无法启动摄像头，请检查权限或改用电脑摄像头。");
    stopCamera();
  }
}

async function stopCamera() {
  if (scanner) {
    try { await scanner.stop(); scanner.clear(); } catch (e) {}
    scanner = null;
  }
  $("#cameraBox").classList.add("hidden");
  $("#scanCameraBtn").textContent = "📷 摄像头扫码";
}

function queryTrace() {
  const code = $("#traceInput").value.trim();
  if (!code) { alert("请输入溯源防伪码"); return; }
  const p = getProductByCode(code);
  const box = $("#scanResult");

  if (!p) {
    box.innerHTML = `
      <div class="result-card">
        <div class="result-head">
          <div>
            <div class="tl-title" style="font-size:18px">溯源码：${esc(code)}</div>
            <div class="muted small">查询时间：${new Date().toLocaleString()}</div>
          </div>
          <span class="verify-tag fake">⚠️ 未查到记录 · 疑似假冒</span>
        </div>
        <div class="result-body">
          <p>该溯源码不在官方数据库内，请谨慎购买，并可通过用户交流板块向我们举报。</p>
        </div>
      </div>`;
    return;
  }

  box.innerHTML = `
    <div class="result-card">
      <div class="result-head">
        <div>
          <div class="tl-title" style="font-size:20px">${p.emoji} ${p.name}</div>
          <div class="muted small">溯源码：${esc(code)} · 查询时间：${new Date().toLocaleString()}</div>
        </div>
        <span class="verify-tag genuine">✅ 正品 · 溯源有效</span>
      </div>
      <div class="result-body">
        <div class="info-grid">
          <div class="item"><span>产地：</span>${p.origin}</div>
          <div class="item"><span>品牌：</span>${p.brand}</div>
          <div class="item"><span>类别：</span>${p.category}</div>
          <div class="item"><span>认证：</span>${p.certs.join("、")}</div>
        </div>
        <h3 style="font-size:15px;color:var(--green-dark);margin:18px 0 10px">🛰 全链路溯源</h3>
        <div class="timeline">
          ${p.journey.map(n => `
            <div class="tl-node ${n.status}">
              <div class="tl-title">${n.stage}</div>
              <div class="tl-meta">${n.time} · ${n.location} · ${n.operator}</div>
              <div class="tl-note">${n.note}</div>
            </div>`).join("")}
        </div>
      </div>
    </div>`;
}

/* 简单 HTML 转义，防止 XSS */
function esc(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* =========================================================
   5. 追踪监视
   ========================================================= */
let trackIndex = 0;
function renderTrack() {
  $("#trackBatchChips").innerHTML = PRODUCTS.map((p, i) =>
    `<span class="chip ${i === trackIndex ? "active" : ""}" data-i="${i}">${p.emoji} ${p.name}</span>`
  ).join("");

  $$("#trackBatchChips .chip").forEach(chip => {
    chip.addEventListener("click", () => {
      $$("#trackBatchChips .chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      trackIndex = Number(chip.dataset.i);
      drawTrackDetail();
    });
  });
  drawTrackDetail();
}

function drawTrackDetail() {
  const p = PRODUCTS[trackIndex];
  const current = p.journey.find(n => n.status === "current") || p.journey[0];

  $("#trackDetail").innerHTML = `
    <div class="card">
      <h3>🚚 批次实时状态</h3>
      <p style="margin-bottom:12px">
        <span class="status-pill running">● 运输中</span>
        <span class="muted small" style="margin-left:8px">${p.name} · 批次 ${p.traceCodes[0]}</span>
      </p>
      <div class="env-tiles">
        <div class="env-tile"><div class="v">${(4 + Math.random() * 2).toFixed(1)}℃</div><div class="k">车厢温度</div></div>
        <div class="env-tile"><div class="v">${(85 + Math.random() * 8).toFixed(0)}%</div><div class="k">环境湿度</div></div>
        <div class="env-tile"><div class="v">${(60 + Math.random() * 30).toFixed(0)} km/h</div><div class="k">当前车速</div></div>
        <div class="env-tile"><div class="v">${(3 + Math.random() * 2).toFixed(1)} 小时</div><div class="k">预计到达</div></div>
      </div>
      <p class="muted small" style="margin-top:12px">📍 当前位置：${current.location}（数据每 30 秒自动刷新）</p>
    </div>
    <div class="card">
      <h3>📋 批次档案</h3>
      <div class="info-grid">
        <div class="item"><span>产品名称：</span>${p.name}</div>
        <div class="item"><span>溯源码：</span>${p.traceCodes.join(" / ")}</div>
        <div class="item"><span>产地：</span>${p.origin}</div>
        <div class="item"><span>品牌：</span>${p.brand}</div>
        <div class="item"><span>当前环节：</span>${current.stage}</div>
        <div class="item"><span>负责人：</span>${current.operator}</div>
      </div>
    </div>
  `;

  $("#trackTimeline").innerHTML = p.journey.map(n => `
    <div class="tl-node ${n.status}">
      <div class="tl-title">${n.stage}${n.status === "current" ? ' <span class="status-pill running">当前</span>' : ""}</div>
      <div class="tl-meta">${n.time} · ${n.location} · ${n.operator}</div>
      <div class="tl-note">${n.note}</div>
    </div>
  `).join("");
}

/* =========================================================
   6. 数据统计（Chart.js）
   ========================================================= */
let charts = [];
function renderStats() {
  $("#statsCards").innerHTML = `
    <div class="stat-card"><div class="stat-icon">🥬</div><div><div class="num">${STATS.totalProducts}</div><div class="label">在库产品</div></div></div>
    <div class="stat-card"><div class="stat-icon">📦</div><div><div class="num">${STATS.traceBatches}</div><div class="label">溯源批次</div></div></div>
    <div class="stat-card"><div class="stat-icon">📷</div><div><div class="num">${STATS.todayScans}</div><div class="label">今日扫码</div></div></div>
    <div class="stat-card"><div class="stat-icon">🏅</div><div><div class="num">${STATS.certified}%</div><div class="label">认证覆盖率</div></div></div>
  `;

  $("#certStats").innerHTML = Object.entries(STATS.certDist).map(([k, v]) => {
    const total = Object.values(STATS.certDist).reduce((a, b) => a + b, 0);
    return `<div style="display:flex;align-items:center;margin-bottom:10px">
      <span style="width:90px;font-size:13px">${k}</span>
      <div style="flex:1;background:var(--bg);height:10px;border-radius:5px;overflow:hidden">
        <div style="width:${(v / total) * 100}%;height:100%;background:var(--green)"></div>
      </div>
      <span style="width:40px;text-align:right;font-size:13px">${v}%</span>
    </div>`;
  }).join("");

  if (typeof Chart === "undefined") {
    $$("#page-stats canvas").forEach(c => {
      c.parentNode.innerHTML += `<p class="muted small">图表库未加载（离线），请联网后刷新。</p>`;
    });
    return;
  }

  // 销毁旧图表，避免重复渲染叠加
  charts.forEach(c => c.destroy());
  charts = [];

  const catCount = {};
  PRODUCTS.forEach(p => (catCount[p.category] = (catCount[p.category] || 0) + 1));

  charts.push(new Chart($("#chartCategory"), {
    type: "bar",
    data: {
      labels: Object.keys(catCount),
      datasets: [{ label: "产品数量", data: Object.values(catCount), backgroundColor: "#66bb6a", borderRadius: 6 }],
    },
    options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } },
  }));

  charts.push(new Chart($("#chartSource"), {
    type: "doughnut",
    data: {
      labels: Object.keys(STATS.scanSource),
      datasets: [{ data: Object.values(STATS.scanSource), backgroundColor: ["#2e7d32", "#66bb6a", "#a5d6a7", "#f9a825"] }],
    },
    options: { plugins: { legend: { position: "bottom" } } },
  }));

  charts.push(new Chart($("#chartTrend"), {
    type: "line",
    data: {
      labels: ["6日前", "5日前", "4日前", "3日前", "2日前", "昨日", "今日"],
      datasets: [{
        label: "扫码次数",
        data: STATS.scanTrend,
        borderColor: "#2e7d32",
        backgroundColor: "rgba(46,125,50,0.12)",
        fill: true,
        tension: 0.35,
        pointBackgroundColor: "#2e7d32",
      }],
    },
    options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } },
  }));
}

/* =========================================================
   7. 新闻公告
   ========================================================= */
function renderNews() {
  const cats = ["全部", ...new Set(NEWS.map(n => n.category))];
  $("#newsCategoryChips").innerHTML = cats.map(c =>
    `<span class="chip ${c === "全部" ? "active" : ""}" data-cat="${c}">${c}</span>`
  ).join("");

  let activeCat = "全部";
  $$("#newsCategoryChips .chip").forEach(chip => {
    chip.addEventListener("click", () => {
      $$("#newsCategoryChips .chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      activeCat = chip.dataset.cat;
      drawNews();
    });
  });

  function drawNews() {
    const list = NEWS.filter(n => activeCat === "全部" || n.category === activeCat);
    $("#newsList").innerHTML = list.map(n => `
      <div class="news-card" data-id="${n.id}">
        <div class="news-meta">
          <span class="badge blue">${n.category}</span>
          <span>📅 ${n.date}</span>
        </div>
        <h4>${n.title}</h4>
        <div class="news-summary">${n.summary}</div>
        <div class="news-full">${n.full}</div>
      </div>
    `).join("");

    $$("#newsList .news-card").forEach(card => {
      card.addEventListener("click", () => card.classList.toggle("open"));
    });
  }
  drawNews();
}

/* =========================================================
   8. 用户交流社区
   ========================================================= */
const POST_KEY = "agri_posts";
let communityTab = "board";

function getPosts() {
  try { return JSON.parse(localStorage.getItem(POST_KEY)) || []; } catch (e) { return []; }
}
function savePosts(posts) {
  localStorage.setItem(POST_KEY, JSON.stringify(posts));
}

function renderCommunity() {
  $$("#communityTabs .tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      $$("#communityTabs .tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      communityTab = btn.dataset.tab;
      drawPosts();
    });
  });

  $("#postSubmitBtn").addEventListener("click", () => {
    const content = $("#postInput").value.trim();
    if (!content) { alert("请先输入内容"); return; }
    const posts = getPosts();
    posts.unshift({
      id: Date.now(),
      type: communityTab,
      nickname: currentUser.nickname || currentUser.username,
      role: currentUser.role || "普通用户",
      time: new Date().toLocaleString(),
      content,
      likes: 0,
    });
    savePosts(posts);
    $("#postInput").value = "";
    drawPosts();
  });

  drawPosts();
}

function drawPosts() {
  const posts = getPosts().filter(p => p.type === communityTab);
  $("#communityList").innerHTML = posts.length
    ? posts.map(p => `
      <div class="post-item" data-id="${p.id}">
        <div class="post-head">
          <span class="avatar">${esc(p.nickname.slice(0, 1))}</span>
          <div>
            <strong>${esc(p.nickname)}</strong>
            <span class="badge ${p.type === "topic" ? "tag-topic" : "tag-board"}" style="margin-left:6px">${p.type === "topic" ? "话题" : "留言"}</span>
            <div class="time">${p.time}</div>
          </div>
        </div>
        <div class="post-content">${esc(p.content)}</div>
        ${(p.replies || []).map(r => `
          <div class="post-reply"><b>${esc(r.nickname)}</b>：${esc(r.content)}<span class="muted small" style="margin-left:6px">${r.time}</span></div>
        `).join("")}
        <div class="post-foot">
          <button data-like="${p.id}">👍 赞 ${p.likes || ""}</button>
          <button data-reply="${p.id}">💬 回复${(p.replies || []).length ? " (" + p.replies.length + ")" : ""}</button>
        </div>
        <div class="reply-box hidden" data-replybox="${p.id}">
          <input type="text" class="reply-input" placeholder="写下您的回复..." />
          <button class="btn btn-primary btn-sm" data-send="${p.id}">发送</button>
        </div>
      </div>`).join("")
    : `<p class="muted">暂无内容，快来发布第一条${communityTab === "topic" ? "话题" : "留言"}吧～</p>`;

  $$("#communityList [data-like]").forEach(btn => {
    btn.addEventListener("click", () => {
      const posts = getPosts();
      const p = posts.find(x => x.id === Number(btn.dataset.like));
      if (p) { p.likes = (p.likes || 0) + 1; savePosts(posts); drawPosts(); }
    });
  });

  $$("#communityList [data-reply]").forEach(btn => {
    btn.addEventListener("click", () => {
      const box = document.querySelector(`[data-replybox="${btn.dataset.reply}"]`);
      if (box) box.classList.toggle("hidden");
    });
  });

  $$("#communityList [data-send]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.send);
      const input = document.querySelector(`[data-replybox="${id}"] .reply-input`);
      const content = (input ? input.value : "").trim();
      if (!content) { alert("请先输入回复内容"); return; }
      const posts = getPosts();
      const p = posts.find(x => x.id === id);
      if (p) {
        p.replies = p.replies || [];
        p.replies.push({ nickname: currentUser.nickname || currentUser.username, content, time: new Date().toLocaleString() });
        savePosts(posts);
        drawPosts();
      }
    });
  });
}

/* =========================================================
   初始化（仅当已登录时执行）
   ========================================================= */
if (currentUser) {
  initShell();
  renderOverview();
  renderProducts();
  initScan();
  renderTrack();
  renderNews();
  renderCommunity();

  // 点击遮罩空白处关闭弹窗
  $("#modalMask").addEventListener("click", (e) => {
    if (e.target === $("#modalMask")) closeModal();
  });

  // 追踪监视：环境数据每 30 秒自动刷新（仅当追踪页可见时）
  setInterval(() => {
    if ($("#page-track").classList.contains("active")) drawTrackDetail();
  }, 30000);
}
