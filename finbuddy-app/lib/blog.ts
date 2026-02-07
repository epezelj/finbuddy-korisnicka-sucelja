// lib/blog.ts
import { cf } from "@/lib/contentful";

const BLOG_POST_TYPE = "pageBlogPost"; // <-- CHANGE THIS

type EntriesResponse = {
  items: any[];
  includes?: any;
};
// lib/blog.ts
export async function listPosts() {
  const data = await cf<EntriesResponse>("/entries", {
    content_type: BLOG_POST_TYPE,
    order: "-fields.publishedDate",
    limit: "20",
    include: "3", // include assets
  });

  return data.items.map((it: any) => {
    const assetId = it.fields.featuredImage?.sys?.id; // Get asset ID from the featuredImage field
    const asset = data.includes?.Asset?.find((a: any) => a.sys.id === assetId); // Resolve asset
    const rawUrl = asset?.fields?.file?.url; // Extract URL
    const featuredImageUrl = rawUrl
      ? rawUrl.startsWith("//")
        ? `https:${rawUrl}`
        : rawUrl
      : undefined;

    return {
      id: it.sys.id,
      slug: it.fields.slug,
      title: it.fields.title,
      featuredImageUrl, // Return the resolved URL
    };
  });
}



export async function getPost(slug: string) {
  const data = await cf<EntriesResponse>("/entries", {
    content_type: BLOG_POST_TYPE,
    "fields.slug": slug,
    limit: "1",
    include: "3",
  });

  const item = data.items[0];
  if (!item) return null;

  return {
    fields: item.fields,      // <- “as is”
    includes: data.includes,  // <- needed for embedded assets/entries
  };
}
