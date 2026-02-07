// lib/richtext-simple.ts
type Includes = {
  Asset?: Array<{ sys: { id: string }; fields?: any }>;
  Entry?: Array<{ sys: { id: string }; fields?: any }>;
};

const esc = (s: string) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const toHttps = (u?: string) => (u?.startsWith("//") ? `https:${u}` : u);

function buildMaps(includes?: Includes) {
  const assets = new Map<string, any>();
  const entries = new Map<string, any>();
  for (const a of includes?.Asset ?? []) assets.set(a.sys.id, a);
  for (const e of includes?.Entry ?? []) entries.set(e.sys.id, e);
  return { assets, entries };
}

function render(node: any, maps: { assets: Map<string, any>; entries: Map<string, any> }): string {
  if (!node) return "";

  if (node.nodeType === "text") return esc(node.value ?? "");

  const kids = (node.content ?? []).map((c: any) => render(c, maps)).join("");

  switch (node.nodeType) {
    case "document":
      return kids;

    case "paragraph":
      return `<p>${kids}</p>`;

    case "heading-1":
      return `<h1>${kids}</h1>`;
    case "heading-2":
      return `<h2>${kids}</h2>`;
    case "heading-3":
      return `<h3>${kids}</h3>`;

    case "unordered-list":
      return `<ul>${kids}</ul>`;
    case "ordered-list":
      return `<ol>${kids}</ol>`;
    case "list-item":
      return `<li>${kids}</li>`;

    case "hyperlink": {
      const href = esc(node.data?.uri ?? "#");
      return `<a href="${href}" target="_blank" rel="noreferrer">${kids}</a>`;
    }

    case "embedded-asset-block": {
      const id = node.data?.target?.sys?.id;
      const asset = id ? maps.assets.get(id) : null;
      const url = toHttps(asset?.fields?.file?.url);
      const title = asset?.fields?.title ? esc(asset.fields.title) : "";
      if (!url) return "";
      return `
        <figure>
          <img src="${esc(url)}" alt="${title}" style="max-width:100%;border-radius:12px" />
          ${title ? `<figcaption style="color:#666;font-size:14px">${title}</figcaption>` : ""}
        </figure>
      `;
    }

    case "embedded-entry-block": {
      // Show embedded component “as is”
      const id = node.data?.target?.sys?.id;
      const entry = id ? maps.entries.get(id) : null;
      if (!entry) return "";
      return `
        <pre style="background:#f6f6f6;padding:12px;border-radius:12px;overflow:auto">
${esc(JSON.stringify(entry.fields ?? {}, null, 2))}
        </pre>
      `;
    }

    default:
      return kids;
  }
}

export function richTextToHtml(doc: any, includes?: Includes) {
  const maps = buildMaps(includes);
  return render(doc, maps);
}
