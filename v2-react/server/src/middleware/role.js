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

module.exports = { authorize, authorizeStoreAccess };
