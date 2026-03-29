const { store, nextId } = require('./_memoryStore');

const normalizeJobInput = (input = {}) => {
  const sourceMetadata = {
    sourceSystem: input.sourceSystem || 'manual',
    sourceReference: input.sourceReference || null,
    receivedAt: input.receivedAt || new Date().toISOString(),
  };

  return {
    id: nextId('job'),
    title: input.title || 'Untitled Job',
    description: input.description || '',
    location: input.location || null,
    workTypeHint: input.workTypeHint || null,
    documentMetadata: input.documentMetadata || {},
    sourceMetadata,
    classification: null,
    workflow: {
      requiresLocate811: false,
    },
    status: 'job_created',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

const createJob = (input = {}) => {
  const job = normalizeJobInput(input);
  if (!job.title || !job.location) {
    job.status = 'pending_classification';
  }
  store.jobs.set(job.id, job);
  return job;
};

const getJob = (jobId) => store.jobs.get(jobId) || null;

const updateJob = (jobId, patch = {}) => {
  const existing = getJob(jobId);
  if (!existing) return null;

  const merged = {
    ...existing,
    ...patch,
    sourceMetadata: {
      ...existing.sourceMetadata,
      ...(patch.sourceMetadata || {}),
    },
    documentMetadata: {
      ...existing.documentMetadata,
      ...(patch.documentMetadata || {}),
    },
    workflow: {
      ...existing.workflow,
      ...(patch.workflow || {}),
    },
    updatedAt: new Date().toISOString(),
  };

  store.jobs.set(jobId, merged);
  return merged;
};

module.exports = {
  createJob,
  getJob,
  updateJob,
};
