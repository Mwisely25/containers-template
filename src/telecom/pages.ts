import { jobs, type WorkspaceKey } from "./data";
import { computeReadiness, getJob, getUnresolvedUploads, listDocuments, listJobs, type SessionUser } from "./state";
import { appCss, kpiCard, renderAppShell, topbar } from "./ui";

const fmt = (iso: string) => new Date(iso).toISOString().slice(0, 16).replace("T", " ");

export const renderLanding = () => `<!doctype html><html><head><meta charset='utf-8'/><meta name='viewport' content='width=device-width, initial-scale=1'/><title>CrewProof</title><style>${appCss}</style></head><body><main style='max-width:980px;margin:0 auto;padding:1rem;'><section class='panel'><p class='brand'>CrewProof</p><h1 class='title'>Web operations platform for crews, jobs, documents, map, closeout, and billing readiness.</h1><p class='muted'>Public visitors can request a demo. Internal users sign in for the real dashboard.</p><div class='quick-actions'><a class='filter' href='/auth/login'>Log in</a><a class='filter' href='/auth/signup'>Sign up</a><a class='filter' href='/demo'>Open public demo</a></div></section></main></body></html>`;

export const renderDemoLanding = () => `<!doctype html><html><head><meta charset='utf-8'/><meta name='viewport' content='width=device-width, initial-scale=1'/><title>CrewProof Demo</title><style>${appCss}</style></head><body><main style='max-width:980px;margin:0 auto;padding:1rem;'><section class='panel'><h1 class='title'>Public Demo Experience</h1><p class='muted'>This is intentionally separate from the internal app dashboard.</p><p class='muted'>To access production workflows, use login.</p><a class='filter' href='/auth/login'>Go to login</a></section></main></body></html>`;

export const renderAuthPage = (mode: "login" | "signup", error?: string) => `<!doctype html><html><head><meta charset='utf-8'/><meta name='viewport' content='width=device-width, initial-scale=1'/><title>${mode}</title><style>${appCss}</style></head><body><main style='max-width:460px;margin:2rem auto;padding:1rem;'><section class='panel'><h1 class='title'>${mode === "login" ? "Login" : "Create account"}</h1>${error ? `<p class='alert'>${error}</p>` : ""}<form method='post' action='/auth/${mode}' class='stack'><label class='muted'>Email<input name='email' type='email' required /></label><label class='muted'>Password<input name='password' type='password' required minlength='4'/></label><button type='submit'>${mode === "login" ? "Log in" : "Sign up"}</button></form><p class='muted'>${mode === "login" ? "Need an account?" : "Already have an account?"} <a href='/auth/${mode === "login" ? "signup" : "login"}'>${mode === "login" ? "Sign up" : "Login"}</a></p><p class='muted'>Test users: admin@crewproof.io / admin123, pm@crewproof.io / pm123</p></section></main></body></html>`;

const jobsTable = (user: SessionUser) => `<div class='table-wrap'><table><thead><tr><th>Select</th><th>Job</th><th>Status</th><th>811</th><th>Permit</th><th>Crew</th><th>Risk</th><th>Closeout</th><th>Billing</th></tr></thead><tbody>${listJobs().map((job) => {
	const readiness = computeReadiness(job);
	return `<tr><td><a class='filter' href='/api/select-job/${job.id}?next=/app/jobs'>Use</a></td><td><a href='/app/job-detail?jobId=${job.id}'>${job.id} · ${job.name}</a></td><td>${readiness.state}</td><td>${job.locateTicket?.status ?? "not required"}</td><td>${job.permitRequired ? job.permitStatus : "not required"}</td><td>${job.crew}</td><td>${job.risk}</td><td>${readiness.missingItems.length ? `Missing ${readiness.missingItems.length}` : "Complete"}</td><td>${readiness.billingState}</td></tr>`;
}).join("")}</tbody></table></div><p class='muted'>Current selected job: ${user.selectedJobId}</p>`;

const uploadForm = (jobId: string) => `<form class='panel' method='post' action='/api/upload?next=/app/documents' enctype='multipart/form-data'><h3>Upload file to selected job</h3><p class='muted'>Active job defaults to ${jobId}. If changed, file attaches to that job.</p><div class='form-grid'><label class='muted'>Job<select name='jobId'>${jobs.map((j) => `<option value='${j.id}' ${j.id === jobId ? "selected" : ""}>${j.id}</option>`).join("")}</select></label><label class='muted'>Category override (optional)<select name='category'><option value=''>Auto categorize</option><option>design print</option><option>utility map</option><option>permit</option><option>811 file</option><option>work order</option><option>customer request</option><option>invoice</option><option>field photo</option><option>redline</option><option>as-built</option><option>closeout package</option><option>spreadsheet</option></select></label><label class='muted'>File<input name='file' type='file' required /></label></div><button style='margin-top:.6rem;' type='submit'>Upload Document</button><p id='upload-ok' class='alert ok' style='display:none;margin-top:.5rem;'>Upload complete and attached to job.</p></form>`;

const documentsBody = (user: SessionUser) => {
	const docs = listDocuments();
	const unresolved = getUnresolvedUploads();
	return `${topbar("documents", user)}${uploadForm(user.selectedJobId)}<section class='panel' style='margin-top:.8rem;'><h3>Documents Center</h3><div class='table-wrap'><table><thead><tr><th>Name</th><th>Job</th><th>Category</th><th>Review</th><th>Uploaded</th></tr></thead><tbody>${docs.map((doc) => `<tr><td>${doc.name}</td><td><a href='/api/select-job/${doc.jobId}?next=/app/documents'>${doc.jobId}</a></td><td>${doc.category}</td><td>${doc.reviewRequired ? "review required" : "clear"}</td><td>${fmt(doc.uploadedAt)}</td></tr>`).join("")}</tbody></table></div>${unresolved.length ? `<div class='alert warn' style='margin-top:.7rem;'>Unresolved queue: ${unresolved.map((u) => `${u.name} (${u.reason})`).join(", ")}</div>` : ""}</section>`;
};

const mapBody = (user: SessionUser) => {
	const job = getJob(user.selectedJobId) ?? listJobs()[0];
	const t = job.locateTicket;
	return `${topbar("maps", user)}<section class='split'><article class='panel'><div id='map' style='height:420px;border-radius:10px;'></div></article><aside class='panel'><h3>${job.id} map context</h3><p class='muted'>Address: ${job.address}</p><p class='chip'>811: ${t?.status ?? "not required"}</p><p class='chip'>Redline: ${job.redlineStatus}</p><p class='chip'>GPS route: ${job.gpsRouteStatus}</p><p class='chip'>Billing state: ${computeReadiness(job).billingState}</p><p>${t ? `Ticket ${t.ticket} due ${t.due}` : "No ticket required."}</p><div class='quick-actions'><a class='filter' href='/app/job-detail?jobId=${job.id}'>Open Job</a><a class='filter' href='/app/documents'>Open Docs</a><a class='filter' href='/app/closeout'>Open Closeout</a></div></aside></section><script>const map=L.map('map').setView([${job.lat},${job.lng}],14);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(map);L.marker([${job.lat},${job.lng}]).addTo(map).bindPopup('${job.id}: ${job.name}').openPopup();const route=${JSON.stringify(job.route)};L.polyline(route,{color:'#4ab8ff'}).addTo(map);${t ? `L.polygon(${JSON.stringify(t.polygon)},{color:'#fbbf24'}).addTo(map);` : ""}</script>`;
};

const closeoutBody = (user: SessionUser) => {
	const job = getJob(user.selectedJobId) ?? listJobs()[0];
	const r = computeReadiness(job);
	return `${topbar("closeout", user)}<section class='split'><article class='panel'><h3>${job.id} closeout summary</h3><p class='chip'>System state: ${r.state}</p><p class='chip'>Billing: ${r.billingState}</p><h4>Missing items</h4><ul>${r.missingItems.length ? r.missingItems.map((i) => `<li>${i}</li>`).join("") : "<li>None</li>"}</ul><h4>Why blocked / next step</h4><ul>${r.reasons.length ? r.reasons.map((reason) => `<li>${reason}</li>`).join("") : "<li>Ready for closeout and billing submission</li>"}</ul></article><aside class='stack'>${uploadForm(job.id)}<div class='panel'><h3>Proof-of-work states</h3><p class='chip'>Redline: ${job.redlineStatus}</p><p class='chip'>GPS route: ${job.gpsRouteStatus}</p><p class='chip'>Approval: ${job.approvalStatus}</p></div></aside></section>`;
};

const billingBody = (user: SessionUser) => `${topbar("billing", user)}<section class='grid kpi'>${listJobs().map((job) => {
	const r = computeReadiness(job);
	return kpiCard(job.id, r.billingState, r.readyForBilling ? "Ready for invoicing" : `Blocked by: ${r.missingItems.slice(0, 2).join(", ") || "review"}`);
}).join("")}</section>`;

const tracker811Body = (user: SessionUser) => `${topbar("811", user)}<section class='panel'><div class='table-wrap'><table><thead><tr><th>Job</th><th>Ticket</th><th>Status</th><th>Responses</th><th>Due</th></tr></thead><tbody>${listJobs().filter((j) => j.requires811).map((job) => `<tr><td><a href='/api/select-job/${job.id}?next=/app/811'>${job.id}</a></td><td>${job.locateTicket?.ticket ?? "missing"}</td><td>${job.locateTicket?.status ?? "missing"}</td><td>${job.locateTicket?.responses.map((r) => `${r.utility}:${r.status}`).join(" · ") ?? "missing"}</td><td>${job.locateTicket?.due ?? "-"}</td></tr>`).join("")}</tbody></table></div></section>`;

const dashboardBody = (user: SessionUser) => {
	const selected = getJob(user.selectedJobId) ?? listJobs()[0];
	const r = computeReadiness(selected);
	return `${topbar("dashboard", user)}<section class='grid kpi'>${kpiCard("Selected Job", selected.id, selected.name)}${kpiCard("Operational State", r.state, r.reasons[0] ?? "No blockers")}${kpiCard("Missing Items", String(r.missingItems.length), r.missingItems.join(", ") || "None")}${kpiCard("Billing", r.billingState, r.readyForBilling ? "Ready to invoice" : "Closeout incomplete")}</section><section class='panel' style='margin-top:.8rem;'><h3>Morning critical path</h3><ol><li>Open Jobs and choose job.</li><li>Upload to selected job.</li><li>See docs in Documents Center.</li><li>Open Map for job/ticket/route context.</li><li>Open Closeout and resolve missing items.</li><li>Confirm billing readiness state.</li></ol></section>`;
};

const jobDetailBody = (user: SessionUser, jobId?: string) => {
	const job = getJob(jobId ?? user.selectedJobId) ?? listJobs()[0];
	const r = computeReadiness(job);
	return `${topbar("job-detail", user)}<section class='panel'><a class='filter' href='/api/select-job/${job.id}?next=/app/job-detail?jobId=${job.id}'>Set as selected job</a><h3 style='margin-top:.7rem;'>${job.id} · ${job.name}</h3><p class='chip'>Status: ${r.state}</p><p class='chip'>Permit: ${job.permitRequired ? job.permitStatus : "not required"}</p><p class='chip'>811: ${job.locateTicket?.status ?? "not required"}</p><p class='chip'>Redline: ${job.redlineStatus}</p><p class='chip'>Billing: ${r.billingState}</p><p class='muted'>No dead actions: use Jobs, Documents upload, Map, and Closeout links in the top bar.</p></section>`;
};

export const renderWorkspacePage = (workspace: WorkspaceKey, user: SessionUser, jobId?: string) => {
	const content =
		workspace === "dashboard"
			? dashboardBody(user)
			: workspace === "jobs"
				? `${topbar("jobs", user)}<section class='panel'>${jobsTable(user)}</section>${uploadForm(user.selectedJobId)}`
				: workspace === "documents"
					? documentsBody(user)
					: workspace === "maps"
						? mapBody(user)
						: workspace === "811"
							? tracker811Body(user)
							: workspace === "closeout"
								? closeoutBody(user)
								: workspace === "billing"
									? billingBody(user)
									: workspace === "job-detail"
										? jobDetailBody(user, jobId)
										: `${topbar("admin", user)}<section class='panel'><h3>Admin</h3><p class='muted'>Demo mode only visible for authorized users. Tier and payment are hidden until implemented.</p></section>`;
	return renderAppShell(workspace, user, content);
};
