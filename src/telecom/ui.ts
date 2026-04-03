import { navItems, workspaceTitles, type WorkspaceKey } from "./data";
import type { SessionUser } from "./state";

export const appCss = `
:root { color-scheme: dark; --bg:#060c1b; --panel:#101a35; --panelSoft:#111f3f; --line:#253a68; --text:#e8efff; --muted:#95a8ce; --brand:#4ab8ff; --warn:#fbbf24; --danger:#fb7185; --ok:#34d399; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
* { box-sizing: border-box; }
body { margin:0; background:linear-gradient(180deg,#09122a,#060c1b 35%); color:var(--text); }
a { color: inherit; text-decoration: none; }
.app-shell { display:grid; grid-template-columns:240px minmax(0,1fr); min-height:100vh; }
.sidebar { border-right:1px solid var(--line); padding:1rem; background:#0a1330; position:sticky; top:0; align-self:start; height:100vh; overflow:auto; }
.brand { color:var(--brand); font-size:.86rem; letter-spacing:.11em; text-transform:uppercase; margin-bottom:.8rem; }
.nav-link { display:block; padding:.55rem .65rem; border:1px solid transparent; border-radius:10px; font-size:.92rem; margin-bottom:.45rem; color:var(--muted); }
.nav-link.active { background:rgba(74,184,255,.13); border-color:var(--line); color:var(--text); }
.content { padding:1rem; overflow:auto; }
.topbar { display:flex; flex-wrap:wrap; justify-content:space-between; gap:.8rem; margin-bottom:1rem; }
.panel { background:linear-gradient(180deg,var(--panel),var(--panelSoft)); border:1px solid var(--line); border-radius:12px; padding:.9rem; }
.title { font-size:1.2rem; margin:0; }
.muted { color:var(--muted); font-size:.85rem; }
.quick-actions { display:flex; flex-wrap:wrap; gap:.4rem; }
.chip { font-size:.74rem; border:1px solid var(--line); border-radius:999px; padding:.2rem .55rem; background:#0a1430; color:var(--muted); }
.grid { display:grid; gap:.8rem; }
.grid.kpi { grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); }
.kpi .value { font-size:1.3rem; font-weight:700; }
.table-wrap { overflow:auto; border:1px solid var(--line); border-radius:10px; }
table { width:100%; border-collapse:collapse; min-width:720px; }
th,td { padding:.55rem .6rem; border-bottom:1px solid #223357; font-size:.82rem; text-align:left; }
th { color:#a7bee6; font-size:.72rem; text-transform:uppercase; letter-spacing:.05em; background:#0b1634; position:sticky; top:0; }
.filters { display:flex; flex-wrap:wrap; gap:.45rem; margin-bottom:.6rem; }
.filter, button, input, select { border:1px solid var(--line); background:#0a1430; color:var(--text); padding:.45rem .55rem; border-radius:8px; font-size:.8rem; }
input, select { width:100%; }
.split { display:grid; grid-template-columns:2fr 1fr; gap:.8rem; }
.stack { display:grid; gap:.7rem; }
.alert { border:1px solid #8b3348; background:rgba(251,113,133,.1); border-radius:10px; padding:.65rem; font-size:.8rem; }
.ok { border-color:#1d6a52; background:rgba(52,211,153,.12); }
.warn { border-color:#856310; background:rgba(251,191,36,.10); }
.form-grid { display:grid; gap:.5rem; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); }
@media (max-width:1100px){ .app-shell,.split{grid-template-columns:1fr;} .sidebar{position:relative;height:auto;} }
`;

export const renderAppShell = (workspace: WorkspaceKey, user: SessionUser, body: string) => `<!doctype html><html><head><meta charset='utf-8'/><meta name='viewport' content='width=device-width,initial-scale=1'/><title>CrewProof · ${workspaceTitles[workspace]}</title><link rel='stylesheet' href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'/><style>${appCss}</style></head><body><main class='app-shell'><aside class='sidebar'><p class='brand'>CrewProof</p>${navItems
	.map((item) => `<a class='nav-link ${item.key === workspace ? "active" : ""}' href='/app/${item.key}'>${item.label}</a>`)
	.join("")}<div class='panel'><p class='muted'>Signed in as</p><p>${user.email}</p><p class='chip'>role: ${user.role}</p><p class='chip'>selected job: ${user.selectedJobId}</p><div class='quick-actions' style='margin-top:.5rem;'><a class='filter' href='/auth/logout'>Logout</a></div></div>${user.demoAllowed ? `<div class='panel' style='margin-top:.7rem;'><form method='post' action='/api/demo-mode'><input type='hidden' name='mode' value='${user.demoMode ? "off" : "on"}'/><button type='submit'>Demo mode: ${user.demoMode ? "ON (click to disable)" : "OFF (click to enable)"}</button></form></div>` : ""}</aside><section class='content'>${body}</section></main><script src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'></script><script>if (window.location.search.includes('uploaded=1')) { const n = document.getElementById('upload-ok'); if (n) n.style.display='block';}</script></body></html>`;

export const topbar = (workspace: WorkspaceKey, user: SessionUser) => `<header class='topbar'><div><h1 class='title'>${workspaceTitles[workspace]}</h1><p class='muted'>Stable internal web workflow · selected job ${user.selectedJobId}</p></div><div class='quick-actions'><a class='filter' href='/app/jobs'>Open Jobs</a><a class='filter' href='/app/documents'>Open Documents</a><a class='filter' href='/app/maps'>Open Map</a><a class='filter' href='/app/closeout'>Open Closeout</a></div></header>`;

export const kpiCard = (label: string, value: string, meta: string) => `<article class='panel kpi'><p class='muted'>${label}</p><p class='value'>${value}</p><p class='muted'>${meta}</p></article>`;
