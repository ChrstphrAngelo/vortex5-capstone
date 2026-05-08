const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    module: { type: String, required: true }, // e.g., Configuration, Tasks, Users
    action: { type: String, required: true }, // description of what happened
    user: { type: String, required: true },   // who performed the action
    date: { type: Date, default: Date.now }   // when it happened
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
