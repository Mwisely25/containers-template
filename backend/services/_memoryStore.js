const store = {
  jobs: new Map(),
  tickets: new Map(),
  approvals: new Map(),
  assignments: new Map(),
  auditLogs: [],
  counters: {
    job: 0,
    ticket: 0,
    approval: 0,
    assignment: 0,
    audit: 0,
  },
};

const nextId = (prefix) => {
  store.counters[prefix] += 1;
  return `${prefix}_${String(store.counters[prefix]).padStart(6, "0")}`;
};

module.exports = {
  store,
  nextId,
};
