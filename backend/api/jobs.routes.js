const { Hono } = require('hono');
const { createJob, getJob, updateJob } = require('../services/jobCreation.service');
const { classifyJob } = require('../services/jobClassification.service');
const { recordAuditEvent } = require('../services/auditLog.service');

const jobsRoutes = new Hono();

jobsRoutes.post('/', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) || {};
  const actor = body.actor || 'system';
  const job = createJob(body);
  recordAuditEvent({ actionType: 'job_created', actor, payload: { jobId: job.id } });
  return c.json({ ok: true, data: job }, 201);
});

jobsRoutes.get('/:jobId', (c) => {
  const job = getJob(c.req.param('jobId'));
  if (!job) return c.json({ ok: false, reason: 'Job not found.' }, 404);
  return c.json({ ok: true, data: job });
});

jobsRoutes.patch('/:jobId', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) || {};
  const job = updateJob(c.req.param('jobId'), body);
  if (!job) return c.json({ ok: false, reason: 'Job not found.' }, 404);
  recordAuditEvent({ actionType: 'job_updated', actor: body.actor || 'system', payload: { jobId: job.id } });
  return c.json({ ok: true, data: job });
});

jobsRoutes.post('/:jobId/classify', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) || {};
  const job = getJob(c.req.param('jobId'));
  if (!job) return c.json({ ok: false, reason: 'Job not found.' }, 404);

  const result = classifyJob(job, body.classification);
  const updated = updateJob(job.id, {
    classification: result.classification,
    workflow: {
      ...(job.workflow || {}),
      ...result.workflowFlags,
    },
    status: result.statusSuggestion,
  });

  recordAuditEvent({
    actionType: 'job_classified',
    actor: body.actor || 'system',
    payload: { jobId: job.id, classification: result.classification },
  });

  return c.json({ ok: true, data: updated, classification: result });
});

jobsRoutes.get('/:jobId/map-data', (c) => {
  const job = getJob(c.req.param('jobId'));
  if (!job) return c.json({ ok: false, reason: 'Job not found.' }, 404);

  return c.json({
    ok: true,
    data: {
      jobId: job.id,
      location: job.location,
      mapPins: [],
      redlineReady: false,
      compatibility: {
        jsonImport811: true,
        fieldUpdates: true,
        redlineGeneration: true,
      },
    },
  });
});

module.exports = jobsRoutes;
