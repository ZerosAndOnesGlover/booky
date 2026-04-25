const SEQUELIZE_ERROR_NAMES = new Set([
  'SequelizeValidationError',
  'SequelizeUniqueConstraintError',
  'SequelizeForeignKeyConstraintError',
  'SequelizeDatabaseError',
  'SequelizeConnectionError',
]);

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);

  const status = err.status || 500;

  // Never leak raw Sequelize or internal errors to clients in production
  let message = err.message || 'Internal server error';
  if (process.env.NODE_ENV !== 'development' && (status === 500 || SEQUELIZE_ERROR_NAMES.has(err.name))) {
    message = 'Internal server error';
  }

  res.status(status).json({
    error: true,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
