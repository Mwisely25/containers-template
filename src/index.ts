import { Container, getContainer, getRandom } from "@cloudflare/containers";
import type { Context, Next } from "hono";
import { Hono } from "hono";
import type { WorkspaceKey } from "./telecom/data";
import { renderLanding, renderWorkspacePage } from "./telecom/pages";

const JSON_BODY_LIMIT_BYTES = 100_000;

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
	return c.html(renderLanding());
});

app.get("/app", (c) => {
	return c.redirect("/app/dashboard");
});

app.get("/app/job-detail", (c) => {
	const jobId = c.req.query("jobId") ?? undefined;
	return c.html(renderWorkspacePage("job-detail", jobId));
});

app.get("/app/:workspace", (c) => {
	const workspace = c.req.param("workspace") as WorkspaceKey;
	const allowed: WorkspaceKey[] = ["dashboard", "jobs", "811", "permits", "documents", "spreadsheets", "maps", "viewer", "dispatch", "billing", "reporting", "admin"];
	if (!allowed.includes(workspace)) {
		return c.notFound();
	}
	return c.html(renderWorkspacePage(workspace));
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
