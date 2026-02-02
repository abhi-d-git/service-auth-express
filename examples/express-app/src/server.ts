import express from "express";
import { authCore } from "./authCore";
import {
  requireAllRoles,
  requireAnyRole,
  requireAuth,
} from "../../../dist/index.mjs";

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

// POST /login { username, passwordHash } -> token
app.post("/login", async (req, res) => {
  const { username, passwordHash } = req.body ?? {};
  if (!username || !passwordHash) {
    return res
      .status(400)
      .json({ error: "username and passwordHash are required" });
  }

  const r = await authCore.doAuthenticate({
    principal: String(username),
    password: String(passwordHash),
  });

  if (!r.ok) return res.status(401).json({ error: r.error });

  return res.json({
    token: r.accessToken,
    expiresAt: r.expiresAt,
    userId: r.userId,
    roles: r.roles,
    roleStamp: r.roleStamp,
    roleVersion: r.roleVersion,
  });
});

// Protected endpoint
app.get(
  "/customer",
  requireAuth({
    authCore,
    required: { anyRoles: ["CUSTOMER_READ", "ADMIN"] },
  }),
  (req, res) => {
    res.json({
      message: "✅ Customer data fetched",
      auth: req.auth,
      customer: { customerId: "c-101", name: "Acme Corp", status: "ACTIVE" },
    });
  },
);

app.get(
  "/admin",
  requireAnyRole(
    { authCore }, // same auth core
    "ADMIN", // any of these roles are allowed (only one given here)
  ),
  (req, res) => {
    res.json({
      message: "✅ Admin endpoint accessed",
      auth: req.auth,
    });
  },
);

// Requires BOTH ADMIN and BILLING_WRITE using requireAllRoles
app.get(
  "/billing",
  requireAllRoles({ authCore }, "ADMIN", "BILLING_WRITE"),
  (req, res) => {
    res.json({
      message: "✅ Billing endpoint accessed (ADMIN + BILLING_WRITE)",
      auth: req.auth,
    });
  },
);

const port = Number(process.env.PORT || 3000);
app.listen(port, () =>
  console.log(`✅ example running on http://localhost:${port}`),
);
