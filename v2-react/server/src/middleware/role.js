const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

const authorizeStoreAccess = (storeField = 'storeId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role === 'admin' || req.user.role === 'accountant') {
      return next();
    }

    const storeId = req.params[storeField] || req.body[storeField];
    if (storeId && req.user.store_id !== parseInt(storeId, 10)) {
      return res.status(403).json({ error: 'Access denied to this store' });
    }

    next();
  };
};

/**
 * Checks that the acting user belongs to the correct side of the order.
 * storeField: 'from_store' = supplier side; 'to_store' = requester side.
 */
const authorizeOrderAction = (allowedRoles, storeField) => {
  return async (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (req.user.role === 'admin') return next();

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    try {
      const { Order } = require('../models');
      const order = await Order.findByPk(req.params.id, {
        attributes: ['from_store_id', 'to_store_id'],
      });
      if (!order) return res.status(404).json({ error: 'Order not found' });

      const userStoreId = req.user.store_id;
      if (storeField === 'from_store' && order.from_store_id !== userStoreId) {
        return res.status(403).json({ error: 'Only the supplier store can perform this action' });
      }
      if (storeField === 'to_store' && order.to_store_id !== userStoreId) {
        return res.status(403).json({ error: 'Only the destination store can perform this action' });
      }

      next();
    } catch (err) {
      res.status(500).json({ error: 'Authorization check failed' });
    }
  };
};

module.exports = { authorize, authorizeStoreAccess, authorizeOrderAction };
