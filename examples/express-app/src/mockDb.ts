export type UserRecord = {
  userId: string;
  username: string;
  passwordHash: string;
  roles: string[];
  roleVersion: number;
  roleStamp: string;
  data: any;
};

const users: Record<string, UserRecord> = {
  abhi: {
    userId: "u-1",
    username: "abhi",
    passwordHash: "hash_pw_abhi",
    roles: ["ADMIN", "CUSTOMER_READ"],
    roleVersion: 3,
    roleStamp: "etag-u1-v3",
    data: { id: "tenant-1" },
  },
  john: {
    userId: "u-2",
    username: "john",
    passwordHash: "hash_pw_john",
    roles: ["CUSTOMER_READ"],
    roleVersion: 1,
    roleStamp: "etag-u2-v1",
    data: { id: "tenant-1" },
  },
};

export const mockDb = {
  async getUser(username: string) {
    return users[username] ?? null;
  },
  async getRoles(userId: string) {
    const u = Object.values(users).find((x) => x.userId === userId);
    return u?.roles ?? [];
  },
  async getRoleVersion(userId: string) {
    const u = Object.values(users).find((x) => x.userId === userId);
    return u?.roleVersion ?? 0;
  },
  async getRoleStamp(userId: string) {
    const u = Object.values(users).find((x) => x.userId === userId);
    return u?.roleStamp ?? "etag-0";
  },

  async getAdditionalClaims(userId: string) {
    const u = Object.values(users).find((x) => x.userId === userId);
    return u?.data ?? undefined;
  },
};
