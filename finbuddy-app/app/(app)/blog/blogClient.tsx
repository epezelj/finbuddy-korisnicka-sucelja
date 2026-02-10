"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Post = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  featuredImageUrl?: string | null;
  publishedDate?: string | null;
};

export default function BlogIndexClient({
  posts,
  featuredSlug,
}: {
  posts: Post[];
  featuredSlug: string | null;
}) {
  const [query, setQuery] = useState("");

  const { featured, filtered } = useMemo(() => {
    const q = query.trim().toLowerCase();

    const featuredPost = featuredSlug ? posts.find((p) => p.slug === featuredSlug) : undefined;

    const rest = posts.filter((p) => p.slug !== featuredSlug);

    const filteredRest = !q
      ? rest
      : rest.filter((p) => {
          const hay = `${p.title ?? ""} ${p.subtitle ?? ""}`.toLowerCase();
          return hay.includes(q);
        });

    const featuredMatches =
      !q || !featuredPost
        ? featuredPost
        : (`${featuredPost.title ?? ""} ${featuredPost.subtitle ?? ""}`.toLowerCase().includes(q)
            ? featuredPost
            : undefined);

    return { featured: featuredMatches, filtered: filteredRest };
  }, [posts, featuredSlug, query]);

  const resultsCount = (featured ? 1 : 0) + filtered.length;

  return (
    <>
      {/* Search toolbar */}
      <div className="toolbar">
        <input
          className="search"
          placeholder="Search posts…"
          aria-label="Search posts"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="hint">{resultsCount} results</div>
      </div>

      {featured && (
        <Link href={`/blog/${featured.slug}`} className="featured" aria-label="Featured article">
          {featured.featuredImageUrl ? (
            <img src={featured.featuredImageUrl} alt={featured.title} className="featuredImg" />
          ) : (
            <div className="featuredImg" />
          )}

          <div className="featuredBody">
            <div className="featuredKicker">Featured • Start here</div>
            <h2 className="featuredTitle">{featured.title}</h2>
            {featured.subtitle ? <p className="featuredSub">{featured.subtitle}</p> : null}

            <div className="featuredMeta">
              <span>
                {featured.publishedDate
                  ? new Date(featured.publishedDate).toLocaleDateString()
                  : "—"}
              </span>
              <span className="cta">Read the guide →</span>
            </div>
          </div>
        </Link>
      )}

      <section className="grid" aria-label="Blog posts">
        {filtered.map((p) => (
          <Link key={p.id} href={`/blog/${p.slug}`} className="card">
            {p.featuredImageUrl ? (
              <img src={p.featuredImageUrl} alt={p.title} className="thumb" />
            ) : (
              <div className="thumb" />
            )}

            <div className="body">
              <h2 className="cardTitle">{p.title}</h2>
              {p.subtitle ? <p className="cardSub">{p.subtitle}</p> : null}

              <div className="metaRow">
                {p.publishedDate ? (
                  <span>{new Date(p.publishedDate).toLocaleDateString()}</span>
                ) : (
                  <span>—</span>
                )}
                <span className="pill">Read</span>
              </div>
            </div>
          </Link>
        ))}
      </section>

      {resultsCount === 0 && (
        <div className="empty">No posts match your search.</div>
      )}
    </>
  );
}
