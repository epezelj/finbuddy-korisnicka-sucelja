import { documentToHtmlString } from "@contentful/rich-text-html-renderer";
import { BLOCKS } from "@contentful/rich-text-types";
import { toHttps } from "@/lib/contentful";

type Includes = {
  Asset?: any[];
  Entry?: any[];
};

export function richTextToHtml(richText: any, includes?: Includes) {
  return documentToHtmlString(richText, {
    renderNode: {
      [BLOCKS.EMBEDDED_ASSET]: (node) => {
        const assetId = node?.data?.target?.sys?.id;
        const asset = includes?.Asset?.find((a: any) => a?.sys?.id === assetId);
        const url = toHttps(asset?.fields?.file?.url);
        if (!url) return "";
        return `<img src="${url}" alt="" style="max-width:100%; height:auto; border-radius:12px;" />`;
      },

      [BLOCKS.EMBEDDED_ENTRY]: (node) => {
        const entryId = node?.data?.target?.sys?.id;
        const entry = includes?.Entry?.find((e: any) => e?.sys?.id === entryId);

        if (!entry) return "";

        const linkedAsset =
          entry?.fields?.image ||
          entry?.fields?.asset ||
          entry?.fields?.media ||
          entry?.fields?.file;

        const assetId = linkedAsset?.sys?.id;
        const asset =
          linkedAsset?.fields ? linkedAsset : includes?.Asset?.find((a: any) => a?.sys?.id === assetId);

        const url = toHttps(asset?.fields?.file?.url);
        const title = asset?.fields?.title || entry?.fields?.title || "";
        const alt = asset?.fields?.description || title || "Image";

        if (!url) return "";

        return `
          <figure style="margin: 16px 0;">
            <img
              src="${url}"
              alt="${escapeHtml(alt)}"
              style="max-width:100%; height:auto; border-radius:12px;"
              loading="lazy"
            />
            ${title ? `<figcaption style="color:#666; font-size:14px; margin-top:8px;">${escapeHtml(title)}</figcaption>` : ""}
          </figure>
        `;
      },
    },
  });
}

function escapeHtml(s: string) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
