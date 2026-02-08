// lib/content-render.ts
import { documentToHtmlString } from "@contentful/rich-text-html-renderer";
import { BLOCKS } from "@contentful/rich-text-types";
import { toHttps } from "@/lib/contentful";

export function richTextToHtml(doc: any, includes?: any) {
  const assets = includes?.Asset ?? [];

  return documentToHtmlString(doc, {
    renderNode: {
      [BLOCKS.EMBEDDED_ASSET]: (node: any) => {
        const id = node.data?.target?.sys?.id;
        const asset = assets.find((a: any) => a.sys.id === id);
        const url = toHttps(asset?.fields?.file?.url);
        const alt = asset?.fields?.title || "";
        if (!url) return "";
        return `<img src="${url}" alt="${alt}" style="max-width:100%; border-radius:12px;" />`;
      },
    },
  });
}
