// app/blog/[slug]/page.tsx
import { notFound } from "next/navigation";
import { getPost } from "@/lib/blog";
import { richTextToHtml } from "@/lib/content-render";

const toHttps = (u?: string) => (u?.startsWith("//") ? `https:${u}` : u);

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);
  if (!post) notFound();

  const f = post.fields;

  const featuredUrl = toHttps(f.featuredImage?.fields?.file?.url);
  const featuredAlt = f.featuredImage?.fields?.title || f.title;

  const html = f.content ? richTextToHtml(f.content, post.includes) : "<p>No content</p>";

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <h1 style={{ marginBottom: 6 }}>{f.title}</h1>
      {f.subtitle ? <p style={{ marginTop: 0, color: "#555" }}>{f.subtitle}</p> : null}
      {f.publishedDate ? <p style={{ color: "#777" }}>{new Date(f.publishedDate).toLocaleDateString()}</p> : null}

      {featuredUrl ? (
        <img
          src={featuredUrl}
          alt={featuredAlt}
          style={{ width: "100%", borderRadius: 12, margin: "12px 0" }}
        />
      ) : null}

      <div dangerouslySetInnerHTML={{ __html: html }} />

      <hr style={{ margin: "24px 0" }} />

      <h3>Raw fields (as-is)</h3>
      <pre style={{ background: "#f6f6f6", padding: 12, borderRadius: 12, overflow: "auto" }}>
        {JSON.stringify(f, null, 2)}
      </pre>
    </main>
  );
}
