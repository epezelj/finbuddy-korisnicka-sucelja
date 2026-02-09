import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost, getPosts, resolveAssetUrlById } from "@/lib/blog";
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

function blogStyles() {
  return `
    .blog {
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
      color: #0f172a;
    }

    .shell { max-width: 880px; margin: 0 auto; padding: 28px 18px 60px; }

    .blog h1 {
      font-size: clamp(2rem, 3vw, 2.75rem);
      line-height: 1.1;
      letter-spacing: -0.02em;
      margin: 0 0 0.75rem;
      font-weight: 800;
    }

    .meta { color: #475569; font-size: 0.95rem; margin-bottom: 1.5rem; }

    .lead {
      font-size: 1.125rem;
      line-height: 1.75;
      color: #334155;
      margin: 1rem 0 1.75rem;
    }

    .heroImg {
      width: 100%;
      border-radius: 16px;
      margin: 1.25rem 0 1.75rem;
      object-fit: cover;
      height: 420px;
      box-shadow: 0 12px 30px rgba(15, 23, 42, 0.12);
    }

    .contentImg {
      width: 100%;
      border-radius: 16px;
      margin: 1.25rem 0 1.75rem;
      object-fit: cover;
      max-height: 520px;
      box-shadow: 0 10px 24px rgba(15, 23, 42, 0.10);
    }

    .divider { height: 1px; background: rgba(15, 23, 42, 0.08); margin: 1.25rem 0 0; }

    .content { font-size: 1.05rem; line-height: 1.85; }
    .content p { margin: 0 0 1.1rem; }

    .content h2 { margin: 2rem 0 0.75rem; font-size: 1.35rem; font-weight: 800; letter-spacing: -0.01em; }
    .content h3 { margin: 1.5rem 0 0.5rem; font-size: 1.15rem; font-weight: 800; }

    .content strong { font-weight: 800; color: #0f172a; }
    .content mark { background: rgba(250, 204, 21, 0.35); padding: 0.05em 0.25em; border-radius: 0.35em; }

    .content img {
      width: 100%;
      border-radius: 14px;
      margin: 1rem 0 1.5rem;
      box-shadow: 0 10px 22px rgba(15, 23, 42, 0.10);
    }

    /* Related section */
    .relatedWrap { margin-top: 3rem; }
    .relatedTitle { font-size: 1.15rem; font-weight: 900; margin: 0 0 0.9rem; letter-spacing: -0.01em; }
    .relatedGrid {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: 14px;
      margin-top: 0.75rem;
    }
    @media (max-width: 860px) {
      .relatedGrid { grid-template-columns: 1fr; }
    }
    .card {
      grid-column: span 4;
      border-radius: 16px;
      border: 1px solid rgba(15, 23, 42, 0.10);
      background: rgba(255,255,255,0.9);
      box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
      overflow: hidden;
      transition: transform 140ms ease, box-shadow 140ms ease;
      text-decoration: none;
      color: inherit;
      display: block;
      min-height: 100%;
    }
    @media (max-width: 860px) { .card { grid-column: span 12; } }
    .card:hover {
      transform: translateY(-2px);
      box-shadow: 0 14px 34px rgba(15, 23, 42, 0.10);
    }
    .cardImg {
      width: 100%;
      height: 160px;
      object-fit: cover;
      display: block;
      background: rgba(15,23,42,0.04);
    }
    .cardBody { padding: 12px 12px 14px; }
    .cardTitle { font-weight: 900; line-height: 1.25; margin: 0 0 6px; }
    .cardMeta { color: #475569; font-size: 0.92rem; margin: 0; }
  `;
}

// Optional: lead from first paragraph
function getFirstParagraphText(richText: any): string | undefined {
  try {
    const firstPara = richText?.content?.find((n: any) => n.nodeType === "paragraph");
    const text = firstPara?.content?.map((c: any) => c.value).join("").trim();
    return text || undefined;
  } catch {
    return undefined;
  }
}

// Very simple “relatedness”: shared tags if present; otherwise latest posts.
// Adjust fields used here to match your Contentful model (tags/category/topic).
function scoreRelated(current: any, candidate: any) {
  const currentTags: string[] = current?.fields?.tags ?? current?.fields?.categories ?? [];
  const candTags: string[] = candidate?.fields?.tags ?? candidate?.fields?.categories ?? [];

  if (Array.isArray(currentTags) && Array.isArray(candTags) && currentTags.length && candTags.length) {
    const set = new Set(currentTags.map((t) => String(t).toLowerCase()));
    let score = 0;
    for (const t of candTags) if (set.has(String(t).toLowerCase())) score += 1;
    return score;
  }

  // fallback: weak signal using title words overlap
  const a = String(current?.fields?.title ?? "").toLowerCase().split(/\W+/).filter(Boolean);
  const b = String(candidate?.fields?.title ?? "").toLowerCase().split(/\W+/).filter(Boolean);
  const aset = new Set(a);
  let s = 0;
  for (const w of b) if (aset.has(w) && w.length > 3) s += 0.25;
  return s;
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

  const featuredAsset = post.includes?.Asset?.find((a: any) => a.sys.id === featuredAssetId);
  const featuredImageAlt = featuredAsset?.fields?.title || fields.title;

  // ✅ Content image (first image embedded in Rich Text)
  const firstContentAssetId = findFirstEmbeddedAssetId(fields.content);
  const contentImageUrl = resolveAssetUrlById(post.includes, firstContentAssetId);

  // Render Rich Text to HTML
  const contentHtml = fields.content
    ? richTextToHtml(fields.content, post.includes)
    : "<p>No content available</p>";

  const lead = getFirstParagraphText(fields.content);

  // ✅ Related posts (top 3)
  // NOTE: This assumes you have getPosts() in /lib/blog that returns an array of posts with fields.slug + fields.title
  const allPosts = await getPosts({ limit: 20 }); // adjust to your API
  const related = (allPosts ?? [])
    .filter((p: any) => p?.fields?.slug && p.fields.slug !== slug)
    .map((p: any) => ({ post: p, score: scoreRelated(post, p) }))
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, 3)
    .map((x: any) => x.post);

  return (
    <main className="blog">
      <style dangerouslySetInnerHTML={{ __html: blogStyles() }} />

      <div className="shell">
        <h1>{fields.title}</h1>

        <div className="meta">
          <strong>Reading time:</strong> ~{Math.max(3, Math.round(contentHtml.length / 5 / 900))} min
          <span style={{ margin: "0 10px", opacity: 0.4 }}>|</span>
          <strong>Topic:</strong> Finance
        </div>

        {lead && <p className="lead">{lead}</p>}

        {featuredImageUrl && (
          <img src={featuredImageUrl} alt={featuredImageAlt} className="heroImg" />
        )}

        {contentImageUrl && (
          <img
            src={contentImageUrl}
            alt={`${fields.title} - content image`}
            className="contentImg"
          />
        )}

        <div className="divider" />

        <article className="content" dangerouslySetInnerHTML={{ __html: contentHtml }} />

        {/* ✅ Related articles */}
        {related.length > 0 && (
          <section className="relatedWrap" aria-label="Related articles">
            <h2 className="relatedTitle">Related articles</h2>
            <div className="relatedGrid">
              {related.map((p: any) => {
                const relFeaturedId = p.fields.featuredImage?.sys?.id;
                const relImg = resolveAssetUrlById(p.includes, relFeaturedId);
                const relTitle = p.fields.title;
                const relSlug = p.fields.slug;

                return (
                  <Link key={relSlug} href={`/blog/${relSlug}`} className="card">
                    {relImg ? (
                      <img className="cardImg" src={relImg} alt={relTitle} />
                    ) : (
                      <div className="cardImg" />
                    )}
                    <div className="cardBody">
                      <p className="cardTitle">{relTitle}</p>
                      <p className="cardMeta">Read next →</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
