const { ApiError } = require('../utils/apiError');

function notFoundHandler(req, res, next) {
  next(new ApiError(404, `No route matches ${req.method} ${req.path}`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: { message: err.message, details: err.details || null } });
  }
  console.error('[unhandled error]', err);
  return res.status(500).json({ error: { message: 'Something went wrong on our end. Please try again.' } });
}

module.exports = { notFoundHandler, errorHandler };
