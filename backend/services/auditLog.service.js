const { store, nextId } = require('./_memoryStore');

const recordAuditEvent = ({ actionType, actor = 'system', payload = {} }) => {
  const entry = {
    id: nextId('audit'),
    actionType,
    actor,
    payload,
    timestamp: new Date().toISOString(),
  };
  store.auditLogs.push(entry);
  return entry;
};

const getAuditLog = () => store.auditLogs;

module.exports = {
  recordAuditEvent,
  getAuditLog,
};
