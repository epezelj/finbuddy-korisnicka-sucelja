import { strapiFetch } from "./strapi";
import type { ArticleAttributes, StrapiListResponse } from "./strapi-types";

export async function fetchArticleBySlug(slug: string) {
  const qs = new URLSearchParams({
    "filters[slug][$eq]": slug,
    "populate[author]": "true",
    "populate[blocks]": "true",
  });

  const json = await strapiFetch<StrapiListResponse<ArticleAttributes>>(
    `/api/articles?${qs.toString()}`
  );

  const article = json.data[0];
  if (!article) return null;

  return {
    title: article.attributes.title,
    description: article.attributes.description,
    slug: article.attributes.slug,
    blocks: article.attributes.blocks,
    authorName: article.attributes.author.data.attributes.name,
  };
}