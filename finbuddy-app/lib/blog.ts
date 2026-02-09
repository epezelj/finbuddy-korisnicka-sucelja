// lib/blog.ts
import { cf, toHttps } from "@/lib/contentful";

const BLOG_POST_TYPE = "pageBlogPost";

type EntriesResponse = {
  items: any[];
  includes?: { Asset?: any[]; Entry?: any[] };
};

export function resolveAssetUrlById(includes: any, assetId?: string) {
  if (!assetId) return undefined;
  const asset = includes?.Asset?.find((a: any) => a.sys.id === assetId);
  const rawUrl = asset?.fields?.file?.url;
  return toHttps(rawUrl);
}


function findFirstEmbeddedAssetId(richText: any): string | undefined {
  if (!richText) return undefined;

  // Rich Text is a tree: walk recursively
  const walk = (node: any): string | undefined => {
    if (!node) return undefined;

    // Contentful rich text image
    if (node.nodeType === "embedded-asset-block") {
      return node?.data?.target?.sys?.id;
    }

    // Recurse children
    if (Array.isArray(node.content)) {
      for (const child of node.content) {
        const found = walk(child);
        if (found) return found;
      }
    }

    return undefined;
  };

  return walk(richText);
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

  const firstContentAssetId = findFirstEmbeddedAssetId(it.fields.content);

  return {
    id: it.sys.id,
    slug: it.fields.slug,
    title: it.fields.title,
    subtitle: it.fields.subtitle,
    publishedDate: it.fields.publishedDate,

    featuredImageUrl: resolveAssetUrlById(data.includes, featuredAssetId),

    // ✅ "normal" image from Rich Text (first embedded image)
    contentImageUrl: resolveAssetUrlById(data.includes, firstContentAssetId),
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

// /lib/blog.ts
// Add this next to getPost()

export async function getPosts({ limit = 24 }: { limit?: number } = {}) {
  const data = await cf<any>("/entries", {
    content_type: BLOG_POST_TYPE,
    order: "-sys.createdAt",
    limit: String(limit),
    include: "2",
  });

  const items = data?.items ?? [];
  return items.map((item: any) => ({
    fields: item.fields,
    includes: data.includes,
  }));
}

