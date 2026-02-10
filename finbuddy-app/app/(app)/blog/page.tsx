import BlogClient from "./blogClient";
import { listPosts } from "@/lib/blog";
import blogPostStyle from "./blogPostStyle.module.css";


function blogIndexStyles() {
  return `
    .blogIndex {
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
      color: #0f172a;
    }

    .wrap {
      max-width: 1100px;
      margin: 0 auto;
      padding: 28px 18px 70px;
    }

    .hero {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 22px 22px 20px;
      border-radius: 18px;
      border: 1px solid rgba(15, 23, 42, 0.10);
      background: linear-gradient(180deg, rgba(2,132,199,0.08), rgba(255,255,255,0.9));
      box-shadow: 0 14px 34px rgba(15, 23, 42, 0.06);
      margin-bottom: 18px;
    }

    .title {
      font-size: clamp(2rem, 3.2vw, 2.6rem);
      font-weight: 900;
      letter-spacing: -0.02em;
      line-height: 1.08;
      margin: 0;
    }

    .subtitle {
      margin: 0;
      color: #334155;
      font-size: 1.05rem;
      line-height: 1.6;
      max-width: 72ch;
    }

    .toolbar {
      display: flex;
      gap: 12px;
      align-items: center;
      justify-content: space-between;
      margin: 16px 0 18px;
      flex-wrap: wrap;
    }

    .search {
      flex: 1;
      min-width: 240px;
      padding: 10px 12px;
      border-radius: 12px;
      border: 1px solid rgba(15, 23, 42, 0.14);
      background: rgba(255,255,255,0.92);
      outline: none;
      font-size: 0.95rem;
    }

    .hint {
      color: #64748b;
      font-size: 0.92rem;
      white-space: nowrap;
    }

    .featured {
      display: grid;
      grid-template-columns: 1.35fr 1fr;
      gap: 16px;
      border-radius: 18px;
      border: 1px solid rgba(15, 23, 42, 0.10);
      background: rgba(255,255,255,0.95);
      box-shadow: 0 14px 34px rgba(15, 23, 42, 0.07);
      overflow: hidden;
      text-decoration: none;
      color: inherit;
      margin: 18px 0 10px;
      transition: transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease;
    }

    .featured:hover {
      transform: translateY(-2px);
      box-shadow: 0 18px 46px rgba(15, 23, 42, 0.10);
      border-color: rgba(2, 132, 199, 0.30);
    }

    .featuredImg {
      width: 100%;
      height: 320px;
      object-fit: cover;
      display: block;
      background: rgba(15,23,42,0.04);
    }

    .featuredBody {
      padding: 18px 18px 18px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 10px;
    }

    .featuredKicker {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      width: fit-content;
      padding: 6px 10px;
      border-radius: 999px;
      border: 1px solid rgba(15, 23, 42, 0.12);
      background: rgba(2, 132, 199, 0.08);
      color: #0f172a;
      font-weight: 900;
      font-size: 0.82rem;
      letter-spacing: -0.01em;
    }

    .featuredTitle {
      margin: 0;
      font-size: 1.5rem;
      line-height: 1.2;
      font-weight: 950;
      letter-spacing: -0.02em;
    }

    .featuredSub {
      margin: 0;
      color: #475569;
      line-height: 1.6;
      font-size: 1rem;
    }

    .featuredMeta {
      margin-top: 6px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      color: #64748b;
      font-size: 0.9rem;
    }

    .cta {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 10px 12px;
      border-radius: 12px;
      border: 1px solid rgba(2, 132, 199, 0.30);
      background: rgba(2, 132, 199, 0.10);
      font-weight: 900;
      color: #0f172a;
      width: fit-content;
      white-space: nowrap;
    }

    @media (max-width: 860px) {
      .featured { grid-template-columns: 1fr; }
      .featuredImg { height: 220px; }
    }

    /* Grid list */
    .grid {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: 16px;
      margin-top: 10px;
    }

    @media (max-width: 860px) {
      .grid { grid-template-columns: 1fr; }
    }

    .card {
      grid-column: span 4;
      text-decoration: none;
      color: inherit;
      border-radius: 18px;
      overflow: hidden;
      border: 1px solid rgba(15, 23, 42, 0.10);
      background: rgba(255,255,255,0.92);
      box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
      transition: transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease;
      display: flex;
      flex-direction: column;
      min-height: 100%;
    }

    @media (max-width: 860px) {
      .card { grid-column: span 12; }
    }

    .card:hover {
      transform: translateY(-2px);
      box-shadow: 0 16px 40px rgba(15, 23, 42, 0.10);
      border-color: rgba(2, 132, 199, 0.30);
    }

    .thumb {
      width: 100%;
      height: 210px;
      object-fit: cover;
      display: block;
      background: rgba(15,23,42,0.04);
    }

    .body {
      padding: 14px 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .cardTitle {
      font-weight: 950;
      font-size: 1.05rem;
      line-height: 1.25;
      letter-spacing: -0.01em;
      margin: 0;
    }

    .cardSub {
      margin: 0;
      color: #475569;
      line-height: 1.55;
      font-size: 0.95rem;
    }

    .metaRow {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-top: 6px;
      color: #64748b;
      font-size: 0.85rem;
    }

    .pill {
      padding: 6px 10px;
      border-radius: 999px;
      border: 1px solid rgba(15, 23, 42, 0.10);
      background: rgba(255,255,255,0.7);
      color: #0f172a;
      font-weight: 900;
      font-size: 0.8rem;
      white-space: nowrap;
    }

    .empty {
      margin-top: 18px;
      padding: 16px;
      border-radius: 14px;
      border: 1px dashed rgba(15, 23, 42, 0.22);
      color: #475569;
      background: rgba(255,255,255,0.7);
    }

`;
}

export default async function BlogPage() {
  const posts = await listPosts();

  const featured =
    posts.find((p) => p.slug === "investing-for-beginners") ??
    posts.find((p) => p.title?.toLowerCase().includes("investing for beginners"));

  return (
    <main className="blogIndex">
      <style dangerouslySetInnerHTML={{ __html: blogIndexStyles() }} />

      <div className="wrap">
        <header className="hero">
          <p className="subtitle">
            Practical, beginner-friendly finance content on budgeting, debt, and investing—built for
            everyday decisions and long-term progress.
          </p>
        </header>

        <BlogClient posts={posts} featuredSlug={featured?.slug ?? null} />      
        

        
        {posts.length === 0 && (
          <div className="empty">
            No posts yet. Publish a post in Contentful and it will show up here.
          </div>
        )}
      </div>
    </main>
  );
}
