import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Suspense } from "react";
import { Navigation } from "@components/navigation";
import { notFound } from "next/navigation";
import { strapiFetch } from "@/lib/strapi";

function getAttrs<T extends object>(entity: any): T {
  return (entity?.attributes ?? entity ?? {}) as T;
}

type StrapiListResponse<T> = { data: any[] };

type AuthorAttrs = { name?: string; username?: string };
type ArticleAttrs = {
  title?: string;
  description?: string;
  slug?: string;
  blocks?: any[];
  author?: { data?: any } | any;
};

async function fetchArticleBySlug(slug: string) {
  const qs = new URLSearchParams({
    "filters[slug][$eq]": slug,
    "populate[author]": "true",
    "populate[blocks]": "true",
  });

  const json = await strapiFetch<StrapiListResponse<ArticleAttrs>>(
    `/api/articles?${qs.toString()}`
  );

  const a = json.data?.[0];
  if (!a) return null;

  const attrs = getAttrs<ArticleAttrs>(a);

  const authorEntity = attrs.author?.data ?? attrs.author ?? null;
  const authorAttrs = getAttrs<AuthorAttrs>(authorEntity);

  return {
    title: String(attrs.title ?? "Untitled"),
    description: String(attrs.description ?? ""),
    slug: String(attrs.slug ?? slug),
    blocks: attrs.blocks ?? [],
    authorName: String(authorAttrs.name ?? authorAttrs.username ?? "Unknown"),
  };
}

function PostSkeleton() {
  return (
    <article className="w-3xl bg-white shadow-lg rounded-lg overflow-hidden p-6 animate-pulse">
      <Link
        href="/blog"
        className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200 mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to all posts
      </Link>
      <div className="h-10 w-2/3 bg-gray-200 rounded mb-4" />
      <div className="space-y-2">
        <div className="h-4 w-full bg-gray-100 rounded" />
        <div className="h-4 w-5/6 bg-gray-100 rounded" />
      </div>
    </article>
  );
}

async function PostContent({ slug }: { slug: string }) {
  const article = await fetchArticleBySlug(slug);
  if (!article) notFound();

  return (
    <article className="max-w-3xl bg-white shadow-lg rounded-lg overflow-hidden p-6">
      <Link
        href="/blog"
        className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200 mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to all posts
      </Link>

      <h1 className="text-3xl md:text-4xl capitalize font-extrabold tracking-tight text-gray-900 mb-2">
        {article.title}
      </h1>

      <p className="text-sm text-gray-500 mb-6">By {article.authorName}</p>
      <p className="text-gray-700 mb-8">{article.description}</p>

      <pre className="text-xs bg-gray-50 border rounded p-4 overflow-auto">
        {JSON.stringify(article.blocks, null, 2)}
      </pre>
    </article>
  );
}

export default async function BlogPost({ params }: { params: { slug: string } }) {
  return (
    <main className="flex flex-col items-center p-10">
      <Navigation />
      <Suspense fallback={<PostSkeleton />}>
        <PostContent slug={params.slug} />
      </Suspense>
    </main>
  );
}