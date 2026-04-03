import { jobs, seededDocuments, type JobDocument, type JobRecord, type Role } from "./data";

export interface SessionUser {
	id: string;
	email: string;
	password: string;
	role: Role;
	demoAllowed: boolean;
	demoMode: boolean;
	selectedJobId: string;
}

const users = new Map<string, SessionUser>();
const sessions = new Map<string, string>();

const documents: JobDocument[] = [...seededDocuments];
const unresolvedUploads: Array<{ id: string; name: string; reason: string; uploadedAt: string }> = [];

const defaultUsers: SessionUser[] = [
	{
		id: "U-1",
		email: "admin@crewproof.io",
		password: "admin123",
		role: "technical_admin",
		demoAllowed: true,
		demoMode: false,
		selectedJobId: jobs[0].id,
	},
	{
		id: "U-2",
		email: "pm@crewproof.io",
		password: "pm123",
		role: "project_manager",
		demoAllowed: false,
		demoMode: false,
		selectedJobId: jobs[1].id,
	},
];

for (const user of defaultUsers) users.set(user.email.toLowerCase(), user);

const randomId = () => Math.random().toString(36).slice(2);

export const createUser = (email: string, password: string): SessionUser | null => {
	const key = email.toLowerCase().trim();
	if (users.has(key)) return null;
	const user: SessionUser = {
		id: `U-${Date.now()}`,
		email: key,
		password,
		role: "project_manager",
		demoAllowed: false,
		demoMode: false,
		selectedJobId: jobs[0].id,
	};
	users.set(key, user);
	return user;
};

export const authenticate = (email: string, password: string): SessionUser | null => {
	const user = users.get(email.toLowerCase().trim());
	if (!user || user.password !== password) return null;
	return user;
};

export const issueSession = (user: SessionUser) => {
	const token = `cp_${randomId()}_${Date.now()}`;
	sessions.set(token, user.email.toLowerCase());
	return token;
};

export const getUserBySession = (token?: string | null): SessionUser | null => {
	if (!token) return null;
	const email = sessions.get(token);
	if (!email) return null;
	return users.get(email) ?? null;
};

export const clearSession = (token?: string | null) => {
	if (token) sessions.delete(token);
};

export const listJobs = (): JobRecord[] => jobs;
export const listDocuments = (): JobDocument[] => documents;

export const getJob = (jobId?: string | null): JobRecord | null => {
	if (!jobId) return null;
	return jobs.find((j) => j.id === jobId) ?? null;
};

export const setSelectedJob = (user: SessionUser, jobId: string) => {
	if (!getJob(jobId)) return false;
	user.selectedJobId = jobId;
	return true;
};

const categoryKeywords: Record<JobDocument["category"], string[]> = {
	"design print": ["design", "print"],
	"utility map": ["utility", "map"],
	permit: ["permit"],
	"811 file": ["811", "ticket", "locate"],
	"work order": ["work order", "wo-"],
	"customer request": ["customer", "request"],
	invoice: ["invoice", "inv-"],
	"field photo": ["photo", "jpg", "png"],
	redline: ["redline"],
	"as-built": ["as-built", "asbuilt"],
	"closeout package": ["closeout"],
	spreadsheet: ["sheet", "xlsx", "csv"],
	"uncategorized / review required": [],
};

const autoCategory = (name: string): { category: JobDocument["category"]; reviewRequired: boolean } => {
	const lower = name.toLowerCase();
	for (const [category, keywords] of Object.entries(categoryKeywords) as Array<
		[JobDocument["category"], string[]]
	>) {
		if (category === "uncategorized / review required") continue;
		if (keywords.some((keyword) => lower.includes(keyword))) {
			return { category, reviewRequired: false };
		}
	}
	return { category: "uncategorized / review required", reviewRequired: true };
};

export const attachUpload = (name: string, jobId?: string | null) => {
	const now = new Date().toISOString();
	if (!jobId || !getJob(jobId)) {
		const unresolved = { id: `UNRES-${Date.now()}`, name, reason: "No matching job selected", uploadedAt: now };
		unresolvedUploads.push(unresolved);
		return { attached: false, unresolved };
	}
	const { category, reviewRequired } = autoCategory(name);
	const doc: JobDocument = {
		id: `DOC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
		jobId,
		name,
		category,
		reviewRequired,
		uploadedAt: now,
	};
	documents.unshift(doc);
	return { attached: true, document: doc };
};

export const getUnresolvedUploads = () => unresolvedUploads;

export interface ComputedReadiness {
	state: "Ready" | "Blocked" | "At Risk" | "Pending Review";
	readyForBilling: boolean;
	billingState: "blocked" | "pending review" | "ready for billing" | "billed";
	missingItems: string[];
	reasons: string[];
}

export const computeReadiness = (job: JobRecord): ComputedReadiness => {
	const jobDocs = documents.filter((d) => d.jobId === job.id);
	const hasCategory = (category: JobDocument["category"]) => jobDocs.some((d) => d.category === category);
	const missingItems: string[] = [];
	const reasons: string[] = [];
	let blocked = false;

	if (job.requires811 && !job.locateTicket) {
		missingItems.push("811 ticket");
		reasons.push("Cannot Start: 811 ticket missing");
		blocked = true;
	}
	if (job.locateTicket?.status === "expired") {
		reasons.push("Cannot Start: 811 ticket expired");
		blocked = true;
	}
	if (job.locateTicket?.status === "conflict") {
		reasons.push("Cannot Start: unresolved gas conflict");
		blocked = true;
	}
	if (job.locateTicket?.status === "missing response") {
		reasons.push("Cannot Start: utility response missing");
		missingItems.push("utility responses");
	}
	if (job.permitRequired && job.permitStatus !== "approved") {
		missingItems.push("approved permit");
		reasons.push("Cannot Start: permit not approved");
	}

	for (const required of job.closeoutRequiredDocs) {
		if (!hasCategory(required)) missingItems.push(required);
	}
	if (!hasCategory("field photo")) reasons.push("Cannot Close: field photos missing");
	if (job.redlineStatus !== "approved") reasons.push("Cannot Close: redline not approved");
	if (job.approvalStatus !== "approved") reasons.push("Cannot Bill: supervisor approval required");

	const pendingReview = jobDocs.some((d) => d.reviewRequired) || job.redlineStatus === "submitted";
	const closeoutIncomplete = missingItems.length > 0 || job.redlineStatus !== "approved";
	const readyForBilling = !closeoutIncomplete && job.approvalStatus === "approved" && !blocked;

	const state = blocked ? "Blocked" : pendingReview ? "Pending Review" : missingItems.length > 0 ? "At Risk" : "Ready";
	const billingState = readyForBilling
		? "ready for billing"
		: pendingReview
			? "pending review"
			: "blocked";

	return { state, readyForBilling, billingState, missingItems: [...new Set(missingItems)], reasons: [...new Set(reasons)] };
};
