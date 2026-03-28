const { store, nextId } = require('./_memoryStore');
const { getJob, updateJob } = require('./jobCreation.service');
const { getApprovalForJob } = require('./approval.service');

const ensureReadyForAssignment = (job) => {
  const approval = getApprovalForJob(job.id);
  if (!approval || (approval.status !== 'approved' && approval.status !== 'auto_approved')) {
    return { ok: false, reason: 'Management approval is required before assignment issue.' };
  }

  const needsLocate = job.classification === 'underground' || job.classification === 'mixed';
  if (needsLocate && (!job.workflow || !job.workflow.locateValidated)) {
    return {
      ok: false,
      reason: 'Underground/mixed jobs cannot be issued until locate compliance validation passes.',
    };
  }

  return { ok: true };
};

const issueAssignment = ({ jobId, actor = 'area_manager', payload = {} }) => {
  const job = getJob(jobId);
  if (!job) return { ok: false, reason: 'Job not found.' };

  const readiness = ensureReadyForAssignment(job);
  if (!readiness.ok) return readiness;

  const assignment = {
    id: nextId('assignment'),
    jobId,
    status: 'issued',
    assigneeId: payload.assigneeId || null,
    assigneeType: payload.assigneeType || 'employee',
    issuedBy: actor,
    metadata: payload.metadata || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.assignments.set(assignment.id, assignment);
  updateJob(jobId, { status: 'assigned_by_area_manager' });

  return { ok: true, assignment };
};

const reassign = ({ assignmentId, actor = 'area_manager', payload = {} }) => {
  const existing = store.assignments.get(assignmentId);
  if (!existing) return { ok: false, reason: 'Assignment not found.' };

  const updated = {
    ...existing,
    assigneeId: payload.assigneeId || existing.assigneeId,
    assigneeType: payload.assigneeType || existing.assigneeType,
    metadata: {
      ...(existing.metadata || {}),
      ...(payload.metadata || {}),
      reassignedBy: actor,
      reassignedAt: new Date().toISOString(),
    },
    updatedAt: new Date().toISOString(),
  };

  store.assignments.set(assignmentId, updated);
  return { ok: true, assignment: updated };
};

const getAssignmentsByJob = (jobId) =>
  Array.from(store.assignments.values()).filter((item) => item.jobId === jobId);

const getActiveAssignments = () =>
  Array.from(store.assignments.values()).filter((item) =>
    ['queued', 'issued', 'accepted', 'in_progress', 'paused'].includes(item.status),
  );

module.exports = {
  issueAssignment,
  reassign,
  getAssignmentsByJob,
  getActiveAssignments,
};
