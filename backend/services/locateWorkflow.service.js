const path = require('path');
const { store, nextId } = require('./_memoryStore');
const { getJob, updateJob } = require('./jobCreation.service');

let locateComplianceUtil = null;
try {
  // Keep compatibility with planned utility location.
  // eslint-disable-next-line import/no-dynamic-require, global-require
  locateComplianceUtil = require(path.resolve(process.cwd(), 'src/utils/locateCompliance.js'));
} catch (_error) {
  locateComplianceUtil = null;
}

const runLocateCompliance = (job, ticket) => {
  if (locateComplianceUtil && typeof locateComplianceUtil === 'function') {
    return locateComplianceUtil(job, ticket);
  }
  if (locateComplianceUtil && typeof locateComplianceUtil.validateLocateCompliance === 'function') {
    return locateComplianceUtil.validateLocateCompliance(job, ticket);
  }

  const reasons = [];
  if (!job.location) reasons.push('Job location is required for 811 submission.');
  if (!ticket.workAreaDescription) reasons.push('Work area description is required.');
  if (!ticket.requestedStartDate) reasons.push('Requested start date is required.');

  return {
    isCompliant: reasons.length === 0,
    reasons,
  };
};

const createDraftTicket = ({ jobId, actor = 'system', payload = {} }) => {
  const job = getJob(jobId);
  if (!job) {
    return { ok: false, reason: 'Job not found.' };
  }

  const ticket = {
    id: nextId('ticket'),
    jobId,
    status: 'draft',
    workAreaDescription: payload.workAreaDescription || '',
    requestedStartDate: payload.requestedStartDate || null,
    metadata: payload.metadata || {},
    createdBy: actor,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    compliance: null,
  };

  store.tickets.set(ticket.id, ticket);
  if (job.status === 'underground_review_required') {
    updateJob(job.id, { status: '811_draft_generated' });
  }

  return { ok: true, ticket };
};

const validateTicket = ({ ticketId }) => {
  const ticket = store.tickets.get(ticketId);
  if (!ticket) return { ok: false, reason: 'Ticket not found.' };

  const job = getJob(ticket.jobId);
  if (!job) return { ok: false, reason: 'Associated job not found.' };

  const result = runLocateCompliance(job, ticket);
  const isCompliant = Boolean(result && result.isCompliant);
  const reasons = (result && result.reasons) || [];

  const updated = {
    ...ticket,
    status: isCompliant ? 'validated' : 'review_required',
    compliance: {
      passed: isCompliant,
      reasons,
      checkedAt: new Date().toISOString(),
    },
    updatedAt: new Date().toISOString(),
  };
  store.tickets.set(ticketId, updated);

  updateJob(job.id, {
    status: isCompliant ? 'pending_management_approval' : '811_validation_failed',
    workflow: {
      ...(job.workflow || {}),
      locateValidated: isCompliant,
    },
  });

  return { ok: isCompliant, ticket: updated, reasons };
};

const submitTicket = ({ ticketId }) => {
  const ticket = store.tickets.get(ticketId);
  if (!ticket) return { ok: false, reason: 'Ticket not found.' };

  if (!ticket.compliance || !ticket.compliance.passed) {
    return { ok: false, reason: 'Ticket must pass validation before submit.' };
  }

  const updated = {
    ...ticket,
    status: 'submitted',
    submittedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.tickets.set(ticketId, updated);
  return { ok: true, ticket: updated };
};

const getTicket = (ticketId) => store.tickets.get(ticketId) || null;

const getTicketPinData = (ticketId) => {
  const ticket = getTicket(ticketId);
  if (!ticket) return null;
  const job = getJob(ticket.jobId);

  return {
    ticketId: ticket.id,
    jobId: ticket.jobId,
    location: job && job.location ? job.location : null,
    metadata: ticket.metadata || {},
    mapProvider: 'placeholder',
  };
};

module.exports = {
  createDraftTicket,
  validateTicket,
  submitTicket,
  getTicket,
  getTicketPinData,
};
