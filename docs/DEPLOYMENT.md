# Deployment

## Cloudflare Resources

Create the D1 database and R2 bucket:

```powershell
npx wrangler d1 create mongpass
npx wrangler r2 bucket create mongpass-images
```

Update `wrangler.toml` with the D1 database ID. Apply migrations:

```powershell
npm run db:migrate:remote
```

## Secrets

Configure these as Cloudflare Pages secrets or environment variables:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `ADMIN_EMAILS`
- `AUTH_SECRET`

Generate a unique random `AUTH_SECRET` for each environment. Never copy the
example value into production.

## Build

```powershell
npm ci
npm run build:cloudflare
npx wrangler pages deploy
```

For GitHub Actions deployment, add `CLOUDFLARE_API_TOKEN` and
`CLOUDFLARE_ACCOUNT_ID` as repository secrets, then enable the provided
deployment workflow.
