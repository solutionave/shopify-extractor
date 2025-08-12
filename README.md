# metroninn-script

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.2.18. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

## Read a Google Sheet as CSV

Two easy options:

- Public link sharing: In Google Sheets, Share -> General access: Anyone with the link (Viewer). Then we can hit the CSV export URL directly.
- Or Publish to the web: File -> Share -> Publish to web -> Entire document or a specific sheet. This also yields a CSV-friendly URL.

You need:

- Spreadsheet ID: the long id in the sheet URL `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`. Set as `SHEET_ID`.
- Optional Tab (gid): found in the URL as `gid=...`. Set as `SHEET_GID`. If omitted, Google exports the first sheet.

Run the script:

```bash
# Replace with your values
SHEET_ID=YOUR_SPREADSHEET_ID \
SHEET_GID=0 \
bun run index.ts
```

Output shows the number of rows and the first 3 objects. The CSV is parsed without extra dependencies.

## Fetch products from Shopify

Set these env vars:

- `SHOPIFY_SHOP`: your shop domain (e.g., `mystore` or `mystore.myshopify.com`)
- `SHOPIFY_ACCESS_TOKEN`: Admin API access token (requires at least `read_products` scope)
- Optional `SHOPIFY_API_VERSION`: defaults to `2024-10`

Run:

```bash
SHOPIFY_SHOP=mystore \
SHOPIFY_ACCESS_TOKEN=shpat_*** \
bun run index.ts
```

What it does:

- Uses Shopify Admin GraphQL API, auto-paginates up to all products (250 per page)
- Logs a count and a preview of the first 3 products
- Simple retry on 429s (1s backoff)

How to get the token:

1. Shopify Admin -> Apps -> Develop apps -> Create app (Custom app)
2. Configure Admin API scopes: grant `read_products` at minimum
3. Install the app to your store and copy the Admin API access token

Notes:

- This script only logs products. If you want them saved to the DB, we can wire a Prisma model and upsert logic next.

## Fetch a single product detail (Admin session cookie)

You can fetch a single product's details directly from the Shopify Admin GraphQL proxy using your current Admin session cookie captured from DevTools.

Steps:

1) Open `shopify.ts` and set:

- `ADMIN_STORE_HANDLE` to your store handle like `114925-b6` (from https://admin.shopify.com/store/114925-b6)
- `ADMIN_COOKIE` to the full Cookie header you copied from Safari/Chrome DevTools while authenticated in Admin

2) Run with the product ID (either numeric like `7727080505367` or a full gid like `gid://shopify/Product/7727080505367`):

```bash
PRODUCT_ID=7727080505367 bun run shopify.ts
```

The script will:

- Call the Admin proxy with the `ProductDetailQuery`
- Upsert the product in the local DB (title, handle, status)
- Replace images and upsert variants for that product
- Print the full product object (as returned by Admin GraphQL) to stdout
