# Cloud sync, account, and reminder setup

The foundation release is intentionally isolated. It does not change Bill Beacon’s current pages, JavaScript, CSS, service worker, local storage, or iPhone PWA behavior.

## Required setup

- Cloudflare D1 database and KV namespace
- Cloudflare Worker deployment
- Resend API key and verified From address
- Google OAuth client ID and secret
- VAPID key pair for Web Push

All credentials must be Worker secrets. Never commit them or expose them in browser JavaScript.

## Rollout order

1. Provision D1 and KV, replace template IDs, and deploy the Worker.
2. Set Resend secrets and test magic-link authentication.
3. Set Google OAuth credentials and add/test the callback flow.
4. Add the account UI and local-data migration in a separate, reviewable commit.
5. Add VAPID delivery and test it from a Home Screen-installed iPhone PWA.
6. Enable scheduled reminders after push delivery is verified.

## Data safety

No existing local bill data is read, moved, deleted, or uploaded by this foundation. A later account UI will explain the automatic migration selected for first sign-in before enabling it.
