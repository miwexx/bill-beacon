# Bill Beacon backend foundation

These files do not alter the current Pages app. Bill Beacon remains local-first until the Worker is configured, deployed, and deliberately connected through a later UI change.

## Provisioning

1. Create a D1 database named `bill-beacon`, then replace `REPLACE_WITH_D1_DATABASE_ID` in `wrangler.toml`.
2. Create a KV namespace, then replace `REPLACE_WITH_KV_NAMESPACE_ID`.
3. Apply migrations: `npx wrangler d1 migrations apply bill-beacon --remote`.
4. Add Worker secrets outside Git: `RESEND_API_KEY`, `EMAIL_FROM`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `VAPID_PUBLIC_KEY`, and `VAPID_PRIVATE_KEY`.
5. Deploy with `npx wrangler deploy`.
6. Configure Resend with a verified sender domain.
7. Create a Google Web OAuth client and later add the Worker callback URL.

## Reminder defaults

The scheduled handler evaluates due dates 7, 3, and 1 day before, plus on the due date. It records a unique delivery row before push delivery is added, preventing duplicate reminder events.
