const { AuditLog } = require('../models');

const auditLog = (action, entityType) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = async function (data) {
      try {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          await AuditLog.create({
            user_id: req.user ? req.user.id : null,
            action,
            entity_type: entityType,
            entity_id: data?.data?.id || req.params.id || null,
            old_values: req._auditOldValues || null,
            new_values: req.body || null,
            ip_address: req.ip || req.connection?.remoteAddress,
            user_agent: req.headers['user-agent'],
          });
        }
      } catch (err) {
        console.error('Audit log error:', err);
      }

      return originalJson(data);
    };

    next();
  };
};

const captureOldValues = (model) => {
  return async (req, res, next) => {
    try {
      if (req.params.id) {
        const record = await model.findByPk(req.params.id);
        if (record) {
          req._auditOldValues = record.toJSON();
        }
      }
    } catch (err) {
      console.error('Capture old values error:', err);
    }
    next();
  };
};

module.exports = { auditLog, captureOldValues };
