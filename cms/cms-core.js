// NEXUS CMS Shared JS - API-backed version
(function createNexusCMS() {
  const TOKEN_KEY = "nexus_token";
  const USER_KEY = "nexus_user";
  const API_ROOT = "/api";

  const NAV_LINKS = [
    { id: "dashboard", label: "Dashboard", href: "dashboard.html", roles: ["viewer", "organiser", "superadmin"] },
    { id: "registrations", label: "Registrations", href: "registrations.html", roles: ["viewer", "organiser", "superadmin"] },
    { id: "scores", label: "Scores", href: "scores.html", roles: ["viewer", "organiser", "superadmin"] },
    { id: "championship", label: "Championship", href: "championship.html", roles: ["viewer", "organiser", "superadmin"] },
    { id: "events", label: "Events", href: "events.html", roles: ["superadmin"] },
    { id: "about", label: "About Us", href: "about.html", roles: ["superadmin"] },
    { id: "timeline", label: "Timeline", href: "timeline.html", roles: ["superadmin"] },
    { id: "settings", label: "Page Settings", href: "settings.html", roles: ["superadmin"] },
    { id: "users", label: "Users", href: "users.html", roles: ["superadmin"] },
    { id: "audit", label: "Audit Log", href: "audit.html", roles: ["superadmin"] }
  ];

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getToken() {
    return sessionStorage.getItem(TOKEN_KEY) || "";
  }

  function getStoredUser() {
    try {
      return JSON.parse(sessionStorage.getItem(USER_KEY) || "null");
    } catch (error) {
      return null;
    }
  }

  function setSession(token, user) {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  function clearSession() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  }

  async function request(path, options) {
    const config = Object.assign({ method: "GET" }, options || {});
    const headers = Object.assign({}, config.headers || {});
    const token = getToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    if (config.body && !(config.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
      config.body = JSON.stringify(config.body);
    }

    const response = await fetch(`${API_ROOT}${path}`, Object.assign({}, config, { headers }));
    const raw = await response.text();
    const data = raw ? JSON.parse(raw) : {};

    if (!response.ok) {
      if (response.status === 401) {
        clearSession();
      }

      const error = new Error(data.message || "Request failed");
      error.status = response.status;
      throw error;
    }

    return data;
  }

  function showToast(message, type) {
    let toast = document.getElementById("cmsToast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "cmsToast";
      document.body.appendChild(toast);
    }

    toast.innerHTML = `<span>${type === "error" ? "x" : "ok"}</span> ${escapeHtml(message)}`;
    toast.className = `cms-toast ${type || "success"}`;
    toast.style.cssText = `position:fixed;bottom:24px;right:24px;background:${type === "error" ? "#1a0a0a" : "#111827"};border:1px solid ${type === "error" ? "rgba(230,60,92,0.3)" : "rgba(245,166,35,0.3)"};border-radius:12px;padding:14px 20px;z-index:9999;font-size:14px;display:flex;align-items:center;gap:10px;font-family:'DM Sans',sans-serif;color:#f0f0f0;transform:translateY(100px);opacity:0;transition:all 0.35s ease`;
    setTimeout(() => {
      toast.style.transform = "translateY(0)";
      toast.style.opacity = "1";
    }, 10);
    setTimeout(() => {
      toast.style.transform = "translateY(100px)";
      toast.style.opacity = "0";
    }, 3000);
  }

  function canAccess(user, allowedRoles) {
    return !!user && allowedRoles.includes(user.role);
  }

  function renderSidebar(active) {
    const user = getStoredUser() || {};
    const links = NAV_LINKS.filter((link) => canAccess(user, link.roles));

    return `
      <aside class="cms-sidebar">
        <div class="cms-logo">
          <div class="cms-logo-mark">N</div>
          <div>
            <div class="cms-logo-text">NEXUS CMS</div>
            <div class="cms-logo-sub">Admin Panel</div>
          </div>
        </div>
        <nav class="cms-nav">
          ${links
            .map(
              (link) =>
                `<a href="${link.href}" class="cms-nav-item ${active === link.id ? "active" : ""}">${escapeHtml(link.label)}</a>`
            )
            .join("")}
        </nav>
        <div class="cms-user-info">
          <div class="cms-user-avatar">${escapeHtml((user.name || "A").slice(0, 1).toUpperCase())}</div>
          <div>
            <div class="cms-user-name">${escapeHtml(user.name || "Admin")}</div>
            <div class="cms-user-role">${escapeHtml(user.role || "")}</div>
          </div>
          <button onclick="logout()" class="cms-logout-btn" title="Logout">Out</button>
        </div>
      </aside>
    `;
  }

  async function login(username, password) {
    const data = await request("/auth/login", {
      method: "POST",
      body: { username, password }
    });

    setSession(data.token, data.user);
    return data.user;
  }

  async function getCurrentUser() {
    const token = getToken();
    if (!token) {
      return null;
    }

    const data = await request("/auth/me");
    sessionStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data.user;
  }

  async function initPage(active, options) {
    const config = Object.assign({ requiredRoles: null }, options || {});
    const styleEl = document.getElementById("cmsStyle");
    if (styleEl) {
      styleEl.textContent = CMS_CSS;
    }

    let user;
    try {
      user = await getCurrentUser();
    } catch (error) {
      window.location.href = "login.html";
      return null;
    }

    if (!user) {
      window.location.href = "login.html";
      return null;
    }

    if (config.requiredRoles && !config.requiredRoles.includes(user.role)) {
      showToast("You do not have access to this page.", "error");
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 500);
      return null;
    }

    const sidebarContainer = document.getElementById("sidebarContainer");
    if (sidebarContainer) {
      sidebarContainer.innerHTML = renderSidebar(active);
    }

    return user;
  }

  async function fetchRegistrations() {
    const data = await request("/cms/registrations");
    return data.registrations || [];
  }

  async function fetchScores() {
    const data = await request("/cms/scores");
    return data.scores || {};
  }

  async function saveEventScores(eventKey, payload) {
    await request(`/cms/scores/${encodeURIComponent(eventKey)}`, {
      method: "PUT",
      body: payload
    });
  }

  async function fetchAuditLog() {
    const data = await request("/cms/audit");
    return data.logs || [];
  }

  async function addAuditLog(action) {
    await request("/cms/audit", {
      method: "POST",
      body: { action }
    });
  }

  async function clearAuditLog() {
    await request("/cms/audit", {
      method: "DELETE"
    });
  }

  async function fetchUsers() {
    const data = await request("/cms/users");
    return data.users || [];
  }

  async function createUser(payload) {
    const data = await request("/cms/users", {
      method: "POST",
      body: payload
    });
    return data.user;
  }

  async function updateUser(id, payload) {
    const data = await request(`/cms/users/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: payload
    });
    return data.user;
  }

  async function deleteUser(id) {
    await request(`/cms/users/${encodeURIComponent(id)}`, {
      method: "DELETE"
    });
  }

  async function fetchSettings() {
    const data = await request("/cms/settings");
    return data.settings || {};
  }

  async function updateSettings(payload) {
    await request("/cms/settings", {
      method: "PUT",
      body: payload
    });
  }

  async function uploadImage(file) {
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch(`${API_ROOT}/cms/uploads/site-image`, {
      method: "POST",
      headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
      body: formData
    });
    const raw = await response.text();
    const data = raw ? JSON.parse(raw) : {};

    if (!response.ok) {
      const error = new Error(data.message || "Upload failed");
      error.status = response.status;
      throw error;
    }

    return data.imageUrl;
  }

  async function uploadTeamImage(file) {
    return uploadImage(file);
  }

  async function fetchTimeline() {
    const data = await request("/cms/timeline");
    return data.timeline || [];
  }

  async function updateTimeline(timeline) {
    await request("/cms/timeline", {
      method: "PUT",
      body: { timeline }
    });
  }

  function logout() {
    clearSession();
    window.location.href = "login.html";
  }

  function isViewer(user) {
    return !!user && user.role === "viewer";
  }

  window.NexusCMS = {
    addAuditLog,
    clearAuditLog,
    createUser,
    deleteUser,
    fetchAuditLog,
    fetchRegistrations,
    fetchScores,
    fetchSettings,
    fetchTimeline,
    fetchUsers,
    getStoredUser,
    initPage,
    isViewer,
    login,
    logout,
    saveEventScores,
    showToast,
    updateSettings,
    uploadImage,
    uploadTeamImage,
    updateTimeline,
    updateUser
  };

  window.logout = logout;
  window.showToast = showToast;
})();

const CMS_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
  :root{--bg:#060810;--bg2:#0b0f1a;--surface:#111827;--surface2:#1a2235;--accent:#f5a623;--accent2:#e63c5c;--accent3:#00d4ff;--text:#f0f0f0;--muted:#7a8499;--border:rgba(255,255,255,0.07)}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);display:flex;min-height:100vh}
  .cms-sidebar{width:240px;background:var(--bg2);border-right:1px solid var(--border);display:flex;flex-direction:column;padding:24px 0;flex-shrink:0;position:fixed;top:0;bottom:0;left:0;z-index:100}
  .cms-logo{display:flex;align-items:center;gap:12px;padding:0 20px 24px;border-bottom:1px solid var(--border)}
  .cms-logo-mark{width:36px;height:36px;background:linear-gradient(135deg,#f5a623,#e63c5c);border-radius:8px;display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-weight:800;font-size:16px;color:#000;flex-shrink:0}
  .cms-logo-text{font-family:'Syne',sans-serif;font-weight:800;font-size:14px}
  .cms-logo-sub{font-size:10px;color:var(--muted)}
  .cms-nav{flex:1;padding:16px 12px;display:flex;flex-direction:column;gap:2px}
  .cms-nav-item{display:flex;align-items:center;padding:10px 12px;border-radius:8px;text-decoration:none;color:var(--muted);font-size:13px;font-weight:500;transition:all 0.2s}
  .cms-nav-item:hover{background:rgba(255,255,255,0.04);color:var(--text)}
  .cms-nav-item.active{background:rgba(245,166,35,0.1);color:var(--accent);border:1px solid rgba(245,166,35,0.15)}
  .cms-user-info{display:flex;align-items:center;gap:10px;padding:16px 20px;border-top:1px solid var(--border)}
  .cms-user-avatar{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-weight:800;font-size:13px;color:#000;flex-shrink:0}
  .cms-user-name{font-size:13px;font-weight:600}
  .cms-user-role{font-size:10px;color:var(--muted);text-transform:capitalize}
  .cms-logout-btn{margin-left:auto;background:none;border:none;color:var(--muted);font-size:12px;cursor:pointer;transition:color 0.2s;padding:4px}
  .cms-logout-btn:hover{color:var(--accent2)}
  .cms-main{flex:1;margin-left:240px;padding:32px;overflow-y:auto}
  .cms-header{margin-bottom:32px}
  .cms-header h1{font-family:'Syne',sans-serif;font-size:28px;font-weight:800;line-height:1}
  .cms-header p{color:var(--muted);font-size:14px;margin-top:6px}
  .cms-card{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:24px}
  .cms-card-title{font-family:'Syne',sans-serif;font-size:15px;font-weight:700;margin-bottom:16px}
  .cms-table{width:100%;border-collapse:collapse;font-size:13px}
  .cms-table th{text-align:left;padding:10px 14px;border-bottom:1px solid var(--border);font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:var(--muted)}
  .cms-table td{padding:12px 14px;border-bottom:1px solid rgba(255,255,255,0.03)}
  .cms-table tr:last-child td{border-bottom:none}
  .cms-table tr:hover td{background:rgba(255,255,255,0.02)}
  .badge{padding:3px 10px;border-radius:100px;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase}
  .badge-gold{background:rgba(245,166,35,0.15);color:#f5a623}
  .badge-blue{background:rgba(0,212,255,0.1);color:#00d4ff}
  .badge-red{background:rgba(230,60,92,0.1);color:#e63c5c}
  .badge-green{background:rgba(16,185,129,0.1);color:#10b981}
  .badge-purple{background:rgba(168,85,247,0.1);color:#a855f7}
  .cms-btn{padding:10px 20px;border-radius:8px;font-family:'Syne',sans-serif;font-weight:700;font-size:13px;border:none;cursor:pointer;transition:all 0.2s}
  .cms-btn-primary{background:var(--accent);color:#000}
  .cms-btn-primary:hover{background:#ffc107;transform:translateY(-1px)}
  .cms-btn-danger{background:rgba(230,60,92,0.1);color:#e63c5c;border:1px solid rgba(230,60,92,0.2)}
  .cms-btn-danger:hover{background:rgba(230,60,92,0.2)}
  .cms-btn-sm{padding:6px 14px;font-size:11px}
  .stat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px;margin-bottom:28px}
  .stat-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:20px}
  .stat-card-num{font-family:'Syne',sans-serif;font-size:32px;font-weight:800;color:var(--accent);line-height:1}
  .stat-card-label{font-size:12px;color:var(--muted);margin-top:4px}
  .form-group{margin-bottom:16px}
  .form-group label{display:block;font-size:11px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;color:var(--muted);margin-bottom:6px}
  .form-group input,.form-group select,.form-group textarea{width:100%;background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:8px;padding:12px 14px;color:var(--text);font-family:'DM Sans',sans-serif;font-size:14px;outline:none;transition:all 0.2s}
  .form-group input:focus,.form-group select:focus,.form-group textarea:focus{border-color:rgba(245,166,35,0.4)}
  .form-group select{background:rgba(17,24,39,0.8);color:#f0f0f0}
  .form-group select option{background:#111827;color:#f0f0f0;font-weight:500}
  .form-group select option:checked{background:linear-gradient(135deg,#f5a623,#d4890f);color:#000}
  .form-row{display:grid;grid-template-columns:1fr 1fr;gap:16px}
  .section-divider{border:none;border-top:1px solid var(--border);margin:24px 0}
  @media(max-width:768px){.cms-sidebar{transform:translateX(-100%);transition:transform 0.3s}.cms-main{margin-left:0}}
`;
