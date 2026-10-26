export default function errorHandler(err, req, res, next) {
  const message = err instanceof Error ? err.message : String(err);

  console.error(`${req.method} ${req.originalUrl} failed: ${message}`);

  res.status(500).json({
    error: "Something went wrong on the server",
  });
}