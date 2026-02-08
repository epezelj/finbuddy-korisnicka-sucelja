// lib/blog.ts
import { cf, toHttps } from "@/lib/contentful";

const BLOG_POST_TYPE = "pageBlogPost";

type EntriesResponse = {
  items: any[];
  includes?: { Asset?: any[]; Entry?: any[] };
};

function resolveAssetUrlById(includes: any, assetId?: string) {
  if (!assetId) return undefined;
  const asset = includes?.Asset?.find((a: any) => a.sys.id === assetId);
  const rawUrl = asset?.fields?.file?.url;
  return toHttps(rawUrl);
}

export async function listPosts() {
  const data = await cf<EntriesResponse>("/entries", {
    content_type: BLOG_POST_TYPE,
    order: "-fields.publishedDate",
    limit: "100",
    include: "2",
  });

  return data.items.map((it: any) => {
    const featuredAssetId = it.fields.featuredImage?.sys?.id;
    return {
      id: it.sys.id,
      slug: it.fields.slug,
      title: it.fields.title,
      subtitle: it.fields.subtitle,
      publishedDate: it.fields.publishedDate,
      featuredImageUrl: resolveAssetUrlById(data.includes, featuredAssetId),
    };
  });
}

// lib/blog.ts
export async function getPost(slug: string) {
  const data = await cf<any>("/entries", {
    content_type: BLOG_POST_TYPE,
    "fields.slug": slug,
    limit: "1",
    include: "3",
  });

  console.log("BLOG_POST_TYPE =", BLOG_POST_TYPE);
  console.log("slug param =", slug);
  console.log("items length =", data?.items?.length);
  console.log("first item fields.slug =", data?.items?.[0]?.fields?.slug);

  const item = data.items?.[0];
  if (!item) return null;

  return { fields: item.fields, includes: data.includes };
}
