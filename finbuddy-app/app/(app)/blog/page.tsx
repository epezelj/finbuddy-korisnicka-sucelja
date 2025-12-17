import { loadBlogSearchParams } from "@/lib/blog-search-params";
import type { SearchParams } from "nuqs/server";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Pagination } from "../../_components/Pagination";
import { BlogFilters } from "./_components/BlogFilters";
import { notFound } from "next/navigation";
import { Navigation } from "@components/navigation";
import { strapiFetch } from "@/lib/strapi";

export const metadata: Metadata = { title: "Blog" };
const PAGE_SIZE = 6;

// ---- Helpers: supports Strapi v4 (attributes) AND v5 (flat fields) ----
function getAttrs<T extends object>(entity: any): T {
  return (entity?.attributes ?? entity ?? {}) as T;
}

type StrapiListResponse<T> = {
  data: any[];
  meta?: {
    pagination?: { page: number; pageSize: number; pageCount: number; total: number };
  };
};

type AuthorAttrs = { name?: string; username?: string };
type ArticleAttrs = {
  title?: string;
  description?: string;
  slug?: string;
  author?: { data?: any } | any; // v4 relation: {data:{...}} ; v5 might vary
};

type ArticleListItem = {
  id: number;
  title: string;
  description: string;
  slug: string;
  authorId: number;
  authorName: string;
};

async function fetchArticles(page: number, pageSize: number, authorId?: number) {
  const qs = new URLSearchParams({
    "pagination[page]": String(page),
    "pagination[pageSize]": String(pageSize),
    "sort[0]": "publishedAt:desc",
    "populate[author]": "true",
  });

  if (authorId && authorId > 0) {
    qs.set("filters[author][id][$eq]", String(authorId));
  }

  const json = await strapiFetch<StrapiListResponse<ArticleAttrs>>(
    `/api/articles?${qs.toString()}`
  );

  const articles: ArticleListItem[] = (json.data ?? []).map((a: any) => {
    const attrs = getAttrs<ArticleAttrs>(a);

    // v4: attrs.author.data exists
    const authorEntity = attrs.author?.data ?? attrs.author ?? null;
    const authorAttrs = getAttrs<AuthorAttrs>(authorEntity);

    return {
      id: Number(a?.id ?? 0),
      title: String(attrs.title ?? "Untitled"),
      description: String(attrs.description ?? ""),
      slug: String(attrs.slug ?? String(a?.id ?? "")),
      authorId: Number(authorEntity?.id ?? 0),
      authorName: String(authorAttrs.name ?? authorAttrs.username ?? "Unknown"),
    };
  });

  const total =
    json.meta?.pagination?.total ??
    articles.length; // fallback if meta missing

  return { articles, total };
}

// If your “author” options come from a collection called authors:
async function fetchAuthorsForFilter(): Promise<{ id: number; name: string }[]> {
  const qs = new URLSearchParams({
    "pagination[page]": "1",
    "pagination[pageSize]": "100",
    "sort[0]": "name:asc",
  });

  const json = await strapiFetch<StrapiListResponse<AuthorAttrs>>(
    `/api/authors?${qs.toString()}`
  );

  return (json.data ?? [])
    .map((a: any) => {
      const attrs = getAttrs<AuthorAttrs>(a);
      const name = attrs.name ?? attrs.username;
      if (!a?.id || !name) return null;
      return { id: Number(a.id), name: String(name) };
    })
    .filter(Boolean) as { id: number; name: string }[];
}

function processArticle(article: ArticleListItem) {
  return (
    <li key={article.slug} className="list-none">
      <Link
        href={`/blog/${article.slug}`}
        className="group block bg-white hover:shadow-lg border-1 border-gray-300 hover:border-gray-400 rounded-lg p-5 transition-all duration-200"
      >
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded bg-gray-200 border border-gray-300" />

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold capitalize text-lg text-gray-900 mb-0.5">
              {article.title}
            </h3>
            <p className="text-sm text-gray-500">{article.description}</p>
            <p className="text-sm text-gray-500 mt-1">By {article.authorName}</p>
          </div>

          <ArrowRight className="mr-2 h-4 w-4 text-gray-600 group-hover:text-gray-900 transition-colors duration-200" />
        </div>
      </Link>
    </li>
  );
}

interface BlogPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function Page({ searchParams }: BlogPageProps) {
  const { page, userId } = await loadBlogSearchParams(searchParams);

  const [users, articleResult] = await Promise.all([
    fetchAuthorsForFilter(),
    fetchArticles(page, PAGE_SIZE, userId > 0 ? userId : undefined),
  ]);

  const totalPages = Math.max(1, Math.ceil(articleResult.total / PAGE_SIZE));
  if (page > totalPages) notFound();

  return (
    <main>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-6xl font-extrabold tracking-tight mb-4">Blog</h1>
            <p className="text-gray-600 text-lg">Explore posts below</p>
          </div>

          <BlogFilters users={users} currentUserId={userId} />

          <ul className="space-y-3">
            {articleResult.articles.map((a) => processArticle(a))}
          </ul>

          <div className="flex justify-center mt-8">
            <Pagination currentPage={page} totalPages={totalPages} />
          </div>
        </div>
      </div>
    </main>
  );
}