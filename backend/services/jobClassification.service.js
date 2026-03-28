const VALID_CLASSIFICATIONS = ['underground', 'aerial', 'mixed', 'other'];

const inferClassification = (job = {}, overrideClassification) => {
  if (overrideClassification && VALID_CLASSIFICATIONS.includes(overrideClassification)) {
    return overrideClassification;
  }

  const haystack = [
    job.workTypeHint,
    job.title,
    job.description,
    job.documentMetadata && job.documentMetadata.scope,
    job.documentMetadata && job.documentMetadata.notes,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const mentionsUnderground = /underground|trench|bore|excavat|buried/.test(haystack);
  const mentionsAerial = /aerial|pole|overhead|span/.test(haystack);

  if (mentionsUnderground && mentionsAerial) return 'mixed';
  if (mentionsUnderground) return 'underground';
  if (mentionsAerial) return 'aerial';
  return 'other';
};

const classifyJob = (job = {}, requestedClassification) => {
  const classification = inferClassification(job, requestedClassification);
  const requiresLocate811 = classification === 'underground' || classification === 'mixed';

  return {
    classification,
    validClassifications: VALID_CLASSIFICATIONS,
    workflowFlags: {
      requiresLocate811,
      requiresManagementApproval: true,
    },
    statusSuggestion: requiresLocate811
      ? 'underground_review_required'
      : 'pending_management_approval',
  };
};

module.exports = {
  VALID_CLASSIFICATIONS,
  classifyJob,
};
