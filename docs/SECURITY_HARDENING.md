# Security Hardening — Pre-Production TODO

## Critical

- [x] Add auth to `/api/push/subscribe` and `/api/push/unsubscribe` — require `session?.user` before processing
- [x] Add rate limiting to `/api/auth/register` — 5 attempts/hour per IP via Upstash Ratelimit

## High

- [x] Align login password minimum from 6 to 8 chars — `auth.ts` and login page
- [x] Add rate limiting to `/api/user/upload-avatar` (5/hr per user) and `/api/stories/upload` (10/hr per user)
- [x] Add file size validation — avatar: 5MB max, admin media: 100MB max, settings upload: 5MB max

## Medium

- [x] Set explicit session maxAge in `auth.ts` — 30 days
- [x] Add rate limiting to `/api/payments/initialize` — 10/hr per user
- [x] Validate `folder` param in `/api/admin/media` to reject `..` and absolute paths
- [ ] Enable `requireStrongPasswords` by default in production
- [ ] Use CSP nonces for inline scripts in production (replace `unsafe-inline`/`unsafe-eval`)

## Low

- [x] Standardize EDITOR role inclusion across admin routes — removed EDITOR from all 24 admin routes, ADMIN + SUPER_ADMIN only
- [ ] Implement password reset flow (token-based, time-limited, single-use)
- [ ] Restrict SVG uploads to admin-only or disable entirely
- [ ] Add Redis availability warning logs when brute-force protection is unavailable
- [ ] Rotate any exposed test API keys from git history
