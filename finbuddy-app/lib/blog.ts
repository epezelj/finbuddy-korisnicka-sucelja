import { strapiFetch } from "./strapi";
import type {
  ArticleAttributes,
  AuthorAttributes,
  StrapiListResponse,
  StrapiEntity,
} from "./strapi-types";

export async function fetchArticles(page: number, pageSize: number, authorId?: number) {
  const qs = new URLSearchParams({
    "pagination[page]": String(page),
    "pagination[pageSize]": String(pageSize),
    "sort[0]": "publishedAt:desc",
    "populate[author]": "true",
  });

  if (authorId && authorId > 0) {
    qs.set("filters[author][id][$eq]", String(authorId));
  }

  const json = await strapiFetch<StrapiListResponse<ArticleAttributes>>(
    `/api/articles?${qs.toString()}`
  );

  return {
    articles: json.data.map((a) => ({
      id: a.id,
      title: a.attributes.title,
      description: a.attributes.description,
      slug: a.attributes.slug,
      authorId: a.attributes.author.data.id,
      authorName: a.attributes.author.data.attributes.name,
    })),
    total: json.meta.pagination.total,
  };
}