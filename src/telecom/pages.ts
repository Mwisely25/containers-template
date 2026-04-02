import {
	documents,
	jobs,
	locateTickets,
	permits,
	sheetTemplates,
	tierAccess,
	type WorkspaceKey,
} from "./data";
import { appCss, kpiCard, priorityBadge, renderAppShell, riskBadge, statusChip, topbar } from "./ui";

const jobsTable = () => `<div class='table-wrap'><table><thead><tr><th>Job ID</th><th>Work Order</th><th>Name</th><th>Type</th><th>Classification</th><th>Market</th><th>Address</th><th>Priority</th><th>Status</th><th>811</th><th>Permit</th><th>Crew</th><th>Risk</th></tr></thead><tbody>${jobs
	.map(
		(job) => `<tr><td><a href='/app/job-detail?jobId=${job.id}'>${job.id}</a></td><td>${job.workOrder}</td><td>${job.name}</td><td>${job.type}</td><td>${job.classification}</td><td>${job.market}</td><td>${job.address}</td><td>${priorityBadge(job.priority)}</td><td>${statusChip(job.status)}</td><td>${job.locate811}</td><td>${job.permit}</td><td><a href='/app/dispatch'>${job.crew}</a></td><td>${riskBadge(job.risk)}</td></tr>`,
	)
	.join("")}</tbody></table></div>`;

const dashboardBody = () => `${topbar("dashboard")}<section class='grid kpi'>${[
	["Jobs by Status", "128", "14 blocked, 19 QA, 95 active"],
	["Jobs by Type", "5", "Fiber Drop, Bore, Trench, Aerial, Restoration"],
	["Open 811 Tickets", "11", "4 urgent in next 24h"],
	["Permit Aging", "19", "6 >5 days pending"],
	["High-risk Utility Conflicts", "7", "Gas crossings unresolved"],
	["Crew Workload", "82%", "3 crews near saturation"],
	["Recent Field Uploads", "43", "Photos, splice sheets, OTDR"],
	["Invoice Summary", "$214,440", "Pending approval $48,120"],
	["Markets Overview", "4", "Phoenix East, Tempe, Mesa, Glendale"],
	["Recent Audit Activity", "26", "Status, approvals, dispatch edits"],
]
	.map(([a, b, c]) => kpiCard(a, b, c))
	.join("")}</section><section class='split' style='margin-top:.8rem;'><div class='panel'><h2 class='title'>Operational alerts</h2><div class='alert'>JOB-1842 blocked: 811 response missing from Gas utility. Dispatch hold active.</div><div class='alert'>Permit aging warning: PHX-ROW-21988 pending 6 days with trench start in 48h.</div><h3>High priority shortcuts</h3><div class='quick-actions'><a class='filter' href='/app/job-detail?jobId=JOB-1842'>Open JOB-1842</a><a class='filter' href='/app/811'>Open 811 Tracker</a><a class='filter' href='/app/permits'>Open Permits Board</a></div></div><aside class='panel'><h3>Recent Activity Feed</h3><ul class='timeline'><li>08:11 - Crew 7 assigned to emergency bore reroute.</li><li>07:58 - Permit packet uploaded for JOB-1842.</li><li>07:34 - Utility conflict flag raised on handhole HH-212.</li><li>06:42 - Invoice INV-388 moved to dispute review.</li></ul></aside></section>`;

const jobsBody = () => `${topbar("jobs")}<section class='panel'><div class='filters'>${[
	"market",
	"status",
	"classification",
	"type",
	"crew",
	"priority",
	"risk",
	"permit required",
	"811 required",
].map((f) => `<button class='filter'>${f}</button>`).join("")}</div><div class='quick-actions' style='margin-bottom:.6rem;'><button class='filter'>create job</button><button class='filter'>assign crew</button><button class='filter'>approve</button><button class='filter'>open map</button><button class='filter'>open docs</button><button class='filter'>open spreadsheets</button></div>${jobsTable()}</section>`;

const jobDetailBody = (jobId?: string) => {
	const job = jobs.find((item) => item.id === jobId) ?? jobs[0];
	return `${topbar("job-detail")}<section class='panel'><div class='quick-actions'>${[
		"Update Status",
		"Request Locate",
		"Approve Job",
		"Assign Crew",
		"Open Map",
		"Open Viewer",
		"Upload Document",
	]
		.map((a) => `<button class='filter'>${a}</button>`)
		.join("")}</div><div class='filters' style='margin-top:.7rem;'>${[
		"Overview",
		"Status",
		"811",
		"Permits",
		"Prints",
		"Maps",
		"Docs",
		"Spreadsheets",
		"Crew",
		"Materials",
		"Photos",
		"Approvals",
		"Billing",
		"Audit Trail",
	]
		.map((tab) => `<span class='filter'>${tab}</span>`)
		.join("")}</div></section><section class='split' style='margin-top:.8rem;'><article class='panel'><h2 class='title'>Overview · ${job.id}</h2><div class='grid' style='grid-template-columns:repeat(auto-fit,minmax(220px,1fr));margin-top:.6rem;'><div><p class='muted'>Work Order</p><p>${job.workOrder}</p></div><div><p class='muted'>Customer</p><p>MetroFiber Wholesale</p></div><div><p class='muted'>Market</p><p>${job.market}</p></div><div><p class='muted'>Location</p><p>${job.address}</p></div><div><p class='muted'>Excavation Type</p><p>${job.classification}</p></div><div><p class='muted'>Bore / Trench</p><p>Bore: Yes · Trench: No</p></div><div><p class='muted'>Permit Requirement</p><p>${job.permit}</p></div><div><p class='muted'>811 Requirement</p><p>${job.locate811}</p></div><div><p class='muted'>Risk Level</p><p>${riskBadge(job.risk)}</p></div><div><p class='muted'>Linked Crew</p><p>${job.crew}</p></div><div><p class='muted'>Linked Ticket</p><p><a href='/app/811'>AZ-811-552001</a></p></div><div><p class='muted'>Linked Permit Count</p><p>2</p></div><div><p class='muted'>Linked Docs/Spreadsheets/Maps</p><p>14 / 6 / 3</p></div></div></article><aside class='stack'><div class='panel'><h3>Linked Records</h3><div class='quick-actions'><a class='chip' href='/app/documents'>Design prints</a><a class='chip' href='/app/spreadsheets'>Conflict log</a><a class='chip' href='/app/maps'>Route layer</a><a class='chip' href='/app/viewer'>Split view</a></div></div><div class='panel'><h3>Audit Timeline</h3><ul class='timeline'><li>Permit packet attached by PM.</li><li>Approval requested from Area Manager.</li><li>811 ticket linked to utility conflict flag.</li></ul></div></aside></section>`;
};

const tracker811Body = () => `${topbar("811")}<section class='panel'><div class='alert'>Urgent: 4 locate tickets due within 24 hours. 2 jobs blocked by missing marks.</div><div class='table-wrap' style='margin-top:.7rem;'><table><thead><tr><th>Ticket</th><th>Linked Job</th><th>Due</th><th>Utilities</th><th>Status</th><th>Response</th><th>Expired</th><th>Blocked</th><th>Actions</th></tr></thead><tbody>${locateTickets
	.map(
		(item) => `<tr><td>${item.ticket}</td><td><a href='/app/job-detail?jobId=${item.jobId}'>${item.jobId}</a></td><td>${item.due}</td><td>${item.utilities}</td><td>${statusChip(item.status)}</td><td>${item.response}</td><td>${item.expired}</td><td>${item.blocked}</td><td><a href='/app/maps'>Map</a> · <a href='/app/documents'>Docs</a> · <button class='filter'>Remark ticket</button></td></tr>`,
	)
	.join("")}</tbody></table></div></section>`;

const permitsBody = () => `${topbar("permits")}<section class='panel'><div class='alert'>Permit-required jobs missing permits: 3. Permit aging alerts active for 6 submissions.</div><div class='table-wrap' style='margin-top:.7rem;'><table><thead><tr><th>Authority</th><th>Permit #</th><th>Status</th><th>Expiration</th><th>Linked Job</th><th>Aging</th></tr></thead><tbody>${permits
	.map(
		(p) => `<tr><td>${p.authority}</td><td>${p.permitNo}</td><td>${statusChip(p.status)}</td><td>${p.expiration}</td><td><a href='/app/job-detail?jobId=${p.jobId}'>${p.jobId}</a></td><td>${p.aging}</td></tr>`,
	)
	.join("")}</tbody></table></div></section>`;

const documentsBody = () => `${topbar("documents")}<section class='split'><article class='panel'><div class='filters'><button class='filter'>Table</button><button class='filter'>Grid</button><button class='filter'>Design Prints</button><button class='filter'>Utility Maps</button><button class='filter'>Permits</button><button class='filter'>Invoices</button><button class='filter'>Field Photos</button><button class='filter'>As-Builts</button><button class='filter'>Splice Sheets</button><button class='filter'>OTDR Tests</button><button class='filter'>Closeout Packages</button></div><div class='table-wrap'><table><thead><tr><th>Name</th><th>Type</th><th>Job</th><th>Uploaded</th><th>Viewer</th><th>Tags</th><th>Action</th></tr></thead><tbody>${documents
	.map(
		(d) => `<tr><td>${d.name}</td><td>${d.type}</td><td><a href='/app/job-detail?jobId=${d.jobId}'>${d.jobId}</a></td><td>${d.uploaded}</td><td>${d.viewer}</td><td>${d.tags}</td><td><a href='/app/viewer'>Quick Open</a></td></tr>`,
	)
	.join("")}</tbody></table></div></article><aside class='panel'><h3>Metadata Side Panel</h3><p class='muted'>Select a file to view telecom metadata, linked records, and approvals.</p><div class='quick-actions'><span class='chip'>Linked entity: Job</span><span class='chip'>Redline visibility: Enterprise</span><span class='chip'>Viewer: Split</span></div></aside></section>`;

const spreadsheetsBody = () => `${topbar("spreadsheets")}<section class='split'><article class='panel'><h3>Template Library</h3><div class='quick-actions'>${sheetTemplates.map((t) => `<span class='chip'>${t}</span>`).join("")}</div><h3 style='margin-top:.8rem;'>Spreadsheet Records</h3><div class='filters'><button class='filter'>Category Filter</button><button class='filter'>Linked Job</button><button class='filter'>Updated Recently</button><button class='filter'>Export Placeholder</button></div><div class='table-wrap'><table><thead><tr><th>Name</th><th>Category</th><th>Rows</th><th>Linked Jobs</th><th>Updated</th><th>Actions</th></tr></thead><tbody><tr><td>Underground Conflict Register</td><td>Utility Conflict Log</td><td>43</td><td><a href='/app/job-detail?jobId=JOB-1842'>JOB-1842</a></td><td>2026-03-30 07:12</td><td><a href='/app/viewer'>Open</a></td></tr><tr><td>Daily Crew Schedule - Phoenix East</td><td>Crew Schedule</td><td>16</td><td><a href='/app/jobs'>6 linked jobs</a></td><td>2026-03-30 06:45</td><td><button class='filter'>Create from Template</button></td></tr></tbody></table></div></article><aside class='panel'><h3>Preview Panel</h3><p class='muted'>Shows selected spreadsheet details, linked jobs, and latest QA notes.</p></aside></section>`;

const mapsBody = () => `${topbar("maps")}<section class='split'><article class='panel'><h3>Operational Map Placeholder</h3><div style='min-height:350px;border:1px solid #253a68;border-radius:10px;padding:.6rem;background:linear-gradient(rgba(74,184,255,.08) 1px, transparent 1px) 0 0 / 24px 24px,linear-gradient(90deg,rgba(74,184,255,.08) 1px, transparent 1px) 0 0 / 24px 24px,#07122d;'><p class='chip'>Job Pin Markers</p><p class='chip'>Ticket Zone Overlays</p><p class='chip'>Utility Conflict Markers</p><p class='chip'>Fiber Route Placeholders</p><p class='chip'>Pole/Pedestal/Handhole/Splice Markers</p></div></article><aside class='panel'><h3>Layers & Selected Item</h3><div class='quick-actions'><button class='filter'>Toggle risk layers</button><button class='filter'>Toggle route layers</button><button class='filter'>Zoom to job</button></div><p style='margin-top:.8rem;'>Selected: Utility conflict near HH-212 · <a href='/app/job-detail?jobId=JOB-1842'>Open related job</a> · <a href='/app/documents'>Open related docs</a></p></aside></section>`;

const viewerBody = () => `${topbar("viewer")}<section class='split'><aside class='panel'><h3>Asset List</h3><ul class='timeline'><li>Northgate Design Print Rev C</li><li>AZ-811-552001 map overlay</li><li>Utility Conflict Register</li><li>Approval packet for JOB-1842</li></ul><h3>Viewer Modes</h3><div class='quick-actions'><span class='chip'>document viewer</span><span class='chip'>print viewer</span><span class='chip'>map viewer</span><span class='chip'>spreadsheet viewer</span><span class='chip'>split viewer</span></div></aside><article class='panel'><h3>Split Workspace</h3><div class='quick-actions'><button class='filter'>print + map</button><button class='filter'>map + job details</button><button class='filter'>spreadsheet + job details</button><button class='filter'>document + approvals</button></div><div class='panel' style='margin-top:.7rem;'>Asset metadata, linked record badges, and next/previous navigation placeholders are displayed here.</div></article></section>`;

const dispatchBody = () => `${topbar("dispatch")}<section class='panel'><div class='quick-actions'><button class='filter'>Board View</button><button class='filter'>Table View</button></div><div class='split' style='margin-top:.8rem;grid-template-columns:repeat(3,1fr);'><div class='panel'><h3>Crew 7 - Bore</h3><p class='chip'>2 assignments</p><a href='/app/job-detail?jobId=JOB-1842'>JOB-1842</a></div><div class='panel'><h3>Crew 2 - Aerial</h3><p class='chip'>1 assignment</p><a href='/app/job-detail?jobId=JOB-1849'>JOB-1849</a></div><div class='panel'><h3>Unassigned Jobs</h3><p class='chip'>Priority indicators active</p><a href='/app/jobs'>Open unassigned list</a></div></div><p class='muted'>Technician availability placeholder and workload summary included for dispatch planning.</p></section>`;

const billingBody = () => `${topbar("billing")}<section class='panel'><div class='grid kpi'>${kpiCard("Invoice Total", "$214,440", "Current billing period")}${kpiCard("Unpaid", "$63,900", "12 invoices")}${kpiCard("Paid", "$150,540", "27 invoices")}</div><div class='table-wrap' style='margin-top:.7rem;'><table><thead><tr><th>Invoice</th><th>Status</th><th>Linked Job</th><th>Customer</th><th>Amount</th><th>Notes</th></tr></thead><tbody><tr><td>INV-388</td><td>${statusChip("Dispute")}</td><td><a href='/app/job-detail?jobId=JOB-1842'>JOB-1842</a></td><td>MetroFiber Wholesale</td><td>$12,800</td><td>Dispute placeholder</td></tr><tr><td>INV-372</td><td>${statusChip("Paid")}</td><td><a href='/app/job-detail?jobId=JOB-1849'>JOB-1849</a></td><td>MetroFiber Wholesale</td><td>$8,420</td><td>Change order placeholder</td></tr></tbody></table></div></section>`;

const reportingBody = () => `${topbar("reporting")}<section class='grid kpi'>${[
	["Jobs by Type", "5", "Fiber drop leads volume"],
	["Jobs by Market", "4", "Phoenix East highest backlog"],
	["Locate Aging", "11", "4 urgent"],
	["Permit Aging", "19", "6 over SLA"],
	["Crew Workload", "82%", "Bore crews constrained"],
	["Invoice Totals", "$214,440", "Period to date"],
	["Risk Distribution", "7 high", "Utility conflicts concentrated"],
	["Completion Rates", "74%", "Monthly close target 80%"],
	["Backlog Count", "34", "Underground-heavy queue"],
	["Recently Closed", "9", "Includes 3 restoration closes"],
]
	.map(([a, b, c]) => kpiCard(a, b, c))
	.join("")}</section>`;

const onboardingBody = () =>
	`${topbar("onboarding")}<section class='split'><article class='panel'><h3>Prime + Contractor Intake</h3><p class='muted'>Upload-ready onboarding packets are automatically sorted into workspace folders by company, market, and document type.</p><div class='quick-actions' style='margin:.6rem 0;'>${[
		"Create Prime",
		"Invite Contractor",
		"Download Packet Template",
		"Start Bulk Upload",
	].map((action) => `<button class='filter'>${action}</button>`).join("")}</div><div class='table-wrap'><table><thead><tr><th>Entity</th><th>Type</th><th>Status</th><th>Required Files</th><th>Upload Method</th><th>Destination</th></tr></thead><tbody><tr><td>Atlas Fiber Partners</td><td>Prime</td><td>${statusChip("Ready for Review")}</td><td>MSA, COI, W-9, Safety Program</td><td>Portal Upload</td><td>/onboarding/primes/atlas-fiber/</td></tr><tr><td>DigSafe Field Ops</td><td>Contractor</td><td>${statusChip("Missing COI")}</td><td>COI, MSA Addendum, Crew Roster</td><td>Email Intake + Portal</td><td>/onboarding/contractors/digsafe-field-ops/</td></tr><tr><td>Summit Utility Services</td><td>Contractor</td><td>${statusChip("Approved")}</td><td>All required files complete</td><td>Portal Upload</td><td>/vendors/approved/summit-utility-services/</td></tr></tbody></table></div></article><aside class='stack'><div class='panel'><h3>File Organization Workflow</h3><ol class='timeline'><li>1) Intake packet uploaded in bulk or individually.</li><li>2) System classifies files (insurance, legal, safety, compliance, payroll).</li><li>3) Auto-routing stores files in the proper company folder.</li><li>4) Missing docs trigger reminders and review tasks.</li><li>5) Approval moves vendor to active roster.</li></ol></div><div class='panel'><h3>Upload Rules</h3><p class='muted'>Preferred: use the onboarding portal to keep naming and folder placement consistent. If files arrive by email, the intake parser can still sort them, but portal upload is recommended for cleaner audit trails.</p><div class='quick-actions'><span class='chip'>Naming: company_docType_YYYY-MM-DD</span><span class='chip'>Allowed: PDF, XLSX, PNG, JPG</span><span class='chip'>Max size: 50MB/file</span></div></div></aside></section>`;

const profileBody = () =>
	`${topbar("profile")}<section class='split'><article class='panel'><h3>Profile Mode Toggle</h3><p class='muted'>Switch between everyday operations and specialized views without changing accounts.</p><div class='quick-actions' style='margin:.7rem 0;'><button class='filter'>Regular Mode</button><button class='filter'>Demo Mode</button><button class='filter'>IT Mode</button></div><div class='table-wrap'><table><thead><tr><th>Mode</th><th>Use Case</th><th>Visible Panels</th><th>Permissions</th></tr></thead><tbody><tr><td>Regular</td><td>Daily production work</td><td>Jobs, dispatch, docs, approvals</td><td>Role-based standard access</td></tr><tr><td>Demo</td><td>Sales demos and onboarding walkthroughs</td><td>Sample data, guided prompts, safe actions</td><td>No production mutations</td></tr><tr><td>IT</td><td>Operational monitoring and diagnostics</td><td>System health, adoption analytics, feedback queue</td><td>Technical admin only</td></tr></tbody></table></div></article><aside class='stack'><div class='panel'><h3>IT Mode Snapshot</h3><div class='grid kpi'>${kpiCard("System Uptime", "99.98%", "Last 30 days")}${kpiCard("API Errors", "0.19%", "Last 24 hours")}${kpiCard("Active Users", "146", "Across all markets")}${kpiCard("Feedback Queue", "12", "3 urgent product issues")}</div></div><div class='panel'><h3>User Behavior + Feedback</h3><ul class='timeline'><li>Top action: Open Job Detail (34% of clicks).</li><li>Most-used workspace: Dispatch Board.</li><li>Feedback trend: requests for faster permit approvals.</li><li>Health alerts: 2 delayed document indexing jobs.</li></ul></div></aside></section>`;

const messagingBody = () =>
	`${topbar("messaging")}<section class='split'><article class='panel'><h3>Email Inbox</h3><div class='table-wrap'><table><thead><tr><th>From</th><th>Subject</th><th>Linked Record</th><th>Received</th><th>Status</th></tr></thead><tbody><tr><td>permits@phoenix.gov</td><td>Permit PHX-ROW-21988 - Clarification Needed</td><td><a href='/app/permits'>Permit Tracker</a></td><td>2026-04-02 08:12</td><td>${statusChip("Unread")}</td></tr><tr><td>dispatch@metrofiber.com</td><td>Crew 7 availability update</td><td><a href='/app/dispatch'>Dispatch Board</a></td><td>2026-04-02 07:43</td><td>${statusChip("Read")}</td></tr><tr><td>pm@atlasfiber.com</td><td>Onboarding packet upload complete</td><td><a href='/app/onboarding'>Onboarding</a></td><td>2026-04-01 16:20</td><td>${statusChip("Flagged")}</td></tr></tbody></table></div></article><aside class='stack'><div class='panel'><h3>Compose & Send</h3><div class='filters'><span class='filter'>To: vendor@company.com</span><span class='filter'>CC: ops@crewproof.com</span><span class='filter'>Template: Missing Documents</span></div><div class='panel' style='margin-top:.6rem;'><p class='muted'>Message editor placeholder for sending onboarding requests, permit follow-ups, and crew updates.</p></div><div class='quick-actions' style='margin-top:.6rem;'><button class='filter'>Save Draft</button><button class='filter'>Send Email</button></div></div><div class='panel'><h3>Sent / Outbox</h3><ul class='timeline'><li>2026-04-02 08:20 · Missing COI reminder sent to DigSafe Field Ops.</li><li>2026-04-02 08:05 · Permit clarification sent to City of Phoenix.</li><li>2026-04-01 17:44 · Welcome packet sent to new contractor admin.</li></ul></div></aside></section>`;

const adminBody = () => `${topbar("admin")}<section class='split'><article class='panel'><h3>Technical Admin Control Area</h3><div class='filters'><span class='filter'>Role Management</span><span class='filter'>Tier Access Management</span><span class='filter'>Feature Visibility Controls</span><span class='filter'>Job Visibility Controls</span><span class='filter'>Workflow Controls</span></div><h4>Role Management</h4><p class='muted'>Assign role and scope: crew sees assigned jobs only, PM sees region/team jobs, admin sees all, customer_viewer sees approved external info.</p><h4>Feature Visibility Toggles</h4><div class='quick-actions'>${[
	"jobs",
	"documents",
	"extracted email data",
	"spreadsheets / CrewProof system",
	"map views",
	"811 workflows",
	"approvals",
	"assignments",
	"redlines",
	"admin settings",
]
	.map((f) => `<button class='filter'>${f}</button>`)
	.join("")}</div><h4 style='margin-top:.8rem;'>Workflow Controls</h4><div class='quick-actions'><button class='filter'>Approval required</button><button class='filter'>811 required for underground</button><button class='filter'>Docs required before closeout</button><button class='filter'>Redline editable visibility</button></div></article><aside class='panel'><h3>Tier Policies</h3>${Object.entries(tierAccess)
	.map(
		([tier, features]) => `<div class='panel'><p><strong>${tier}</strong></p><ul class='timeline'>${features.map((feature) => `<li>${feature}</li>`).join("")}</ul></div>`,
	)
	.join("")}</aside></section>`;

export const renderLanding = () => `<!doctype html><html><head><meta charset='utf-8'/><meta name='viewport' content='width=device-width, initial-scale=1'/><title>CrewProof Telecom Operations Platform</title><style>${appCss}</style></head><body><main style='max-width:1180px;margin:0 auto;padding:1rem;'><section class='hero'><p class='brand'>CrewProof</p><h1 class='title'>Telecom-native operations platform for field + office execution.</h1><p class='muted'>Manage jobs, 811, permits, maps, documents, spreadsheets, dispatch, billing, redlines, and closeout from one operational system.</p><div class='quick-actions' style='margin-top:.6rem;'><a class='filter' href='/app/dashboard'>Open Platform Demo</a><button class='filter'>Request Demo</button></div><div class='hero-grid'><div class='hero-box'><p class='muted'>Dark Ops Nav</p><ul class='timeline'><li>Jobs</li><li>811</li><li>Permits</li><li>Maps</li><li>Docs</li><li>Dispatch</li></ul></div><div class='hero-box'><p class='muted'>Center Map / Project Overview</p><p class='chip'>128 active jobs</p><p class='chip'>11 open tickets</p><p class='chip'>19 pending permits</p></div><div class='hero-box'><p class='muted'>Right Status Panel</p><p class='chip'>Approvals: 9</p><p class='chip'>Blocked jobs: 14</p><p class='chip'>High-risk conflicts: 7</p></div></div></section><section class='grid' style='grid-template-columns:repeat(auto-fit,minmax(230px,1fr));margin-top:.9rem;'><article class='panel'><h3>Platform Modules</h3><p class='muted'>Telecom dashboard, jobs, 811, permits, documents, spreadsheets, maps, viewer, dispatch, billing, reporting, admin controls.</p></article><article class='panel'><h3>How it works</h3><p class='muted'>Intake -> classify -> locate/permit -> dispatch -> execute -> QA -> billing -> closeout with audit visibility.</p></article><article class='panel'><h3>Role-based value</h3><p class='muted'>Contractors, crews, PMs, area managers, admins, technical admins, and customer viewers each get scoped access.</p></article><article class='panel'><h3>Contact / Demo</h3><p class='muted'>Use CrewProof onboarding support for market launch tonight. Demo data is pre-seeded for immediate walkthroughs.</p></article></section></main></body></html>`;

export const renderWorkspacePage = (workspace: WorkspaceKey, jobId?: string) => {
	const content =
		workspace === "dashboard"
			? dashboardBody()
			: workspace === "jobs"
				? jobsBody()
				: workspace === "job-detail"
					? jobDetailBody(jobId)
					: workspace === "811"
						? tracker811Body()
						: workspace === "permits"
							? permitsBody()
							: workspace === "documents"
								? documentsBody()
								: workspace === "spreadsheets"
									? spreadsheetsBody()
									: workspace === "maps"
										? mapsBody()
										: workspace === "viewer"
											? viewerBody()
											: workspace === "dispatch"
												? dispatchBody()
												: workspace === "billing"
													? billingBody()
													: workspace === "reporting"
														? reportingBody()
														: workspace === "onboarding"
															? onboardingBody()
															: workspace === "profile"
																? profileBody()
																: workspace === "messaging"
																	? messagingBody()
																	: adminBody();
	return renderAppShell(workspace, content);
};
