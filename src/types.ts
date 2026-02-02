import type { TokenPayload } from "service-auth-core";

// ---- Express Request augmentation (req.auth) ----
declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}
export {};

export type RequiredRoles = {
  anyRoles?: string[];
  allRoles?: string[];
};

export type AuthContext = {
  userId: string;
  roles: string[];
  principal?: string;
  roleStamp?: string;
  roleVersion?: number;
  claims: TokenPayload;
  token: string;
};

export type ErrorResponseShape =
  | { error: { code: string; message: string; details?: unknown } }
  | unknown;

export type RequireAuthOptions = {
  /** Provide the auth core instance created by service-auth-core */
  authCore: {
    doAuthorize(input: {
      token: string;
      required?: RequiredRoles;
      expectedAudience?: string | string[];
    }): Promise<
      | {
          ok: true;
          userId: string;
          roles: string[];
          principal?: string;
          roleStamp?: string;
          roleVersion?: number;
          claims: TokenPayload;
        }
      | {
          ok: false;
          error: { code: string; message: string; details?: unknown };
        }
    >;
  };

  /** Required roles check (any or all) */
  required?: RequiredRoles;

  /** Override expected audience for this route */
  expectedAudience?: string | string[];

  /**
   * Token extraction.
   * Default: Authorization: Bearer <token>
   */
  extractToken?: (req: any) => string | null;

  /**
   * Error handling customization
   */
  mapErrorToStatus?: (code: string) => number;
  formatError?: (err: {
    code: string;
    message: string;
    details?: unknown;
  }) => ErrorResponseShape;

  /**
   * Called before responding on auth errors (optional hook)
   */
  onError?: (
    err: { code: string; message: string; details?: unknown },
    req: any,
  ) => void;
};
