const { Hono } = require('hono');
const {
  issueAssignment,
  reassign,
  getAssignmentsByJob,
  getActiveAssignments,
} = require('../services/assignment.service');
const { recordAuditEvent } = require('../services/auditLog.service');

const assignmentsRoutes = new Hono();

assignmentsRoutes.post('/:jobId/issue', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) || {};
  const result = issueAssignment({
    jobId: c.req.param('jobId'),
    actor: body.actor || 'area_manager',
    payload: body,
  });

  recordAuditEvent({
    actionType: 'assignment_issued',
    actor: body.actor || 'area_manager',
    payload: { jobId: c.req.param('jobId'), ok: result.ok, reason: result.reason || null },
  });

  if (!result.ok) return c.json(result, 400);
  return c.json({ ok: true, data: result.assignment }, 201);
});

assignmentsRoutes.patch('/:assignmentId/reassign', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) || {};
  const result = reassign({
    assignmentId: c.req.param('assignmentId'),
    actor: body.actor || 'area_manager',
    payload: body,
  });

  recordAuditEvent({
    actionType: 'assignment_reassigned',
    actor: body.actor || 'area_manager',
    payload: { assignmentId: c.req.param('assignmentId'), ok: result.ok, reason: result.reason || null },
  });

  if (!result.ok) return c.json(result, 404);
  return c.json({ ok: true, data: result.assignment });
});

assignmentsRoutes.get('/active', (c) => {
  return c.json({ ok: true, data: getActiveAssignments() });
});

assignmentsRoutes.get('/:jobId', (c) => {
  return c.json({ ok: true, data: getAssignmentsByJob(c.req.param('jobId')) });
});

module.exports = assignmentsRoutes;
