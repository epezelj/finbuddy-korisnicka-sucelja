// lib/contentful.ts
const SPACE = process.env.CONTENTFUL_SPACE_ID!;
const ENV = process.env.CONTENTFUL_ENVIRONMENT || "master";
const TOKEN = process.env.CONTENTFUL_DELIVERY_TOKEN!; // Delivery token (read-only)
const BASE = `https://cdn.contentful.com/spaces/${SPACE}/environments/${ENV}`;

export async function cf<T>(path: string, query: Record<string, string> = {}) {
  const url = new URL(BASE + path);
  Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${TOKEN}` },
    // cache policy po želji:
    // next: { revalidate: 60 },
  });

  if (!res.ok) throw new Error(`Contentful error ${res.status}: ${await res.text()}`);
  return (await res.json()) as T;
}

export const toHttps = (u?: string) => (u?.startsWith("//") ? `https:${u}` : u);
