const AuditLog = require('../models/AuditLogModel');

const logAudit = async ({ module, action, user }) => {
  try {
    await AuditLog.create({
      module,
      action,
      user
    });
  } catch (error) {
    console.error('Audit log error:', error.message);
  }
};

module.exports = logAudit;
