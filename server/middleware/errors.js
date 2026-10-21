// Express 5 forwards rejected promises from async handlers here.
export function notFound(req, res) {
  res.status(404).json({ success: false, message: `No route for ${req.method} ${req.path}` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({ success: false, message: "Request body is not valid JSON." });
  }
  if (err?.name === "ValidationError") {
    const first = Object.values(err.errors || {})[0];
    return res.status(400).json({ success: false, message: first?.message || "Invalid data." });
  }
  if (err?.code === 11000) {
    return res.status(409).json({ success: false, message: "That record already exists." });
  }
  console.error(`[error] ${req.method} ${req.originalUrl}:`, err);
  res.status(500).json({ success: false, message: "Something went wrong on our side. Please try again." });
}
