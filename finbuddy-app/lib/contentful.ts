// lib/contentful.ts
const space = process.env.CONTENTFUL_SPACE_ID!;
const env = process.env.CONTENTFUL_ENVIRONMENT || "master";
const token = process.env.CONTENTFUL_DELIVERY_TOKEN!;

export async function cf<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`https://cdn.contentful.com/spaces/${space}/environments/${env}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 60 },
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
