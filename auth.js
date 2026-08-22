/* =========================================================
   认证模块 - 登录 / 注册 / 会话管理
   数据存储于浏览器 localStorage（纯前端演示）
   ========================================================= */

const AUTH_KEYS = {
  users: "agri_users",
  current: "agri_current_user",
};

/* ---------- 初始化默认账号 ---------- */
function ensureDefaultUsers() {
  let users = getUsers();
  if (users.length === 0) {
    users = [
      { username: "admin", password: "123456", nickname: "管理员", role: "管理员" },
      { username: "user",  password: "123456", nickname: "农小真", role: "普通用户" },
    ];
    localStorage.setItem(AUTH_KEYS.users, JSON.stringify(users));
  }
  return users;
}

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEYS.users)) || [];
  } catch (e) {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(AUTH_KEYS.users, JSON.stringify(users));
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEYS.current)) || null;
  } catch (e) {
    return null;
  }
}

function setCurrentUser(user) {
  localStorage.setItem(AUTH_KEYS.current, JSON.stringify(user));
}

function clearCurrentUser() {
  localStorage.removeItem(AUTH_KEYS.current);
}

/* ---------- 业务逻辑 ---------- */
function register(username, nickname, password) {
  const users = getUsers();
  if (users.some(u => u.username === username)) {
    return { ok: false, msg: "用户名已存在，请更换后重试" };
  }
  users.push({ username, password, nickname: nickname || username, role: "普通用户" });
  saveUsers(users);
  return { ok: true, msg: "注册成功，请登录" };
}

function login(username, password) {
  const users = getUsers();
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    return { ok: false, msg: "用户名或密码错误" };
  }
  // 会话中不保存密码
  setCurrentUser({ username: user.username, nickname: user.nickname, role: user.role });
  return { ok: true, msg: "登录成功" };
}

function logout() {
  clearCurrentUser();
}

/* =========================================================
   页面初始化逻辑（仅在登录页执行）
   ========================================================= */
if (document.getElementById("loginForm")) {
  ensureDefaultUsers();
  const msgEl = document.getElementById("loginMsg");

  // Tab 切换
  document.querySelectorAll(".login-tabs .tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".login-tabs .tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const isLogin = btn.dataset.tab === "login";
      document.getElementById("loginForm").classList.toggle("hidden", !isLogin);
      document.getElementById("registerForm").classList.toggle("hidden", isLogin);
      msgEl.textContent = "";
      msgEl.className = "form-msg";
    });
  });

  // 登录提交
  document.getElementById("loginForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("loginUser").value.trim();
    const password = document.getElementById("loginPass").value;
    if (!username || !password) return showMsg("请输入用户名和密码", false);
    const res = login(username, password);
    if (res.ok) {
      showMsg("登录成功，正在进入系统...", true);
      setTimeout(() => (location.href = "app.html"), 500);
    } else {
      showMsg(res.msg, false);
    }
  });

  // 注册提交
  document.getElementById("registerForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("regUser").value.trim();
    const nickname = document.getElementById("regNick").value.trim();
    const password = document.getElementById("regPass").value;
    const password2 = document.getElementById("regPass2").value;

    if (username.length < 3 || username.length > 16) return showMsg("用户名需为 3-16 位字符", false);
    if (password.length < 6) return showMsg("密码至少 6 位", false);
    if (password !== password2) return showMsg("两次输入的密码不一致", false);

    const res = register(username, nickname, password);
    if (res.ok) {
      showMsg("注册成功，请切换到登录页", true);
      document.getElementById("registerForm").reset();
    } else {
      showMsg(res.msg, false);
    }
  });

  function showMsg(text, ok) {
    msgEl.textContent = text;
    msgEl.className = "form-msg " + (ok ? "ok" : "err");
  }
}
