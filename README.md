This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Admin authentication setup

Copy `.env.example` to `.env.local` and set `ADMIN_SESSION_SECRET` to a random
value containing at least 32 characters. Admin accounts are stored in the
database; runtime environments do not use an admin email or password hash.

Generate a session secret, for example with:

```bash
openssl rand -base64 48
```

Create the first `SUPER_ADMIN` locally with one-time seed values:

```bash
ADMIN_SEED_EMAIL="admin@example.com" \
ADMIN_SEED_PASSWORD="replace-with-a-strong-password" \
npm run db:seed-admin
```

The bootstrap command is idempotent and never overwrites an existing account.
Do not keep the seed password in production environment variables after use.

Restart the development server after changing environment variables. The admin
login is available at [http://localhost:3000/admin](http://localhost:3000/admin).

> Security note: this repository does not currently include a shared login rate
> limiter. Before production, protect `/api/admin/auth/login` with a reverse
> proxy/WAF rate limit or a shared store-backed limiter.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

Production deployment is intentionally controlled. Do not run Prisma
development/reset commands against Production and do not connect Preview to the
Production Neon database.

Read these runbooks before deploying:

- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)
- [`docs/DATABASE_BACKUP.md`](docs/DATABASE_BACKUP.md)
- [`docs/PRODUCTION_RUNBOOK.md`](docs/PRODUCTION_RUNBOOK.md)

The production migration command is `npx prisma migrate deploy`. Migrations are
not run automatically by Preview builds or by `npm run build`.
