const { store, nextId } = require('./_memoryStore');
const { getJob, updateJob } = require('./jobCreation.service');

const VALID_DECISIONS = ['approved', 'rejected'];

const createApprovalRequest = ({ jobId, actor = 'system', payload = {} }) => {
  const job = getJob(jobId);
  if (!job) return { ok: false, reason: 'Job not found.' };

  const existing = Array.from(store.approvals.values()).find(
    (approval) => approval.jobId === jobId && approval.status === 'pending',
  );
  if (existing) return { ok: true, approval: existing, reused: true };

  const approval = {
    id: nextId('approval'),
    jobId,
    status: 'pending',
    requestedBy: actor,
    reason: payload.reason || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.approvals.set(approval.id, approval);
  updateJob(jobId, { status: 'pending_management_approval' });
  return { ok: true, approval };
};

const ensureLocateGate = (job) => {
  const needsLocate = job.classification === 'underground' || job.classification === 'mixed';
  if (!needsLocate) return { ok: true };

  if (!job.workflow || !job.workflow.locateValidated) {
    return {
      ok: false,
      reason: 'Locate validation is required before underground/mixed job approval.',
    };
  }
  return { ok: true };
};

const resolveApproval = ({ jobId, actor = 'manager', decision, note }) => {
  if (!VALID_DECISIONS.includes(decision)) {
    return { ok: false, reason: `Invalid decision. Allowed values: ${VALID_DECISIONS.join(', ')}.` };
  }

  const job = getJob(jobId);
  if (!job) return { ok: false, reason: 'Job not found.' };

  if (!job.classification) {
    return { ok: false, reason: 'Job must be classified before an approval decision can be made.' };
  }

  const approval = Array.from(store.approvals.values())
    .filter((item) => item.jobId === jobId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  if (!approval) return { ok: false, reason: 'No approval request found for job.' };
  if (approval.status !== 'pending') return { ok: false, reason: `Approval already ${approval.status}.` };

  if (decision === 'approved') {
    const locateGate = ensureLocateGate(job);
    if (!locateGate.ok) return locateGate;
  }

  const updated = {
    ...approval,
    status: decision,
    decidedBy: actor,
    decisionNote: note || null,
    decidedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.approvals.set(updated.id, updated);
  updateJob(jobId, { status: decision === 'approved' ? 'approved_for_issue' : 'rejected' });

  return { ok: true, approval: updated };
};

const getApprovalForJob = (jobId) =>
  Array.from(store.approvals.values())
    .filter((item) => item.jobId === jobId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] || null;

const getPendingApprovals = () =>
  Array.from(store.approvals.values()).filter((item) => item.status === 'pending');

module.exports = {
  createApprovalRequest,
  resolveApproval,
  getApprovalForJob,
  getPendingApprovals,
};
