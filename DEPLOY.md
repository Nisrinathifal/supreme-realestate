# Deploying (handoff, 2026-10-08)

The site is a Next.js 16 app with one server route (`app/api/contact`, the contact form). It needs a Node runtime
(`npm run build` then `npm run start`, or a host that runs Next.js); a static-only Apache/FTP folder cannot serve the
contact form. `supremerealestate.nl` currently serves a build from the morning of 2026-10-08; everything since is on
`main`.

## Build

```bash
npm ci
npm run build        # runs check:filenames first; fails on placeholders unless ALLOW_PLACEHOLDERS=1
npm run start -- -p 3000
```

`npm run build` refuses while marked drafts/placeholders remain (`npm run check:placeholders` lists them). Until the
owner approves the remaining copy, build with `ALLOW_PLACEHOLDERS=1` — never on the live site without knowing which
texts are still drafts.

## Environment (production)

Copy `.env.example` and set:

| Variable | Production value |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://supremerealestate.nl` (no trailing slash). With an `https://` URL the CSP `upgrade-insecure-requests` and HSTS headers are sent; with `http://` they are not (Safari would otherwise upgrade localhost). |
| `MAIL_PROVIDER` | `http` (`mock` only logs and is refused in production unless `MAIL_ALLOW_MOCK=1`) |
| `MAIL_PROVIDER_URL`, `MAIL_PROVIDER_API_KEY` | A transactional e-mail provider's JSON send endpoint and bearer key (EU processing, PRD §9.2). `lib/mail/index.ts` posts `{ from, to, reply_to, subject, text }`; adapt there if the provider's shape differs. |
| `MAIL_FROM` | The sender address the provider allows |
| `MAIL_TO_SAMENWERKING`, `MAIL_TO_PERS`, `MAIL_TO_JURIDISCH`, `MAIL_TO_OVERIG` | Recipient per subject; `MAIL_TO_OVERIG` is the fallback, then `company.email` |

The contact route rate-limits per IP in memory (5 messages / 10 min per instance) and reads `x-forwarded-for`: put it
behind a proxy that sets that header.

## Checks before going live

```bash
npm run typecheck && npm run lint
npm run test          # Playwright: screenshots of every page + the contact form and no-slop specs (tests/)
npm run lighthouse    # mobile Lighthouse on the home page (needs `npx next start -p 3100`)
```

## Known open items

- Copy wrapped in `draft()` (contact form labels and placeholders, parts of About, legal pages are placeholders) awaits
  the owner / legal.
- `media/src/` (original images) is git-ignored; `public/media/` holds the pipeline output and is committed.
- See `CLAUDE.md` for structure and rules, `SCENE-3D.md` for the About band's 3D scene.
