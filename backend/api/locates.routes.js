const { Hono } = require('hono');
const {
  createDraftTicket,
  validateTicket,
  submitTicket,
  getTicket,
  getTicketPinData,
} = require('../services/locateWorkflow.service');
const { recordAuditEvent } = require('../services/auditLog.service');

const locatesRoutes = new Hono();

locatesRoutes.post('/draft', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) || {};
  if (!body.jobId) return c.json({ ok: false, reason: 'jobId is required.' }, 400);

  const result = createDraftTicket({ jobId: body.jobId, actor: body.actor || 'system', payload: body });
  if (!result.ok) return c.json(result, 400);

  recordAuditEvent({
    actionType: 'locate_draft_created',
    actor: body.actor || 'system',
    payload: { jobId: body.jobId, ticketId: result.ticket.id },
  });

  return c.json({ ok: true, data: result.ticket }, 201);
});

locatesRoutes.post('/validate', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) || {};
  if (!body.ticketId) return c.json({ ok: false, reason: 'ticketId is required.' }, 400);

  const result = validateTicket({ ticketId: body.ticketId });

  recordAuditEvent({
    actionType: 'locate_validation',
    actor: body.actor || 'system',
    payload: { ticketId: body.ticketId, ok: result.ok, reasons: result.reasons || [] },
  });

  return c.json(
    {
      ok: result.ok,
      data: result.ticket || null,
      reason: result.reason,
      reasons: result.reasons || [],
    },
    result.ok ? 200 : 400,
  );
});

locatesRoutes.get('/:ticketId', (c) => {
  const ticket = getTicket(c.req.param('ticketId'));
  if (!ticket) return c.json({ ok: false, reason: 'Ticket not found.' }, 404);
  return c.json({ ok: true, data: ticket });
});

locatesRoutes.get('/:ticketId/pin-data', (c) => {
  const data = getTicketPinData(c.req.param('ticketId'));
  if (!data) return c.json({ ok: false, reason: 'Ticket not found.' }, 404);
  return c.json({ ok: true, data });
});

locatesRoutes.post('/:ticketId/submit', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) || {};
  const result = submitTicket({ ticketId: c.req.param('ticketId') });

  recordAuditEvent({
    actionType: 'locate_submitted',
    actor: body.actor || 'system',
    payload: { ticketId: c.req.param('ticketId'), ok: result.ok, reason: result.reason || null },
  });

  if (!result.ok) return c.json(result, 400);
  return c.json({ ok: true, data: result.ticket });
});

module.exports = locatesRoutes;
