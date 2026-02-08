// app/blog/[slug]/page.tsx

import { notFound } from "next/navigation";
import { getPost } from "@/lib/blog";
import { richTextToHtml } from "@/lib/content-render";

// Helper: Contentful često vraća //images.ctfassets.net/...
const toHttps = (url?: string) =>
  url?.startsWith("//") ? `https:${url}` : url;

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // ✅ Next.js 16: params je Promise → mora se awaitati
  const { slug } = await params;

  if (!slug) notFound();

  const post = await getPost(slug);
  if (!post) notFound();

  const fields = post.fields;

  const featuredImageUrl = toHttps(
    fields.featuredImage?.fields?.file?.url
  );
  const featuredImageAlt =
    fields.featuredImage?.fields?.title || fields.title;

  const contentHtml = fields.content
    ? richTextToHtml(fields.content, post.includes)
    : "<p>No content available.</p>";

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      {/* Title */}
      <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: 8 }}>
        {fields.title}
      </h1>

      {/* Subtitle */}
      {fields.subtitle && (
        <p style={{ marginTop: 0, color: "#555" }}>
          {fields.subtitle}
        </p>
      )}

      {/* Date */}
      {fields.publishedDate && (
        <p style={{ color: "#777", fontSize: 14 }}>
          {new Date(fields.publishedDate).toLocaleDateString()}
        </p>
      )}

      {/* Featured image */}
      {featuredImageUrl && (
        <img
          src={featuredImageUrl}
          alt={featuredImageAlt}
          style={{
            width: "100%",
            height: 400,
            objectFit: "cover",
            borderRadius: 16,
            margin: "16px 0",
          }}
        />
      )}

      {/* Content (Rich Text rendered as-is) */}
      <article
        style={{ lineHeight: 1.7 }}
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />
    </main>
  );
}
