import { ZodError } from "zod";

export function validate(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        // Zod v4 uses .issues; fall back to .errors for v3 compatibility
        const issues = err.issues ?? err.errors ?? [];
        const message = issues[0]?.message || "Validation error";
        return res.status(400).json({ message });
      }
      next(err);
    }
  };
}
