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

type MediaAttrs = { url?: string; alternativeText?: string };

type AuthorAttrs = { name?: string; username?: string };
type ArticleAttrs = {
  title?: string;
  description?: string;
  slug?: string;
  blocks?: any[];
  author?: { data?: any } | any;
  cover?: { data?: any } | any; // ✅ add
};

function toMediaUrl(url?: string) {
  if (!url) return "";
  const base = process.env.NEXT_PUBLIC_STRAPI_URL ?? "";
  return url.startsWith("http") ? url : `${base}${url}`;
}

async function fetchArticleBySlug(slug: string) {
  const qs = new URLSearchParams({
    "filters[slug][$eq]": slug,
    "populate[author]": "true",
    "populate[cover]": "true", // ✅ populate cover for detail header too (optional)
    // ✅ IMPORTANT: deep populate blocks so media inside blocks resolves
    "populate[blocks][populate]": "*",
  });

  const json = await strapiFetch<StrapiListResponse<ArticleAttrs>>(
    `/api/articles?${qs.toString()}`
  );

  const a = json.data?.[0];
  if (!a) return null;

  const attrs = getAttrs<ArticleAttrs>(a);

  const authorEntity = attrs.author?.data ?? attrs.author ?? null;
  const authorAttrs = getAttrs<AuthorAttrs>(authorEntity);

  const coverEntity = attrs.cover?.data ?? attrs.cover ?? null;
  const coverAttrs = getAttrs<MediaAttrs>(coverEntity);

  return {
    title: String(attrs.title ?? "Untitled"),
    description: String(attrs.description ?? ""),
    slug: String(attrs.slug ?? slug),
    blocks: attrs.blocks ?? [],
    authorName: String(authorAttrs.name ?? authorAttrs.username ?? "Unknown"),
    coverUrl: String(coverAttrs.url ?? ""),
    coverAlt: String(coverAttrs.alternativeText ?? attrs.title ?? "Cover"),
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

function BlockRenderer({ block }: { block: any }) {
  switch (block.__component) {
    // adjust names to match your components in Strapi
    case "shared.rich-text":
      // commonly: block.body (HTML string)
      return (
        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: block.body ?? "" }}
        />
      );

    case "shared.quote":
      return (
        <blockquote className="border-l-4 pl-4 italic text-gray-700">
          <p>{block.body ?? ""}</p>
          {block.title ? <footer className="mt-2 text-sm">— {block.title}</footer> : null}
        </blockquote>
      );

    case "shared.media": {
      const fileEntity = block.file?.data ?? block.file ?? null;
      const fileAttrs = getAttrs<MediaAttrs>(fileEntity);
      if (!fileAttrs.url) return null;
      return (
        <img
          src={toMediaUrl(fileAttrs.url)}
          alt={fileAttrs.alternativeText ?? ""}
          className="w-full rounded-lg"
        />
      );
    }

    case "shared.slider": {
      const imgs: any[] = block.images?.data ?? block.images ?? [];
      if (!imgs?.length) return null;
      return (
        <div className="grid gap-3">
          {imgs.map((img: any) => {
            const attrs = getAttrs<MediaAttrs>(img);
            if (!attrs.url) return null;
            return (
              <img
                key={img.id ?? attrs.url}
                src={toMediaUrl(attrs.url)}
                alt={attrs.alternativeText ?? ""}
                className="w-full rounded-lg"
              />
            );
          })}
        </div>
      );
    }

    default:
      return null;
  }
}

async function PostContent({ slug }: { slug: string }) {
  const article = await fetchArticleBySlug(slug);
  if (!article) notFound();

  return (
    <article className="max-w-3xl bg-white shadow-lg rounded-lg overflow-hidden">
      {/* optional: cover at top of post page */}
      {article.coverUrl ? (
        <img
          src={toMediaUrl(article.coverUrl)}
          alt={article.coverAlt}
          className="w-full h-72 object-cover"
        />
      ) : null}

      <div className="p-6">
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

        {/* ✅ BLOCKS ONLY ON DETAIL PAGE */}
        <div className="space-y-8">
          {article.blocks.map((block, i) => (
            <BlockRenderer key={block.id ?? i} block={block} />
          ))}
        </div>
      </div>
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
