const { Hono } = require('hono');
const {
  createApprovalRequest,
  resolveApproval,
  getApprovalForJob,
  getPendingApprovals,
} = require('../services/approval.service');
const { recordAuditEvent } = require('../services/auditLog.service');

const approvalsRoutes = new Hono();

approvalsRoutes.post('/:jobId/request', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) || {};
  const result = createApprovalRequest({
    jobId: c.req.param('jobId'),
    actor: body.actor || 'system',
    payload: body,
  });

  recordAuditEvent({
    actionType: 'approval_requested',
    actor: body.actor || 'system',
    payload: { jobId: c.req.param('jobId'), ok: result.ok, reason: result.reason || null },
  });

  if (!result.ok) return c.json(result, 400);
  return c.json({ ok: true, data: result.approval, reused: Boolean(result.reused) });
});

approvalsRoutes.post('/:jobId/approve', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) || {};
  const result = resolveApproval({
    jobId: c.req.param('jobId'),
    actor: body.actor || 'manager',
    decision: 'approved',
    note: body.note,
  });

  recordAuditEvent({
    actionType: 'approval_decision',
    actor: body.actor || 'manager',
    payload: { jobId: c.req.param('jobId'), decision: 'approved', ok: result.ok, reason: result.reason || null },
  });

  if (!result.ok) return c.json(result, 400);
  return c.json({ ok: true, data: result.approval });
});

approvalsRoutes.post('/:jobId/reject', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) || {};
  const result = resolveApproval({
    jobId: c.req.param('jobId'),
    actor: body.actor || 'manager',
    decision: 'rejected',
    note: body.note,
  });

  recordAuditEvent({
    actionType: 'approval_decision',
    actor: body.actor || 'manager',
    payload: { jobId: c.req.param('jobId'), decision: 'rejected', ok: result.ok, reason: result.reason || null },
  });

  if (!result.ok) return c.json(result, 400);
  return c.json({ ok: true, data: result.approval });
});

approvalsRoutes.get('/pending', (c) => {
  return c.json({ ok: true, data: getPendingApprovals() });
});

approvalsRoutes.get('/:jobId', (c) => {
  const approval = getApprovalForJob(c.req.param('jobId'));
  if (!approval) return c.json({ ok: false, reason: 'No approval request found for this job.' }, 404);
  return c.json({ ok: true, data: approval });
});

module.exports = approvalsRoutes;
