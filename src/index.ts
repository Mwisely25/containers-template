import { Container, getContainer, getRandom } from "@cloudflare/containers";
import type { Context, Next } from "hono";
import { Hono } from "hono";
import { createUser, authenticate, attachUpload, clearSession, getUserBySession, issueSession, setSelectedJob, type SessionUser } from "./telecom/state";
import type { WorkspaceKey } from "./telecom/data";
import { renderAuthPage, renderDemoLanding, renderLanding, renderWorkspacePage } from "./telecom/pages";

const JSON_BODY_LIMIT_BYTES = 100_000;
const SESSION_COOKIE = "cp_session";

const readCookie = (cookieHeader: string | undefined, key: string): string | null => {
	if (!cookieHeader) return null;
	const parts = cookieHeader.split(";").map((x) => x.trim());
	for (const part of parts) {
		const [k, ...rest] = part.split("=");
		if (k === key) return decodeURIComponent(rest.join("="));
	}
	return null;
};

const sessionCookieValue = (token: string) => `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax`;

export class MyContainer extends Container<Env> {
	defaultPort = 8080;
	sleepAfter = "2m";
}

const app = new Hono<{ Bindings: Env; Variables: { user: SessionUser } }>();

const securityHeaders = async (c: Context<{ Bindings: Env }>, next: Next) => {
	await next();
	c.header("X-Content-Type-Options", "nosniff");
	c.header("X-Frame-Options", "DENY");
	c.header("Referrer-Policy", "no-referrer");
};

const jsonFirewall = async (c: Context<{ Bindings: Env }>, next: Next) => {
	if (!["POST", "PUT", "PATCH"].includes(c.req.method)) return await next();
	const contentType = c.req.header("content-type") ?? "";
	if (c.req.path.startsWith("/api") && !contentType.toLowerCase().includes("application/json") && !contentType.toLowerCase().includes("multipart/form-data") && !contentType.toLowerCase().includes("application/x-www-form-urlencoded")) {
		return c.json({ error: "Unsupported Media Type", message: "Use JSON, form-urlencoded, or multipart form data" }, 415);
	}
	const rawLength = c.req.header("content-length");
	if (rawLength && Number(rawLength) > JSON_BODY_LIMIT_BYTES * 20) return c.json({ error: "Payload Too Large" }, 413);
	return await next();
};

const requireAuth = async (c: Context<{ Bindings: Env; Variables: { user: SessionUser } }>, next: Next) => {
	const token = readCookie(c.req.header("cookie"), SESSION_COOKIE);
	const user = getUserBySession(token);
	if (!user) return c.redirect("/auth/login");
	c.set("user", user);
	return await next();
};

app.use("*", securityHeaders);
app.use("/api/*", jsonFirewall);

app.get("/", (c) => c.html(renderLanding()));
app.get("/demo", (c) => c.html(renderDemoLanding()));

app.get("/auth/login", (c) => c.html(renderAuthPage("login")));
app.get("/auth/signup", (c) => c.html(renderAuthPage("signup")));

app.post("/auth/login", async (c) => {
	const form = await c.req.parseBody();
	const email = String(form.email ?? "");
	const password = String(form.password ?? "");
	const user = authenticate(email, password);
	if (!user) return c.html(renderAuthPage("login", "Invalid credentials"), 401);
	c.header("Set-Cookie", sessionCookieValue(issueSession(user)));
	return c.redirect("/app/dashboard");
});

app.post("/auth/signup", async (c) => {
	const form = await c.req.parseBody();
	const email = String(form.email ?? "");
	const password = String(form.password ?? "");
	if (!email.includes("@") || password.length < 4) return c.html(renderAuthPage("signup", "Provide valid email and password"), 400);
	const user = createUser(email, password);
	if (!user) return c.html(renderAuthPage("signup", "Email already exists"), 409);
	c.header("Set-Cookie", sessionCookieValue(issueSession(user)));
	return c.redirect("/app/dashboard");
});

app.get("/auth/logout", (c) => {
	const token = readCookie(c.req.header("cookie"), SESSION_COOKIE);
	clearSession(token);
	c.header("Set-Cookie", `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`);
	return c.redirect("/");
});

app.use("/app/*", requireAuth);
app.use("/api/*", requireAuth);

app.get("/app", (c) => c.redirect("/app/dashboard"));
app.get("/app/job-detail", (c) => c.html(renderWorkspacePage("job-detail", c.get("user"), c.req.query("jobId") ?? undefined)));

app.get("/app/:workspace", (c) => {
	const workspace = c.req.param("workspace") as WorkspaceKey;
	const allowed: WorkspaceKey[] = ["dashboard", "jobs", "documents", "maps", "811", "closeout", "billing", "admin"];
	if (!allowed.includes(workspace)) return c.notFound();
	return c.html(renderWorkspacePage(workspace, c.get("user")));
});

app.get("/api/select-job/:jobId", (c) => {
	const ok = setSelectedJob(c.get("user"), c.req.param("jobId"));
	const next = c.req.query("next") ?? "/app/jobs";
	return ok ? c.redirect(next) : c.text("Unknown job", 404);
});

app.post("/api/upload", async (c) => {
	const form = await c.req.parseBody();
	const selectedJob = String(form.jobId ?? c.get("user").selectedJobId ?? "");
	const file = form.file;
	if (!file || typeof file === "string") return c.text("file is required", 400);
	const result = attachUpload(file.name, selectedJob);
	const next = c.req.query("next") ?? "/app/documents";
	if (!result.attached) return c.redirect(`${next}?uploaded=0`);
	return c.redirect(`${next}?uploaded=1`);
});

app.post("/api/demo-mode", async (c) => {
	const user = c.get("user");
	if (!user.demoAllowed) return c.text("Not allowed", 403);
	const form = await c.req.parseBody();
	user.demoMode = String(form.mode ?? "off") === "on";
	return c.redirect("/app/admin");
});

app.get("/api/health", (c) => c.json({ status: "ok", service: "crewproof", timestamp: new Date().toISOString() }));

const forwardToNamedContainer = async (c: Context<{ Bindings: Env; Variables: { user: SessionUser } }>, pathSuffix = "") => {
	const id = c.req.param("id");
	const containerId = c.env.MY_CONTAINER.idFromName(`/container/${id}`);
	const container = c.env.MY_CONTAINER.get(containerId);
	const upstreamUrl = new URL(c.req.url);
	upstreamUrl.pathname = `/container${pathSuffix}`.replace(/\/+$/, "") || "/container";
	return await container.fetch(new Request(upstreamUrl.toString(), c.req.raw));
};

app.get("/container/:id", async (c) => await forwardToNamedContainer(c));
app.all("/container/:id/*", async (c) => await forwardToNamedContainer(c, c.req.param("*") ? `/${c.req.param("*")}` : ""));
app.get("/error", async (c) => await getContainer(c.env.MY_CONTAINER, "error-test").fetch(c.req.raw));
app.get("/lb", async (c) => await (await getRandom(c.env.MY_CONTAINER, 3)).fetch(c.req.raw));
app.get("/singleton", async (c) => await getContainer(c.env.MY_CONTAINER).fetch(c.req.raw));

app.notFound((c) => c.json({ error: "Not Found" }, 404));
app.onError((err, c) => {
	console.error("Unhandled worker error", err);
	return c.json({ error: "Internal Server Error" }, 500);
});

export default app;
