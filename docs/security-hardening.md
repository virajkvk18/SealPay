# SealPay Security Hardening Notes

SealPay is wallet-first and does not currently implement email/password authentication, password reset, or server-issued login sessions. Do not add centralized password auth unless the product direction changes.

## Authentication Model

- Wallet address is the user identity.
- Sensitive payment authorization must be enforced by the smart contract using `msg.sender`.
- Frontend role checks are only UX hints and must not be treated as security controls.
- If a server session is later needed, use wallet-signature login with a one-time nonce and short-lived, secure, `httpOnly`, `sameSite` cookies.

## Password Auth Requirements If Added Later

If SealPay ever adds password accounts:

- Hash passwords with Argon2id or bcrypt using per-user salts.
- Require email verification before account activation.
- Store password reset tokens hashed, single-use, and expiring.
- Expire sessions and rotate session identifiers after login.
- Rate-limit login, signup, verification, and reset endpoints.
- Keep auth secrets server-only. Never expose them with `NEXT_PUBLIC_`.

## Supabase / Database Ownership

The frontend uses the public Supabase anon key when Supabase is configured. That means Row Level Security must be enabled for any table that stores non-public data.

Recommended direction for a decentralized build:

- Treat the smart contract and IPFS as source of truth.
- Use Supabase only as a cache/indexer.
- Do not store private deliverables or secrets in Supabase.
- Public proof rows may be readable by deal ID if the product intentionally supports public proof verification.

Minimum RLS posture:

```sql
alter table deals enable row level security;
alter table proofs enable row level security;

-- Public opportunities may be discoverable.
create policy "Read public open deals"
on deals for select
using (deal_kind = 'Public' and status = 'Created');

-- Wallet-specific deal reads require an authenticated wallet/session layer.
-- Do not use this policy until wallet signatures are verified server-side
-- and written into JWT claims or checked by a trusted API.
--
-- create policy "Read participant deals"
-- on deals for select
-- using (
--   lower(client_wallet) = lower(auth.jwt() ->> 'wallet_address')
--   or lower(freelancer_wallet) = lower(auth.jwt() ->> 'wallet_address')
-- );
```

Until wallet-signature sessions or contract-derived reads are implemented, Supabase writes should be considered a demo cache, not an authoritative security boundary.

## Secrets

Server-only:

- `PINATA_JWT`
- `PRIVATE_KEY`
- database service keys
- webhook secrets

Public-safe:

- `NEXT_PUBLIC_CONTRACT_ADDRESS`
- `NEXT_PUBLIC_CHAIN_ID`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- public gateway/explorer URLs

Never expose service-role database keys or provider API tokens to browser code.

## Abuse Protection

Current protection:

- `proxy.ts` applies security headers, suspicious path blocking, HTTPS redirects in production, and route-group rate limits.
- Upload endpoints reject cross-origin API calls.
- Proof uploads enforce deal ID validation and upload-size limits.

For production, replace in-memory rate limits with Redis, Upstash, Cloudflare, or another shared store so limits work across server instances.
