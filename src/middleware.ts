/// <reference path="./express.d.ts" />
import type { Request, Response, NextFunction, RequestHandler } from "express";
import type {
  AuthContext,
  ErrorResponseShape,
  RequireAuthOptions,
  RequiredRoles,
} from "./types.js";

export function defaultExtractBearer(req: Request): string | null {
  const h = req.headers["authorization"];
  if (!h) return null;
  const m = /^Bearer\s+(.+)$/i.exec(String(h));
  return m?.[1] ?? null;
}

export function defaultMapErrorToStatus(code: string): number {
  switch (code) {
    case "AUTH_FORBIDDEN":
      return 403;
    case "AUTH_TOKEN_EXPIRED":
    case "AUTH_TOKEN_INVALID":
    case "AUTH_TOKEN_STALE":
      return 401;
    case "AUTH_CONFIG_ERROR":
    case "AUTH_INTERNAL_ERROR":
      return 500;
    default:
      // safest default: treat unknown auth failures as unauthorized
      return 401;
  }
}

export function defaultFormatError(err: {
  code: string;
  message: string;
  details?: unknown;
}): ErrorResponseShape {
  return {
    error: { code: err.code, message: err.message, details: err.details },
  };
}

function attachAuth(req: Request, auth: AuthContext) {
  // typed via module augmentation (src/express.d.ts)
  (req as any).auth = auth;
}

export function requireAuth(opts: RequireAuthOptions): RequestHandler {
  const extractToken = opts.extractToken ?? defaultExtractBearer;
  const mapErrorToStatus = opts.mapErrorToStatus ?? defaultMapErrorToStatus;
  const formatError = opts.formatError ?? defaultFormatError;

  return async (req: Request, res: Response, next: NextFunction) => {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json(
        formatError({
          code: "AUTH_TOKEN_INVALID",
          message: "Missing Bearer token",
        }),
      );
    }

    const decision = await opts.authCore.doAuthorize({
      token,
      required: opts.required,
      expectedAudience: opts.expectedAudience,
    });

    if (!decision.ok) {
      opts.onError?.(decision.error, req);
      return res
        .status(mapErrorToStatus(decision.error.code))
        .json(formatError(decision.error));
    }

    attachAuth(req, {
      userId: decision.userId,
      roles: decision.roles,
      principal: decision.principal,
      roleStamp: decision.roleStamp,
      roleVersion: decision.roleVersion,
      claims: decision.claims,
      token,
    });

    next();
  };
}

export function optionalAuth(
  opts: Omit<RequireAuthOptions, "required">,
): RequestHandler {
  const extractToken = opts.extractToken ?? defaultExtractBearer;
  const mapErrorToStatus = opts.mapErrorToStatus ?? defaultMapErrorToStatus;
  const formatError = opts.formatError ?? defaultFormatError;

  return async (req: Request, res: Response, next: NextFunction) => {
    const token = extractToken(req);
    if (!token) {
      // no token -> allow and leave req.auth undefined
      return next();
    }

    const decision = await opts.authCore.doAuthorize({
      token,
      expectedAudience: opts.expectedAudience,
    });

    if (!decision.ok) {
      opts.onError?.(decision.error, req);
      return res
        .status(mapErrorToStatus(decision.error.code))
        .json(formatError(decision.error));
    }

    attachAuth(req, {
      userId: decision.userId,
      roles: decision.roles,
      principal: decision.principal,
      roleStamp: decision.roleStamp,
      roleVersion: decision.roleVersion,
      claims: decision.claims,
      token,
    });

    next();
  };
}

export function requireAnyRole(
  opts: Omit<RequireAuthOptions, "required">,
  ...roles: string[]
): RequestHandler {
  const required: RequiredRoles = { anyRoles: roles };
  return requireAuth({ ...opts, required });
}

export function requireAllRoles(
  opts: Omit<RequireAuthOptions, "required">,
  ...roles: string[]
): RequestHandler {
  const required: RequiredRoles = { allRoles: roles };
  return requireAuth({ ...opts, required });
}
