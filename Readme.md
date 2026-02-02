# service-auth-express

**Express middleware wrapper for [`service-auth-core`](https://www.npmjs.com/package/service-auth-core)**

`service-auth-express` turns the low-level authentication & authorization primitives from `service-auth-core` into **clean, reusable Express middleware**.

It helps you:

- avoid repeating JWT parsing and authorization logic in every route
- keep authentication logic consistent across services
- attach a typed `req.auth` context for business logic
- separate **auth concerns** from **business concerns**

---

## Why this package exists

`service-auth-core` already answers:

- Is this JWT valid?
- Is it expired?
- Has the user’s role assignment changed?
- Does the user have the required roles?

But in an Express service, every team still ends up writing the same glue code:

- extract Bearer token
- call `doAuthorize`
- map auth errors to HTTP status codes
- attach user context to `req`

`service-auth-express` standardizes this glue.

---

## Installation

```bash
npm install service-auth-express service-auth-core
```

---

## Concepts (quick mental model)

| Layer                  | Responsibility                       |
| ---------------------- | ------------------------------------ |
| `service-auth-core`    | Authentication & authorization logic |
| `service-auth-express` | HTTP / Express integration           |
| Your routes            | Business logic only                  |

---

## What this package provides (v0.1)

### Middleware helpers

- `requireAuth()` – authentication required
- `requireAnyRole()` – user must have **any** of the roles
- `requireAllRoles()` – user must have **all** roles
- `optionalAuth()` – authentication optional

### Typed request context

After successful auth, middleware attaches:

```ts
req.auth = {
  userId,
  roles,
  principal?,
  roleStamp?,
  roleVersion?,
  claims,
  token
}
```

TypeScript users get this automatically (no casting).

---

## Basic usage

### 1️⃣ Create `authCore` using `service-auth-core`

```ts
import { createAuthCore, JwtTokenProvider } from "service-auth-core";

export const authCore = createAuthCore(
  {
    issuer: "auth-service",
    audience: ["my-api"],
    tokenTtlSeconds: 900,
    roleFreshness: { enabled: true },
  },
  {
    credentialChecker,
    roleProvider,
    roleStampProvider,
    roleVersionProvider,
    tokenProvider,
  },
);
```

---

## `requireAuth`

```ts
app.get("/profile", requireAuth({ authCore }), (req, res) => {
  res.json({
    userId: req.auth!.userId,
    roles: req.auth!.roles,
  });
});
```

---

## `requireAnyRole`

```ts
app.get(
  "/admin",
  requireAnyRole({ authCore }, "ADMIN", "SUPPORT"),
  (req, res) => {
    res.json({ message: "Admin access granted" });
  },
);
```

---

## `requireAllRoles`

```ts
app.get(
  "/billing",
  requireAllRoles({ authCore }, "ADMIN", "BILLING_WRITE"),
  (req, res) => {
    res.json({ message: "Billing access granted" });
  },
);
```

---

## `optionalAuth`

```ts
app.get("/products", optionalAuth({ authCore }), (req, res) => {
  if (req.auth) {
    res.json({ pricing: "contract pricing" });
  } else {
    res.json({ pricing: "public pricing" });
  }
});
```

---

## Error → HTTP status mapping (default)

| Error code            | HTTP |
| --------------------- | ---- |
| `AUTH_TOKEN_INVALID`  | 401  |
| `AUTH_TOKEN_EXPIRED`  | 401  |
| `AUTH_TOKEN_STALE`    | 401  |
| `AUTH_FORBIDDEN`      | 403  |
| `AUTH_CONFIG_ERROR`   | 500  |
| `AUTH_INTERNAL_ERROR` | 500  |

---

## License

MIT
