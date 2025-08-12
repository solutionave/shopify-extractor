/**
 * Minimal script to fetch and print Shopify products without env files.
 * - Uses your current Admin session Cookie at admin.shopify.com
 * - No server, just run and console.log
 *
 * Run with Bun:
 *   bun run shopify.ts
 * Or with Node 18+:
 *   node --loader ts-node/esm shopify.ts
 */

import { getPrisma } from "./libs/utils";

/** ===================== CONFIG - FILL THESE ===================== */
// Example: https://admin.shopify.com/store/114925-b6 -> handle is "114925-b6"
const ADMIN_STORE_HANDLE = "114925-b6"; // TODO: set to your store handle

// Paste the full Cookie header you captured from Safari DevTools. Keep the backticks.
const ADMIN_COOKIE = `_shopify_s=7687bd9a-21a6-4564-ac6b-701e802a813d; _shopify_y=df226cff-2046-4caf-90d4-499597e971a5; is_shopify_merchant=1; _shopify_essential_=c8743207-600c-4bd2-8fa5-471f477e8f4c; _merchant_essential=%3AAZic4TKIAAEAebGXoUJC0E1EPTZOE7M2fWcMmhxGsKyYPva53AT3UYSIMIb66y70Ht3jqiT4cCv-yDUtzVnPN59VdAgza7a_5j7SlwzbPcPZK4wfAum7Y2QWnKtP02lbslzQu_CDtMcU2sHdqIrAuU3oD6GF5vKz1gz27HhCT0xwE1XmB0a5uu62RsJzpvrYBo0pDb2qP9GfqGOptJnfqsRxv-sngynM5VzlmtFGo12VnaS2MB_7ERm6LC13AQdp3PFN9CytfsT4zZTs_0hxnce-mxtmObsp-jmDcNjtIYrEzNzmJsZMX2xVyIAi-yQCcGoV0b0aaj1aj7kdfMPRoqLxvOzxSiksQG9jNyD5TILSKc00H1j7AVgPOJpA4r2xO-qIStkFujSWOZatQ_OLlnDPesjBEKaUQ5qIiDHyd07tg_4XgS6GZmxcqAF3-jv9-jHxnxjnVEfbERFyFXN-surV6nfv61mDF8LHr9Vj7VTzomA_e6MF73VegVJQu-cAVVRlskkBmOwmZJlvpBDTKdy5_0FGXz3Zvncxw_k07qaiUEANTNTVZzcMzrOcrBhzJUtNLDPo7dn10L627dv8cF5TeypOuXtfPvNq0TpZnXV3VrasSxt9wUltto8ekz6Icu85WYZPj96phBmXSzh_PcNl28IXjPZCcmMzy3rAc5lb9tuVZPp7hBhfqeSlNSZCuWm7xQluNRL-1A%3A; master_device_id=a2e883bf-fe6d-4850-9065-5b5c81669557; 70409945111--ProductInventory--selected-location=[{%22id%22:%22gid://shopify/Location/91000471575%22%2C%22name%22:%22Mahja%20Ibn%20Salih%2C%20Al%20Shuhada%22}]; FPID=FPID2.2.a0flr8ldj3cLqhElFhdpeLdJtorD6qjDmUFlE0nCzmI%3D.1754975070; _ga_W6NECZNE63=GS2.1.s1754977080$o2$g1$t1754977873$j55$l0$h1801896810; _fbp=fb.1.1754975069594.839325890296096564; FPAU=1.1.966784902.1754975069; FPGCLAW=2.1.kCj0KCQjwqebEBhD9ARIsAFZMbfwRGvvDE0ENWeMM_ioKu6OXMNafzNKhQJ5K5ag-L2f1Ob1yYyqUcCMaAoOqEALw_wcB$i1754975072; FPGCLGS=2.1.k1$i1754975069$u119136971; FPGSID=1.1754977083.1754977871.G-B7X5MKCR35.bCN2h6LqGmHJHZTig8x-mQ; _ga=GA1.1.814810893.1754975070; li_fat_id_s=undefined; mto_pvs=6; v:a:3=%7B%22d013c5daedc1cac4ee7ae3a63ed07338%22%3A%7B%22variant%22%3A%22treatment%22%2C%22createdAt%22%3A1754975069120%7D%7D; 70409945111--Order--selected-location=[{%22id%22:%22MULTILOCATION_ALL_LOCATIONS_KEY%22}]; koa.sid=C6gDUAvFB9_geqX3zOSvnx1wMAjY8bSg; koa.sid.sig=vvo3v2684fZy_Qr3LdQaV-lk9aE; _gcl_au=1.1.966784902.1754975069; _gcl_aw=GCL.1754975069.Cj0KCQjwqebEBhD9ARIsAFZMbfwRGvvDE0ENWeMM_ioKu6OXMNafzNKhQJ5K5ag-L2f1Ob1yYyqUcCMaAoOqEALw_wcB; FPLC=MxgTCN7yTfyUGOS2jayZAYQJjQRj0wkeLTkNoqFcDplDowTU%2F3KvK1njVaH5gXZDXsWJ%2BcAZ9UM0q5JyZzAeMaO0L4zPM%2Bp8TMDhacOCRdPsm%2FEBR96WqN%2FTB3W9Qw%3D%3D; _gcl_gs=2.1.k1$i1754975066$u119136971; utm_medium=cpc; utm_source=google; _merchant_marketing=%3AAZicqmNIAAEAVGdWD7qXmfQT-u9_FU1BeMzXsURex_IBAwjXlb9HQcHKTMuw%3A`;
const prisma = getPrisma();
// Optional: if you prefer unauthenticated storefront products
// const SHOP_DOMAIN = "your-store.myshopify.com"; // if set, use fetchStorefrontProducts()

/** ===================== TYPES ===================== */

type AdminProduct = {
  id: string;
  title: string;
  handle: string | null;
  status: string | null;
  images: { src: string }[];
  variants: {
    id: string;
    title: string;
    sku?: string | null;
    price?: string | null;
  }[];
};

/** ===================== ADMIN GRAPHQL STRATEGY ===================== */

const ADMIN_ENDPOINT = (handle: string) =>
  `https://admin.shopify.com/api/shopify/${handle}?operation=ProductsQuery&type=query`;

const ADMIN_QUERY = `#graphql
query ProductsQuery($first:Int!, $after:String) {
  products(first: $first, after: $after, reverse: false, sortKey: UPDATED_AT) {
    edges {
      cursor
      node {
        id
        title
        handle
        status
        variants(first: 100) { edges { node { id title sku price } } }
        images(first: 10) { edges { node { url } } }
      }
    }
    pageInfo { hasNextPage endCursor }
  }
}`;

async function fetchAdminPage(first: number, after?: string | null) {
  const body = JSON.stringify({
    operationName: "ProductsQuery",
    variables: { first, after: after || null },
    query: ADMIN_QUERY,
  });

  const res = await fetch(ADMIN_ENDPOINT(ADMIN_STORE_HANDLE), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Cookie: ADMIN_COOKIE,
      Origin: "https://admin.shopify.com",
      Referer: `https://admin.shopify.com/store/${ADMIN_STORE_HANDLE}/products`,
      "apollographql-client-name": "core",
      "x-shopify-web-force-proxy": "1",
      "x-csrf-token": "QcHBhFofoV-CxDj7zZ4ranM79dz7DrIhVF7PzE",
      // User-Agent similar to Safari to match your captured request
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15",
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Admin fetch failed ${res.status}: ${text}`);
  }

  const data = (await res.json()) as any;
  const edges = data?.data?.products?.edges ?? [];
  const pageInfo = data?.data?.products?.pageInfo ?? {};

  const items: AdminProduct[] = edges.map((e: any) => ({
    id: e.node.id,
    title: e.node.title,
    handle: e.node.handle ?? null,
    status: e.node.status ?? null,
    images: (e.node.images?.edges ?? []).map((ie: any) => ({
      src: ie.node.url,
    })),
    variants: (e.node.variants?.edges ?? []).map((ve: any) => ({
      id: ve.node.id,
      title: ve.node.title,
      sku: ve.node.sku,
      price: ve.node.price,
    })),
  }));

  return {
    items,
    next: pageInfo?.hasNextPage ? pageInfo.endCursor : null,
  } as const;
}

/**
 * Fetch all products via Admin GraphQL using your current cookie.
 */
export async function extractShopifyProducts(): Promise<AdminProduct[]> {
  if (
    !ADMIN_STORE_HANDLE ||
    (ADMIN_STORE_HANDLE.includes("114925-b6") === false &&
      ADMIN_STORE_HANDLE.trim() === "")
  ) {
    throw new Error("Set ADMIN_STORE_HANDLE");
  }
  if (!ADMIN_COOKIE || ADMIN_COOKIE.includes("PASTE_FULL_COOKIE_STRING_HERE")) {
    throw new Error("Paste your ADMIN_COOKIE string into shopify.ts");
  }

  const pageSize = 100; // Shopify allows up to 250 in many cases - 100 is safe
  let cursor: string | null = null;
  const all: AdminProduct[] = [];

  /* Paginate until exhaustion */
  // eslint-disable-next-line no-constant-condition
  while (true) {
    console.log(all.length);
    console.log(all.at(all.length - 1));

    const { items, next } = await fetchAdminPage(pageSize, cursor);

    for (const item of items.slice(0,2)) {
      await prisma.shopifyProduct.create({
        data: {
          id: item.id,
          handle: item.handle,
          status: item.status,
          title: item.title,
          images: {
            createMany: {
              data: item.images.map((img) => ({
                src: img.src,
              })),
            },
          },
          variants: {
            createMany: {
              data: item.variants.map((variant) => ({
                id: variant.id,
                price: variant.price,
                sku: variant.sku,
                title: variant.title,
              })),
            },
          },
        },
      });
    }

    all.push(...items);
    if (!next) break;
    cursor = next;
  }

  return all;
}

/**
 * Entry point - run and print all products.
 */
(async () => {
  try {
    console.log(">>>>>");

    const products = await extractShopifyProducts();
    console.log(`Fetched ${products.length} products`);
    for (const p of products) {
      // One line per product for easy grepping
      console.log(JSON.stringify(p));
    }
  } catch (err: any) {
    console.error("Error:", err?.message || err);
    process.exitCode = 1;
  }
})();
