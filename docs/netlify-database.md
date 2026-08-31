# Netlify database deployment

This application uses Netlify Database in production and PostgreSQL from
`DATABASE_URL` for local or on-premise installations.

## Production

- Keep `@netlify/database` installed. Netlify provisions the database during
  deployment and supplies `NETLIFY_DB_URL` to the application.
- Configure a randomly generated `NEXTAUTH_SECRET` in Netlify for the production
  context. Do not put secrets in source files or `NEXT_PUBLIC_` variables.
- Netlify applies the SQL files in `netlify/database/migrations` before publishing
  production. The initial migration follows `prisma/schema.prisma`; the second
  creates an administrator, three roles, and the device-type catalog. It does
  not add demonstration assets or buildings.
- Do not edit an already-applied migration. Add a new numbered SQL migration
  for future schema changes, keeping the Prisma schema in sync.
- A connection returned to local tooling may be read-only. Do not copy that URL
  into production or attempt `prisma db push` with it. Use the normal Netlify
  migration/deployment flow.
- The initial administrator's random password is handed over privately. Its
  plaintext is not in the migration or application bundle. Keep any local
  credential file private and outside source control.

The existing Netlify project visibility setting is preserved. A private project
requires Netlify sign-in before the application's own sign-in screen appears.

## Development

Set `DATABASE_URL` to your development PostgreSQL database, run `npm run db:push`,
then run `npm run db:seed` if you want demonstration data. Demo seeding is blocked
when `NODE_ENV=production`; demo buttons are only shown in development.

## Verification and remaining limitation

`GET /api/health` should report `healthy` and `database: connected`. Sign-in uses
the stored bcrypt hash; the former universal demo-password fallback is removed.

Floor-plan uploads still use local disk. Netlify deployment does not make those
files persistent; durable object storage must be added before relying on uploads.

References: [Netlify Database migrations](https://docs.netlify.com/build/data-and-storage/netlify-database/migrations/)
and [connection API](https://docs.netlify.com/build/data-and-storage/netlify-database/api/).
