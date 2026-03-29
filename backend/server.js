const { Hono } = require('hono');

const jobsRoutes = require('./api/jobs.routes');
const locatesRoutes = require('./api/locates.routes');
const approvalsRoutes = require('./api/approvals.routes');
const assignmentsRoutes = require('./api/assignments.routes');

const JSON_BODY_LIMIT_BYTES = 100_000;

const app = new Hono();

app.use('*', async (c, next) => {
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('Referrer-Policy', 'no-referrer');
});

app.use('/api/*', async (c, next) => {
  if (!['POST', 'PUT', 'PATCH'].includes(c.req.method)) {
    await next();
    return;
  }

  const contentType = c.req.header('content-type') ?? '';
  if (!contentType.toLowerCase().startsWith('application/json')) {
    return c.json({ ok: false, reason: 'Use application/json' }, 415);
  }

  const rawLength = c.req.header('content-length');
  if (rawLength) {
    const contentLength = Number(rawLength);
    if (!Number.isNaN(contentLength) && contentLength > JSON_BODY_LIMIT_BYTES) {
      return c.json({ ok: false, reason: 'Payload too large.', maxBytes: JSON_BODY_LIMIT_BYTES }, 413);
    }
  }

  await next();
});

app.get('/api/health', (c) => {
  return c.json({
    ok: true,
    service: 'crew-proof-backend',
    timestamp: new Date().toISOString(),
  });
});

app.route('/api/jobs', jobsRoutes);
app.route('/api/locates', locatesRoutes);
app.route('/api/approvals', approvalsRoutes);
app.route('/api/assignments', assignmentsRoutes);

app.notFound((c) => c.json({ ok: false, reason: 'Not Found' }, 404));

module.exports = app;
