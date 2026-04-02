import { roles, tiers, workspaceTitles, type WorkspaceKey } from "./data";

const navItems: Array<{ key: WorkspaceKey; label: string }> = [
	{ key: "dashboard", label: "Dashboard" },
	{ key: "jobs", label: "Jobs" },
	{ key: "811", label: "811" },
	{ key: "permits", label: "Permits" },
	{ key: "documents", label: "Documents" },
	{ key: "spreadsheets", label: "Spreadsheets" },
	{ key: "maps", label: "Maps" },
	{ key: "viewer", label: "Viewer" },
	{ key: "dispatch", label: "Dispatch" },
	{ key: "billing", label: "Billing" },
	{ key: "reporting", label: "Reporting" },
	{ key: "onboarding", label: "Onboarding" },
	{ key: "messaging", label: "Email Hub" },
	{ key: "profile", label: "Profile" },
	{ key: "admin", label: "Admin" },
];

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
.chip.priority-Critical, .chip.risk-High { border-color:#8f2940; color:#ffb4c2; }
.chip.priority-High, .chip.risk-Moderate { border-color:#7a5a1b; color:#ffd98a; }
.chip.priority-Medium, .chip.risk-Low { border-color:#256184; color:#9fdfff; }
.grid { display:grid; gap:.8rem; }
.grid.kpi { grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); }
.kpi .value { font-size:1.3rem; font-weight:700; }
.table-wrap { overflow:auto; border:1px solid var(--line); border-radius:10px; }
table { width:100%; border-collapse:collapse; min-width:900px; }
th,td { padding:.55rem .6rem; border-bottom:1px solid #223357; font-size:.82rem; text-align:left; }
th { color:#a7bee6; font-size:.72rem; text-transform:uppercase; letter-spacing:.05em; background:#0b1634; position:sticky; top:0; }
.filters { display:flex; flex-wrap:wrap; gap:.45rem; margin-bottom:.6rem; }
.filter { border:1px solid var(--line); background:#0a1430; color:var(--muted); padding:.4rem .5rem; border-radius:8px; font-size:.78rem; }
.split { display:grid; grid-template-columns:2fr 1fr; gap:.8rem; }
.stack { display:grid; gap:.7rem; }
.alert { border:1px solid #8b3348; background:rgba(251,113,133,.1); border-radius:10px; padding:.65rem; font-size:.8rem; }
.timeline li { margin-bottom:.45rem; color:var(--muted); }
.hero { padding:1.2rem; background:linear-gradient(130deg,#101f46,#071029); border:1px solid var(--line); border-radius:14px; }
.hero-grid { display:grid; grid-template-columns:220px 1fr 260px; gap:.7rem; margin-top:.8rem; }
.hero-box { border:1px solid var(--line); border-radius:10px; padding:.6rem; background:#08122e; min-height:120px; }
@media (max-width:1100px){ .app-shell,.hero-grid,.split{grid-template-columns:1fr;} .sidebar{position:relative;height:auto;} table{min-width:760px;} }
`;

export const renderAppShell = (workspace: WorkspaceKey, body: string) => `<!doctype html><html><head><meta charset='utf-8'/><meta name='viewport' content='width=device-width,initial-scale=1'/><title>CrewProof · ${workspaceTitles[workspace]}</title><style>${appCss}</style></head><body><main class='app-shell'><aside class='sidebar'><p class='brand'>CrewProof Telecom</p>${navItems
	.map((item) => `<a class='nav-link ${item.key === workspace ? "active" : ""}' href='/app/${item.key}'>${item.label}</a>`)
	.join("")}<div class='panel'><p class='muted'>Role Access</p><div class='quick-actions'>${roles.map((r) => `<span class='chip'>${r}</span>`).join("")}</div></div><div class='panel' style='margin-top:.7rem;'><p class='muted'>Tier Access</p><div class='quick-actions'>${tiers.map((t) => `<span class='chip'>${t}</span>`).join("")}</div></div></aside><section class='content'>${body}</section></main></body></html>`;

export const topbar = (workspace: WorkspaceKey) => `<header class='topbar'><div><h1 class='title'>${workspaceTitles[workspace]}</h1><p class='muted'>Market: Phoenix East · Search jobs, permits, locate tickets, documents, spreadsheets</p></div><div class='stack'><div class='quick-actions'>${["New Job", "New Locate Ticket", "Upload Print", "Open Map Workspace", "Create Spreadsheet", "Assign Crew", "Approve Job"].map((a) => `<button class='filter'>${a}</button>`).join("")}</div><div class='quick-actions'><span class='chip'>User: technical_admin</span><span class='chip'>Market Selector Placeholder</span></div></div></header>`;

export const kpiCard = (label: string, value: string, meta: string) => `<article class='panel kpi'><p class='muted'>${label}</p><p class='value'>${value}</p><p class='muted'>${meta}</p></article>`;

export const statusChip = (value: string) => `<span class='chip'>${value}</span>`;
export const priorityBadge = (value: string) => `<span class='chip priority-${value}'>${value}</span>`;
export const riskBadge = (value: string) => `<span class='chip risk-${value}'>${value}</span>`;
