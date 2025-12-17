export type StrapiEntity<T> = {
  id: number;
  attributes: T;
};

export type StrapiListResponse<T> = {
  data: StrapiEntity<T>[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
};

export type AuthorAttributes = {
  name: string;
};

export type ArticleAttributes = {
  title: string;
  description: string;
  slug: string;
  blocks: any[]; // rich text blocks
  author: {
    data: StrapiEntity<AuthorAttributes>;
  };
};