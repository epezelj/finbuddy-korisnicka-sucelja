import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost, getPosts, resolveAssetUrlById } from "@/lib/blog";
import { richTextToHtml } from "@/lib/content-render";
import styles from "./blogPostStyle.module.css";


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
  <main className={styles.blog}>
    <div className={styles.shell}>
      <h1>{fields.title}</h1>

      <div className={styles.meta}>
        <strong>Reading time:</strong> ~{Math.max(3, Math.round(contentHtml.length / 5 / 900))} min
        <span style={{ margin: "0 10px", opacity: 0.4 }}>|</span>
        <strong>Topic:</strong> Finance
      </div>

      {lead && <p className={styles.lead}>{lead}</p>}

      {featuredImageUrl && (
        <img src={featuredImageUrl} alt={featuredImageAlt} className={styles.heroImg} />
      )}

      {contentImageUrl && (
        <img
          src={contentImageUrl}
          alt={`${fields.title} - content image`}
          className={styles.contentImg}
        />
      )}

      <div className={styles.divider} />

      <article className={styles.content} dangerouslySetInnerHTML={{ __html: contentHtml }} />

      {related.length > 0 && (
        <section className={styles.relatedWrap} aria-label="Related articles">
          <h2 className={styles.relatedTitle}>Related articles</h2>
          <div className={styles.relatedGrid}>
            {related.map((p: any) => {
              const relFeaturedId = p.fields.featuredImage?.sys?.id;
              const relImg = resolveAssetUrlById(p.includes, relFeaturedId);
              const relTitle = p.fields.title;
              const relSlug = p.fields.slug;

              return (
                <Link key={relSlug} href={`/blog/${relSlug}`} className={styles.card}>
                  {relImg ? (
                    <img className={styles.cardImg} src={relImg} alt={relTitle} />
                  ) : (
                    <div className={styles.cardImg} />
                  )}
                  <div className={styles.cardBody}>
                    <p className={styles.cardTitle}>{relTitle}</p>
                    <p className={styles.cardMeta}>Read next →</p>
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
