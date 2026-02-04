import {
  AdditionalClaims,
  createAuthCore,
  JwtTokenProvider,
} from "service-auth-core";
import { mockDb } from "./mockDb.js";

const credentialChecker = {
  async checkUserNamePassword(username: string, passwordHash: string) {
    const u = await mockDb.getUser(username);

    if (!u) return { ok: false as const, reason: "USER_NOT_FOUND" as const };
    if (u.passwordHash !== passwordHash)
      return { ok: false as const, reason: "INVALID_CREDENTIALS" as const };

    return { ok: true as const, userId: u.userId };
  },
};

const roleProvider = {
  async getUserRoles(userId: string) {
    return mockDb.getRoles(userId);
  },
};

const roleVersionProvider = {
  async getRoleVersion(userId: string) {
    return mockDb.getRoleVersion(userId);
  },
};

const roleStampProvider = {
  async getRoleStamp(userId: string) {
    return mockDb.getRoleStamp(userId);
  },
};

const additionalClaimsProvider = {
  async getAdditionalClaims(input: {
    userId: string;
    principal: string;
  }): Promise<AdditionalClaims> {
    console.log("Additionalclaims provider called.");
    return mockDb.getAdditionalClaims(input.userId);
  },
};

const tokenProvider = new JwtTokenProvider({
  alg: "HS256",
  secret: process.env.AUTH_SECRET || "dev-secret-change-me",
  kid: "dev-k1",
});

export const authCore = createAuthCore(
  {
    issuer: "auth-demo",
    audience: ["auth-demo-api"],
    tokenTtlSeconds: 15 * 60,
    roleFreshness: { enabled: true },
  },
  {
    credentialChecker,
    roleProvider,
    roleStampProvider,
    roleVersionProvider,
    additionalClaimsProvider,
    tokenProvider,
  },
);
