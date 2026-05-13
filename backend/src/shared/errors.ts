export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code = "REQUEST_ERROR"
  ) {
    super(message);
  }
}

export function unauthorized(message = "Authentication required.") {
  return new HttpError(401, message, "UNAUTHORIZED");
}

export function forbidden(message = "Insufficient permissions.") {
  return new HttpError(403, message, "FORBIDDEN");
}

export function conflict(message: string) {
  return new HttpError(409, message, "CONFLICT");
}

export function badRequest(message: string) {
  return new HttpError(400, message, "BAD_REQUEST");
}

export function notFound(message: string) {
  return new HttpError(404, message, "NOT_FOUND");
}
