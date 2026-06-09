# Architecture

## Overview

MongPass is a single Next.js application that serves the consumer UI,
business dashboard, administration UI, and JSON APIs.

```text
Browser
  |
  v
Next.js App Router on Cloudflare Pages
  |-- Server and client components
  |-- Route Handlers under /api
  |-- Session and authorization helpers
  |
  +--> Cloudflare D1: users, shops, content, orders, chat
  +--> Cloudflare R2: uploaded images
  +--> Google OAuth: authentication
```

## Application Areas

| Directory | Responsibility |
| --- | --- |
| `src/app/category` | Public discovery, shop details, orders and bookings |
| `src/app/community` | Community post and comment experience |
| `src/app/news` | Public life-information articles |
| `src/app/biz` | Business registration and catalog management |
| `src/app/admin` | Moderation, approvals, banners and news |
| `src/app/api` | JSON API Route Handlers |
| `src/lib/auth` | Session, OAuth and authorization rules |
| `src/lib/*Store.ts` | Client API adapters and domain types |

## Data Model

D1 migrations live in `migrations/` and are applied in filename order.

Core entities:

- `users`, `sessions`, `oauth_accounts`
- `shops`, `shop_images`, `shop_notices`
- category catalogs such as `menu_items`, `doctors`, `car_listings`
- `orders`, `reviews`, `favorites`, `recently_viewed`
- `community_posts`, `community_comments`, likes
- `chat_threads`, `chat_messages`
- `news_articles`, banners and notification state

Every business catalog record is scoped to a shop. Public shop queries expose
approved shops by default; owner and administrator operations are checked on
the server.

## Authentication and Authorization

Google OAuth creates or links a user record. MongPass stores a random session
token in an `httpOnly`, `secure`, `SameSite=Lax` cookie and stores only its
SHA-256 hash in D1.

Roles:

- `user`: community, review, favorite, chat, order and booking actions
- business owner: catalog changes for the shop they own
- `admin`: shop moderation, news and banner administration

Route Handlers must derive identity from the session. Client-provided user
IDs or role fields are not trusted.

## Deployment

`next-on-pages` builds the application for Cloudflare Pages. Bindings are
declared in `wrangler.toml`:

- `DB` for Cloudflare D1
- `IMAGES` for Cloudflare R2

Secrets such as Google OAuth credentials and `AUTH_SECRET` must be configured
in Cloudflare and must never be committed.

See [`DEPLOYMENT.md`](DEPLOYMENT.md) for deployment steps.
