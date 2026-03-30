export type Role =
	| "technical_admin"
	| "admin"
	| "project_manager"
	| "area_manager"
	| "crew"
	| "contractor"
	| "customer_viewer";

export type Tier = "starter" | "pro" | "enterprise";

export type WorkspaceKey =
	| "dashboard"
	| "jobs"
	| "job-detail"
	| "811"
	| "permits"
	| "documents"
	| "spreadsheets"
	| "maps"
	| "viewer"
	| "dispatch"
	| "billing"
	| "reporting"
	| "admin";

export interface JobRecord {
	id: string;
	workOrder: string;
	name: string;
	type: string;
	classification: string;
	market: string;
	address: string;
	priority: "Critical" | "High" | "Medium" | "Low";
	status: string;
	locate811: string;
	permit: string;
	crew: string;
	risk: "High" | "Moderate" | "Low";
}

export const roles: Role[] = [
	"technical_admin",
	"admin",
	"project_manager",
	"area_manager",
	"crew",
	"contractor",
	"customer_viewer",
];

export const tiers: Tier[] = ["starter", "pro", "enterprise"];

export const workspaceTitles: Record<WorkspaceKey, string> = {
	dashboard: "Telecom Dashboard",
	jobs: "Jobs Dashboard",
	"job-detail": "Job Detail Workspace",
	"811": "811 Tracker",
	permits: "Permits Tracker",
	documents: "Documents Center",
	spreadsheets: "Spreadsheet Center",
	maps: "Map Workspace",
	viewer: "Viewer Workspace",
	dispatch: "Dispatch Board",
	billing: "Billing Center",
	reporting: "Reporting Dashboard",
	admin: "Admin / Settings",
};

export const jobs: JobRecord[] = [
	{
		id: "JOB-1842",
		workOrder: "WO-99310",
		name: "Northgate Fiber Drop Package",
		type: "Fiber Drop",
		classification: "Underground",
		market: "Phoenix East",
		address: "2149 E Chandler Blvd, Phoenix, AZ",
		priority: "Critical",
		status: "Blocked - 811",
		locate811: "Awaiting utility marks",
		permit: "Submitted",
		crew: "Crew 7 - Bore",
		risk: "High",
	},
	{
		id: "JOB-1849",
		workOrder: "WO-99355",
		name: "Mesa Aerial Pole Transfer",
		type: "Aerial",
		classification: "Pole",
		market: "Phoenix East",
		address: "920 N Country Club Dr, Mesa, AZ",
		priority: "High",
		status: "Dispatch Ready",
		locate811: "Not required",
		permit: "Approved",
		crew: "Crew 2 - Aerial",
		risk: "Moderate",
	},
	{
		id: "JOB-1902",
		workOrder: "WO-99710",
		name: "Tempe Handhole Retrofit",
		type: "Restoration",
		classification: "Underground",
		market: "Tempe",
		address: "201 S Mill Ave, Tempe, AZ",
		priority: "Medium",
		status: "QA Review",
		locate811: "Valid - 3 days",
		permit: "Issued",
		crew: "Crew 11 - Restoration",
		risk: "Low",
	},
];

export const locateTickets = [
	{
		ticket: "AZ-811-552001",
		jobId: "JOB-1842",
		due: "2026-03-31",
		utilities: "Power, Gas, Telecom",
		status: "Open",
		response: "2/3 responded",
		expired: "No",
		blocked: "Yes",
	},
	{
		ticket: "AZ-811-551941",
		jobId: "JOB-1902",
		due: "2026-04-02",
		utilities: "Water, Telecom",
		status: "Marked",
		response: "Complete",
		expired: "No",
		blocked: "No",
	},
];

export const permits = [
	{
		authority: "City of Phoenix",
		permitNo: "PHX-ROW-21988",
		status: "Submitted",
		expiration: "2026-04-08",
		jobId: "JOB-1842",
		aging: "6 days",
	},
	{
		authority: "City of Mesa",
		permitNo: "MESA-ENG-4207",
		status: "Approved",
		expiration: "2026-05-30",
		jobId: "JOB-1849",
		aging: "1 day",
	},
];

export const documents = [
	{
		name: "Northgate Design Print Rev C",
		type: "Design Print",
		jobId: "JOB-1842",
		uploaded: "2026-03-29",
		viewer: "Print Viewer",
		tags: "Bore, Utility Conflict",
	},
	{
		name: "Mesa Pole Transfer Permit",
		type: "Permit",
		jobId: "JOB-1849",
		uploaded: "2026-03-28",
		viewer: "Document Viewer",
		tags: "Aerial, Pole",
	},
	{
		name: "Tempe As-Built Package",
		type: "As-Built",
		jobId: "JOB-1902",
		uploaded: "2026-03-30",
		viewer: "Split Viewer",
		tags: "Closeout, QA",
	},
];

export const sheetTemplates = [
	"Job Tracker",
	"811 Locate Tracker",
	"Fiber Drop Log",
	"Utility Conflict Log",
	"Crew Schedule",
	"Material Tracker",
	"Permit Tracker",
	"Invoice Tracker",
	"Pole Audit Tracker",
	"Restoration Tracker",
	"QA Tracker",
	"Outage Log",
];

export const tierAccess: Record<Tier, string[]> = {
	starter: ["Jobs", "Basic Statuses", "Documents", "Limited Users"],
	pro: [
		"Starter features",
		"Email Extraction Visibility",
		"Spreadsheets",
		"811 Workflow Visibility",
		"Approvals",
		"Assignments",
		"Map Access",
	],
	enterprise: [
		"Pro features",
		"Full Admin Control",
		"Advanced Permissions",
		"Feature Toggles",
		"Workflow Controls",
		"Redline Visibility",
		"Cross-region Visibility",
	],
};
