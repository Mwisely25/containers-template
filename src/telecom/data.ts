export type Role = "technical_admin" | "admin" | "project_manager" | "area_manager" | "crew" | "customer_viewer";

export type WorkspaceKey =
	| "dashboard"
	| "jobs"
	| "documents"
	| "maps"
	| "811"
	| "closeout"
	| "billing"
	| "admin"
	| "job-detail";

export interface UtilityResponse {
	utility: string;
	status: "clear" | "missing response" | "conflict" | "expired";
	note: string;
}

export interface LocateTicket {
	ticket: string;
	status: "active" | "clear" | "missing response" | "conflict" | "expired";
	due: string;
	polygon: Array<[number, number]>;
	responses: UtilityResponse[];
}

export interface JobDocument {
	id: string;
	jobId: string;
	name: string;
	category:
		| "design print"
		| "utility map"
		| "permit"
		| "811 file"
		| "work order"
		| "customer request"
		| "invoice"
		| "field photo"
		| "redline"
		| "as-built"
		| "closeout package"
		| "spreadsheet"
		| "uncategorized / review required";
	reviewRequired: boolean;
	uploadedAt: string;
}

export interface JobRecord {
	id: string;
	workOrder: string;
	name: string;
	market: string;
	address: string;
	lat: number;
	lng: number;
	status: string;
	crew: string;
	risk: "High" | "Moderate" | "Low";
	permitRequired: boolean;
	permitStatus: "missing" | "submitted" | "approved";
	requires811: boolean;
	locateTicket?: LocateTicket;
	redlineStatus: "missing" | "in progress" | "submitted" | "approved";
	gpsRouteStatus: "missing" | "captured";
	approvalStatus: "required" | "approved";
	closeoutRequiredDocs: Array<JobDocument["category"]>;
	route: Array<[number, number]>;
}

export const workspaceTitles: Record<WorkspaceKey, string> = {
	dashboard: "CrewProof Dashboard",
	jobs: "Jobs",
	documents: "Documents Center",
	maps: "Map Workspace",
	"811": "811 Tracker",
	closeout: "Closeout",
	billing: "Billing Readiness",
	admin: "Admin",
	"job-detail": "Job Detail",
};

export const navItems: Array<{ key: WorkspaceKey; label: string }> = [
	{ key: "dashboard", label: "Dashboard" },
	{ key: "jobs", label: "Jobs" },
	{ key: "documents", label: "Documents" },
	{ key: "maps", label: "Map" },
	{ key: "811", label: "811" },
	{ key: "closeout", label: "Closeout" },
	{ key: "billing", label: "Billing" },
	{ key: "admin", label: "Admin" },
];

export const jobs: JobRecord[] = [
	{
		id: "JOB-1842",
		workOrder: "WO-99310",
		name: "Northgate Fiber Drop Package",
		market: "Phoenix East",
		address: "2149 E Chandler Blvd, Phoenix, AZ",
		lat: 33.3068,
		lng: -112.0362,
		status: "Cannot Start: unresolved gas conflict",
		crew: "Crew 7 - Bore",
		risk: "High",
		permitRequired: true,
		permitStatus: "submitted",
		requires811: true,
		locateTicket: {
			ticket: "AZ-811-552001",
			status: "conflict",
			due: "2026-04-04",
			polygon: [
				[33.3074, -112.038],
				[33.3077, -112.0352],
				[33.3063, -112.0348],
				[33.3059, -112.0373],
			],
			responses: [
				{ utility: "Power", status: "clear", note: "Marked" },
				{ utility: "Gas", status: "conflict", note: "Crossing conflict HH-212" },
				{ utility: "Telecom", status: "clear", note: "Marked" },
			],
		},
		redlineStatus: "in progress",
		gpsRouteStatus: "captured",
		approvalStatus: "required",
		closeoutRequiredDocs: ["field photo", "as-built", "closeout package", "invoice"],
		route: [
			[33.3061, -112.0376],
			[33.3066, -112.0367],
			[33.3072, -112.0359],
		],
	},
	{
		id: "JOB-1849",
		workOrder: "WO-99355",
		name: "Mesa Aerial Pole Transfer",
		market: "Mesa",
		address: "920 N Country Club Dr, Mesa, AZ",
		lat: 33.4315,
		lng: -111.842,
		status: "Ready",
		crew: "Crew 2 - Aerial",
		risk: "Moderate",
		permitRequired: true,
		permitStatus: "approved",
		requires811: false,
		redlineStatus: "approved",
		gpsRouteStatus: "captured",
		approvalStatus: "approved",
		closeoutRequiredDocs: ["field photo", "closeout package", "invoice"],
		route: [
			[33.432, -111.843],
			[33.4316, -111.8422],
			[33.4312, -111.8412],
		],
	},
	{
		id: "JOB-1902",
		workOrder: "WO-99710",
		name: "Tempe Handhole Retrofit",
		market: "Tempe",
		address: "201 S Mill Ave, Tempe, AZ",
		lat: 33.4288,
		lng: -111.9407,
		status: "Pending Review",
		crew: "Crew 11 - Restoration",
		risk: "Low",
		permitRequired: false,
		permitStatus: "approved",
		requires811: true,
		locateTicket: {
			ticket: "AZ-811-551941",
			status: "active",
			due: "2026-04-06",
			polygon: [
				[33.4294, -111.9412],
				[33.4292, -111.9402],
				[33.4284, -111.9403],
				[33.4286, -111.9413],
			],
			responses: [
				{ utility: "Water", status: "clear", note: "Marked" },
				{ utility: "Telecom", status: "missing response", note: "Awaiting response" },
			],
		},
		redlineStatus: "submitted",
		gpsRouteStatus: "captured",
		approvalStatus: "required",
		closeoutRequiredDocs: ["field photo", "redline", "as-built", "closeout package"],
		route: [
			[33.4286, -111.9413],
			[33.4288, -111.9408],
			[33.4291, -111.9404],
		],
	},
];

export const seededDocuments: JobDocument[] = [
	{
		id: "DOC-1",
		jobId: "JOB-1842",
		name: "Northgate Design Print Rev C.pdf",
		category: "design print",
		reviewRequired: false,
		uploadedAt: "2026-04-01T07:31:00.000Z",
	},
	{
		id: "DOC-2",
		jobId: "JOB-1842",
		name: "Northgate Permit Packet.pdf",
		category: "permit",
		reviewRequired: false,
		uploadedAt: "2026-04-01T08:05:00.000Z",
	},
	{
		id: "DOC-3",
		jobId: "JOB-1902",
		name: "Tempe progress photos.zip",
		category: "field photo",
		reviewRequired: false,
		uploadedAt: "2026-04-01T10:11:00.000Z",
	},
];
