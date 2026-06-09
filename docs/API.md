# MongPass API

## Overview

MongPass exposes JSON endpoints through Next.js Route Handlers under `/api`.
The API currently supports the first-party web client. Public read endpoints
can be used without authentication; write and management endpoints require a
MongPass session.

Base URL for local development:

```text
http://localhost:3000/api
```

The OpenAPI 3.1 source is available at [`openapi.json`](openapi.json). A
running MongPass instance also serves it from `GET /api/openapi` with CORS
enabled for documentation tools.

## Authentication

Authentication uses Google OAuth and the `mongpass_session` cookie.

1. Open `GET /api/auth/google`.
2. Complete Google OAuth.
3. The callback creates a secure session cookie.
4. Send the cookie with subsequent same-origin requests.

API errors use an object such as:

```json
{ "error": "Authentication required" }
```

Common status codes are `400`, `401`, `403`, `404`, and `409`.

## Public Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/shops` | List approved shops |
| `GET` | `/shops/{shopId}` | Get a shop |
| `GET` | `/shops/{shopId}/menu` | Restaurant menu |
| `GET` | `/shops/{shopId}/doctors` | Hospital doctors |
| `GET` | `/shops/{shopId}/car-listings` | Used-car listings |
| `GET` | `/shops/{shopId}/travel-packages` | Travel packages |
| `GET` | `/shops/{shopId}/notices` | Shop notices |
| `GET` | `/reviews?shopId={shopId}` | Reviews |
| `GET` | `/community/posts` | Community posts |
| `GET` | `/community/posts/{postId}` | Community post |
| `GET` | `/community/posts/{postId}/comments` | Comments |
| `GET` | `/news` | Published life-information articles |
| `GET` | `/news/{articleId}` | Published article |
| `GET` | `/banners` | Home banners |

### List Shops

```http
GET /api/shops?category=hospital&featured=true&limit=20
```

Query parameters:

- `category`: `meat`, `restaurant`, `food`, `cargo`, `hospital`, `beauty`,
  `car`, `travel`, or `other`
- `featured=true`: featured shops only
- `limit`: maximum 200
- `status`: public callers may request `approved`

Example response:

```json
{
  "shops": [
    {
      "id": "shop-example",
      "category": "hospital",
      "name": "Example Clinic",
      "status": "approved",
      "images": []
    }
  ]
}
```

### List Community Posts

```http
GET /api/community/posts?category={category}
```

```json
{
  "posts": [
    {
      "id": "post-example",
      "authorName": "User",
      "category": "생활 정보",
      "title": "Example",
      "content": "Example content",
      "likeCount": 0,
      "commentCount": 0,
      "createdAt": "2026-06-09 10:00:00"
    }
  ]
}
```

## Authenticated User Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/auth/me` | Current user |
| `POST` | `/auth/logout` | End session |
| `POST` | `/community/posts` | Create a post |
| `POST` | `/community/posts/{postId}/comments` | Add a comment |
| `POST` | `/community/posts/{postId}/like` | Toggle like |
| `POST` | `/reviews` | Create a review |
| `GET/POST/DELETE` | `/favorites` | Manage favorites |
| `GET/POST` | `/recently-viewed` | Manage recent shops |
| `GET/POST` | `/orders` | List or create orders |
| `GET/POST` | `/chat/threads` | List or create chat threads |
| `GET/POST` | `/chat/threads/{threadId}/messages` | Read or send messages |
| `POST` | `/upload` | Upload an image to R2 |

Example post creation:

```bash
curl -X POST http://localhost:3000/api/community/posts \
  -H "Content-Type: application/json" \
  -H "Cookie: mongpass_session=..." \
  -d '{"category":"생활 정보","title":"제목","content":"내용"}'
```

## Business and Admin Endpoints

Business owners can create and update records only for their own shop.
Administrators can approve or reject shops and manage editorial content.

| Area | Endpoint family |
| --- | --- |
| Shop profile | `/shops`, `/shops/{shopId}` |
| Catalogs | `/shops/{shopId}/menu`, `doctors`, `cargo-routes`, `beauty-*`, `meat-products` |
| Used cars | `/shops/{shopId}/car-listings` |
| Travel | `/shops/{shopId}/travel-packages` |
| Moderation | `/shops/{shopId}/approve`, `/reject`, `/toggle-featured` |
| Editorial | `/news`, `/news/{articleId}`, `/banners` |

## Stability

The API is pre-1.0 and may change. Public integrations should pin a commit or
release and review `CHANGELOG.md`. A generated OpenAPI 3.x contract is planned
before the first stable API release.
