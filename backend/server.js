const { Hono } = require('hono');

const jobsRoutes = require('./api/jobs.routes');
const locatesRoutes = require('./api/locates.routes');
const approvalsRoutes = require('./api/approvals.routes');
const assignmentsRoutes = require('./api/assignments.routes');

const app = new Hono();

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
