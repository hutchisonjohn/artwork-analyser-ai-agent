# Admin Authentication Setup

The admin API (`/api/config`, `/api/docs`) requires a shared bearer token defined in the Worker bindings. This document explains how to configure it for local development and production.

## 1. Generate a Token

Use any sufficiently random string. For example:

```
python - <<'PY'
import secrets
print(secrets.token_urlsafe(32))
PY
```

Store the generated value somewhere safe.

## 2. Local Development

Create a `.dev.vars` file in the project root if it does not already exist:

```
ADMIN_TOKEN="your-generated-token"
APP_SECRET_KEY="optional-secret-for-key-encryption"
```

Wrangler automatically loads `.dev.vars` when you run `wrangler dev` or `npm run dev:worker`.

> **Note:** The `APP_SECRET_KEY` enhances XOR encryption for API keys stored in KV. Use any 32+ character string. If omitted, keys are still obfuscated but not uniquely salted.

## 3. Production Deployment

Set the values using Wrangler secrets so that they remain server-side only:

```
wrangler secret put ADMIN_TOKEN
wrangler secret put APP_SECRET_KEY
```

Wrangler will prompt for each value. Deployments (`wrangler deploy`) will pick up the secrets automatically.

## 4. Frontend Usage

- When opening the Admin tab in the frontend, enter the same admin token into the **Admin Token** field.
- Check “Remember token in this browser” if you want it persisted in `localStorage`.
- All secured requests will include `Authorization: Bearer <token>` automatically.
- The Analyzer view now surfaces artwork thumbnails (at 25% or smaller) and detailed alpha-channel statistics when available; ensure the Worker is running so these endpoints respond.

## 5. Rotating Tokens

1. Generate a new token.
2. Update the Worker secret (`wrangler secret put ADMIN_TOKEN`).
3. Share the new token with authorized users.
4. Instruct users to update the value in the Admin UI (or clear their stored token).

## 6. Troubleshooting

- **401 Unauthorized:** Ensure the Worker has the correct `ADMIN_TOKEN` binding and the frontend is sending the same value.
- **Forgotten Token:** Redeploy with a new token via `wrangler secret put ADMIN_TOKEN` and distribute it again.
- **Missing APP_SECRET_KEY:** You can add it later without redeploying the frontend; only the Worker needs to know the secret.
