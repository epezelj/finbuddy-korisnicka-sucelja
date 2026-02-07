// app/blog/page.tsx
import Link from "next/link";
import { listPosts } from "@/lib/blog";

export default async function BlogPage() {
  const posts = await listPosts();

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <h1>Blog</h1>
      <ul>
        // app/(app)/blog/page.tsx
      {posts.map((p) => (
        <li key={p.id}>
          <Link href={`/blog/${p.slug}`}>{p.title}</Link>

          {/* Use 'featuredImageUrl' here */}
          {p.featuredImageUrl && (
            <img
              src={p.featuredImageUrl}
              alt={p.title}
              style={{ width: "100%", borderRadius: 12, marginTop: 6 }}
            />
          )}
        </li>
      ))} 

      </ul>
    </main>
  );
}
