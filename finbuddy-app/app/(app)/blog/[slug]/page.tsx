import { notFound } from "next/navigation";
import { getPost, resolveAssetUrlById } from "@/lib/blog";
import { richTextToHtml } from "@/lib/content-render";

// Find first embedded image inside Contentful Rich Text
function findFirstEmbeddedAssetId(richText: any): string | undefined {
  if (!richText) return undefined;

  const walk = (node: any): string | undefined => {
    if (!node) return undefined;

    if (node.nodeType === "embedded-asset-block") {
      return node?.data?.target?.sys?.id;
    }

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

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string } | Promise<{ slug: string }>;
}) {
  const { slug } = await Promise.resolve(params);

  const post = await getPost(slug);
  if (!post) notFound();

  const fields = post.fields;

  // ✅ Featured image (separate field)
  const featuredAssetId = fields.featuredImage?.sys?.id;
  const featuredImageUrl = resolveAssetUrlById(post.includes, featuredAssetId);

  const featuredAsset =
    post.includes?.Asset?.find((a: any) => a.sys.id === featuredAssetId);
  const featuredImageAlt = featuredAsset?.fields?.title || fields.title;

  // ✅ Content image (first image embedded in Rich Text)
  const firstContentAssetId = findFirstEmbeddedAssetId(fields.content);
  const contentImageUrl = resolveAssetUrlById(post.includes, firstContentAssetId);

  // Render Rich Text to HTML (should also render images if your renderer supports EMBEDDED_ASSET)
  const contentHtml = fields.content
    ? richTextToHtml(fields.content, post.includes)
    : "<p>No content available</p>";

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "12px" }}>
        {fields.title}
      </h1>

      {/* Featured image */}
      {featuredImageUrl && (
        <img
          src={featuredImageUrl}
          alt={featuredImageAlt}
          style={{
            width: "100%",
            borderRadius: "12px",
            marginBottom: "20px",
            objectFit: "cover",
            height: "400px",
          }}
        />
      )}

      {/* Content image (first embedded image from rich text) */}
      {contentImageUrl && (
        <img
          src={contentImageUrl}
          alt={`${fields.title} - content image`}
          style={{
            width: "100%",
            borderRadius: "12px",
            marginBottom: "20px",
            objectFit: "cover",
            maxHeight: "500px",
          }}
        />
      )}

      {/* Rich Text content */}
      <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
    </main>
  );
}
