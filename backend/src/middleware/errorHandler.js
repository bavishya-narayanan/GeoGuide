function asyncHandler(handler) {
    return (request, response, next) => Promise.resolve(handler(request, response, next)).catch(next);
}

function errorHandler(error, request, response, next) {
    if (response.headersSent) return next(error);
    const message = error.message || 'Internal server error';
    const status = error.status || (/must be|invalid|no more than|non-whitespace|positive integer|required/i.test(message)
        ? 400
        : /not found/i.test(message)
            ? 404
            : 500);
    if (status === 500) console.error(`${request.method} ${request.originalUrl}`, error);
    response.status(status).json({ success: false, error: status === 500 ? 'Internal server error' : message });
}

module.exports = { asyncHandler, errorHandler };