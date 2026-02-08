// app/blog/page.tsx
import Link from "next/link";
import { listPosts } from "@/lib/blog";

export default async function BlogPage() {
  const posts = await listPosts();

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 34, marginBottom: 18 }}>Blog</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
        {posts.map((p) => (
          <Link
            key={p.id}
            href={`/blog/${p.slug}`}
            style={{
              textDecoration: "none",
              color: "inherit",
              border: "1px solid #eee",
              borderRadius: 16,
              overflow: "hidden",
              background: "#fff",
            }}
          >
            {p.featuredImageUrl ? (
              <img
                src={p.featuredImageUrl}
                alt={p.title}
                style={{ width: "100%", height: 200, objectFit: "cover" }}
              />
            ) : null}

            <div style={{ padding: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 18, lineHeight: 1.2 }}>{p.title}</div>
              {p.subtitle ? <div style={{ color: "#666", marginTop: 6 }}>{p.subtitle}</div> : null}
              {p.publishedDate ? (
                <div style={{ color: "#888", marginTop: 10, fontSize: 13 }}>
                  {new Date(p.publishedDate).toLocaleDateString()}
                </div>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
