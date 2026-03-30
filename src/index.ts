import { Container, getContainer, getRandom } from "@cloudflare/containers";
import type { Context, Next } from "hono";
import { Hono } from "hono";

const JSON_BODY_LIMIT_BYTES = 100_000;

const dashboardData = {
	navSections: [
		{
			title: "Project Workspace",
			items: [
				"Jobs",
				"Statuses",
				"Documents",
				"Extracted Emails",
				"Spreadsheets",
				"CrewProof Data",
			],
		},
		{
			title: "Field & Compliance",
			items: ["811 Data", "Inspections", "Permits", "Redlines"],
		},
	],
	roles: [
		"technical_admin",
		"admin",
		"project_manager",
		"area_manager",
		"crew",
		"contractor",
		"customer_viewer",
	],
	tiers: ["starter", "pro", "enterprise"],
	actions: [
		"Create Job",
		"Open Permit Packet",
		"Review 811 Tickets",
		"Download Daily Summary",
	],
};

const renderDashboard = () => `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CrewProof Project Overview</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #080d1f;
      --panel: #0f1732;
      --panel-soft: #121d3f;
      --text: #ecf2ff;
      --text-soft: #9db0d3;
      --line: #243561;
      --accent: #49b9ff;
      --accent-soft: rgba(73, 185, 255, 0.18);
      --ok: #34d399;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      background: radial-gradient(circle at 25% 0%, #1a2f61 0, var(--bg) 45%);
      color: var(--text);
    }

    .dashboard {
      display: grid;
      grid-template-columns: 260px minmax(0, 1fr) 320px;
      gap: 1rem;
      padding: 1rem;
      min-height: 100vh;
    }

    .panel {
      background: linear-gradient(180deg, var(--panel), var(--panel-soft));
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 1rem;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25);
    }

    h1, h2, h3, p { margin: 0; }
    h2 { font-size: 1.05rem; margin-bottom: 0.75rem; }

    .brand {
      font-size: 0.95rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--accent);
      margin-bottom: 1rem;
    }

    .project-title {
      font-size: 1.1rem;
      margin-bottom: 0.3rem;
    }

    .subtle {
      color: var(--text-soft);
      font-size: 0.85rem;
    }

    .section + .section { margin-top: 1rem; }

    .nav-list {
      display: grid;
      gap: 0.45rem;
      margin-top: 0.5rem;
      padding: 0;
      list-style: none;
    }

    .nav-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 0.55rem 0.65rem;
      background: rgba(3, 9, 24, 0.25);
      font-size: 0.9rem;
    }

    .count {
      color: var(--text-soft);
      font-size: 0.78rem;
    }

    .center-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.8rem;
    }

    .badge-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.45rem;
      margin-top: 0.55rem;
    }

    .badge {
      border-radius: 999px;
      border: 1px solid var(--line);
      padding: 0.24rem 0.58rem;
      font-size: 0.75rem;
      color: var(--text-soft);
      background: rgba(4, 10, 25, 0.45);
    }

    .map {
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 0.8rem;
      min-height: 420px;
      background:
        linear-gradient(rgba(73, 185, 255, 0.08) 1px, transparent 1px) 0 0 / 26px 26px,
        linear-gradient(90deg, rgba(73, 185, 255, 0.08) 1px, transparent 1px) 0 0 / 26px 26px,
        radial-gradient(circle at 75% 20%, rgba(73, 185, 255, 0.2), transparent 40%),
        #07112a;
      position: relative;
      overflow: hidden;
    }

    .node {
      position: absolute;
      border-radius: 10px;
      border: 1px solid rgba(73, 185, 255, 0.4);
      background: rgba(8, 26, 58, 0.9);
      padding: 0.45rem 0.55rem;
      min-width: 120px;
      font-size: 0.8rem;
    }

    .node::before {
      content: "";
      position: absolute;
      top: 50%;
      left: -18px;
      width: 16px;
      border-top: 1px dashed rgba(73, 185, 255, 0.45);
    }

    .node strong { display: block; font-size: 0.82rem; }
    .node span { color: var(--text-soft); font-size: 0.73rem; }

    .insight {
      margin-top: 0.75rem;
      padding: 0.7rem;
      border-radius: 10px;
      border: 1px solid rgba(52, 211, 153, 0.3);
      background: rgba(52, 211, 153, 0.1);
      font-size: 0.83rem;
    }

    .controls { display: grid; gap: 0.8rem; }

    .field label {
      display: block;
      font-size: 0.78rem;
      color: var(--text-soft);
      margin-bottom: 0.35rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .field select, .btn {
      width: 100%;
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 0.58rem 0.65rem;
      color: var(--text);
      background: #0a1430;
      font: inherit;
    }

    .btn {
      text-align: left;
      cursor: pointer;
      background: linear-gradient(180deg, #10204a, #0b1838);
    }

    .btn:hover { border-color: var(--accent); }

    @media (max-width: 1100px) {
      .dashboard { grid-template-columns: 1fr; }
      .map { min-height: 300px; }
    }
  </style>
</head>
<body>
  <main class="dashboard" aria-label="CrewProof project overview dashboard">
    <aside class="panel">
      <p class="brand">CrewProof</p>
      <h1 class="project-title">Fiber Expansion · Region 12</h1>
      <p class="subtle">Telecom construction overview</p>
      ${dashboardData.navSections
			.map(
				(section) => `<section class="section">
        <h2>${section.title}</h2>
        <ul class="nav-list">
          ${section.items
						.map(
							(item, index) => `<li class="nav-item">${item}<span class="count">${index + 2}</span></li>`,
						)
						.join("")}
        </ul>
      </section>`,
			)
			.join("")}
    </aside>

    <section class="panel">
      <div class="center-header">
        <div>
          <h2>Overview Map</h2>
          <p class="subtle">Plant progress, permits, and risk zones</p>
        </div>
        <span class="badge">Live sync · 2m</span>
      </div>

      <div class="map" role="img" aria-label="Telecom project area map with workflow nodes">
        <div class="node" style="top:12%;left:10%;"><strong>Job Intake</strong><span>128 active jobs</span></div>
        <div class="node" style="top:32%;left:37%;"><strong>811 Queue</strong><span>11 awaiting response</span></div>
        <div class="node" style="top:56%;left:20%;"><strong>Inspections</strong><span>7 blocked segments</span></div>
        <div class="node" style="top:72%;left:55%;"><strong>Permits</strong><span>19 pending offices</span></div>
      </div>

      <div class="section">
        <h2>Role visibility</h2>
        <div class="badge-row">
          ${dashboardData.roles.map((role) => `<span class="badge">${role}</span>`).join("")}
        </div>
      </div>

      <div class="section">
        <h2>Tier access</h2>
        <div class="badge-row">
          ${dashboardData.tiers.map((tier) => `<span class="badge">${tier}</span>`).join("")}
        </div>
      </div>

      <p class="insight">Operational focus: prioritize permit blockers to keep trench crews on schedule this week.</p>
    </section>

    <aside class="panel">
      <h2>Filters & Actions</h2>
      <div class="controls">
        <div class="field">
          <label for="role-filter">Role</label>
          <select id="role-filter" name="role-filter">
            <option>All Roles</option>
            ${dashboardData.roles.map((role) => `<option>${role}</option>`).join("")}
          </select>
        </div>

        <div class="field">
          <label for="tier-filter">Tier</label>
          <select id="tier-filter" name="tier-filter">
            <option>All Tiers</option>
            ${dashboardData.tiers.map((tier) => `<option>${tier}</option>`).join("")}
          </select>
        </div>

        <div class="field">
          <label for="status-filter">Status focus</label>
          <select id="status-filter" name="status-filter">
            <option>All statuses</option>
            <option>At risk</option>
            <option>Awaiting documents</option>
            <option>Ready for dispatch</option>
          </select>
        </div>

        ${dashboardData.actions.map((action) => `<button class="btn" type="button">${action}</button>`).join("")}
      </div>
    </aside>
  </main>
</body>
</html>`;

export class MyContainer extends Container<Env> {
	defaultPort = 8080;
	sleepAfter = "2m";
	envVars = {
		MESSAGE: "I was passed in via the container class!",
	};

	override onStart() {
		console.log("Container successfully started");
	}

	override onStop() {
		console.log("Container successfully shut down");
	}

	override onError(error: unknown) {
		console.log("Container error:", error);
	}
}

const app = new Hono<{ Bindings: Env }>();

const securityHeaders = async (c: Context<{ Bindings: Env }>, next: Next) => {
	await next();
	c.header("X-Content-Type-Options", "nosniff");
	c.header("X-Frame-Options", "DENY");
	c.header("Referrer-Policy", "no-referrer");
};

const jsonFirewall = async (c: Context<{ Bindings: Env }>, next: Next) => {
	if (!["POST", "PUT", "PATCH"].includes(c.req.method)) {
		await next();
		return;
	}

	const contentType = c.req.header("content-type") ?? "";
	if (!contentType.toLowerCase().includes("application/json")) {
		return c.json(
			{ error: "Unsupported Media Type", message: "Use application/json" },
			415,
		);
	}

	const rawLength = c.req.header("content-length");
	if (rawLength) {
		const contentLength = Number(rawLength);
		if (!Number.isNaN(contentLength) && contentLength > JSON_BODY_LIMIT_BYTES) {
			return c.json(
				{ error: "Payload Too Large", maxBytes: JSON_BODY_LIMIT_BYTES },
				413,
			);
		}
	}

	await next();
};

app.use("*", securityHeaders);
app.use("/api/*", jsonFirewall);

app.get("/", (c) => {
	return c.html(renderDashboard());
});

app.get("/api/health", (c) => {
	return c.json({
		status: "ok",
		service: "crewproof",
		timestamp: new Date().toISOString(),
	});
});

app.post("/api/lead", async (c) => {
	const payload = await c.req.json().catch(() => null);
	if (!payload || typeof payload !== "object") {
		return c.json({ error: "Invalid JSON body" }, 400);
	}

	const email = "email" in payload ? payload.email : undefined;
	const message = "message" in payload ? payload.message : undefined;
	if (typeof email !== "string" || !email.includes("@")) {
		return c.json({ error: "Valid email is required" }, 400);
	}
	if (typeof message !== "string" || message.trim().length < 5) {
		return c.json({ error: "Message must be at least 5 characters" }, 400);
	}

	return c.json({ accepted: true, receivedAt: new Date().toISOString() }, 201);
});

const forwardToNamedContainer = async (
	c: Context<{ Bindings: Env }>,
	pathSuffix = "",
) => {
	const id = c.req.param("id");
	const containerId = c.env.MY_CONTAINER.idFromName(`/container/${id}`);
	const container = c.env.MY_CONTAINER.get(containerId);

	const upstreamUrl = new URL(c.req.url);
	upstreamUrl.pathname = `/container${pathSuffix}`.replace(/\/+$/, "") || "/container";

	return await container.fetch(new Request(upstreamUrl.toString(), c.req.raw));
};

app.get("/container/:id", async (c) => {
	return await forwardToNamedContainer(c);
});

app.all("/container/:id/*", async (c) => {
	const wildcardPath = c.req.param("*");
	const pathSuffix = wildcardPath && wildcardPath.length > 0 ? `/${wildcardPath}` : "";
	return await forwardToNamedContainer(c, pathSuffix);
});

app.get("/error", async (c) => {
	const container = getContainer(c.env.MY_CONTAINER, "error-test");
	return await container.fetch(c.req.raw);
});

app.get("/lb", async (c) => {
	const container = await getRandom(c.env.MY_CONTAINER, 3);
	return await container.fetch(c.req.raw);
});

app.get("/singleton", async (c) => {
	const container = getContainer(c.env.MY_CONTAINER);
	return await container.fetch(c.req.raw);
});

app.notFound((c) => {
	return c.json({ error: "Not Found" }, 404);
});

app.onError((err, c) => {
	console.error("Unhandled worker error", err);
	return c.json({ error: "Internal Server Error" }, 500);
});

export default app;
