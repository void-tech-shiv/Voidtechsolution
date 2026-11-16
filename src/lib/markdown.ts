/**
 * VOIDTECH SOLUTION — GFM Markdown & Sanitization Utility
 * 
 * Implements Decision 6: GFM Markdown & Strict HTML Sanitization Pipeline.
 * 
 * Processing Chain:
 * Raw GFM -> remark-parse -> remark-gfm -> remark-rehype (allowDangerousHtml: false)
 * -> rehype-sanitize (strict schema) -> rehype-external-links (noopener, noreferrer)
 * -> rehype-stringify
 * 
 * Guarantees:
 * 1. Disallows <script>, <iframe>, <object>, <embed>, <form>, inline event handlers (onerror, onload).
 * 2. Parses GFM tables, strikethrough, autolinks, tasklists.
 * 3. Enforces target="_blank" and rel="noopener noreferrer" on external hyperlinks.
 */

export interface RenderMarkdownOptions {
  allowDangerousHtml?: boolean;
}

let pipelinePromise: Promise<{ process: (content: string) => Promise<{ toString: () => string }> }> | null = null;


async function getMarkdownProcessor() {
  if (!pipelinePromise) {
    pipelinePromise = (async () => {
      const { unified } = await import("unified");
      const remarkParse = (await import("remark-parse")).default;
      const remarkGfm = (await import("remark-gfm")).default;
      const remarkRehype = (await import("remark-rehype")).default;
      const rehypeSanitize = (await import("rehype-sanitize")).default;
      const rehypeExternalLinks = (await import("rehype-external-links")).default;
      const rehypeStringify = (await import("rehype-stringify")).default;

      return unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkRehype, { allowDangerousHtml: false })
        .use(rehypeSanitize)
        .use(rehypeExternalLinks, {
          target: "_blank",
          rel: ["noopener", "noreferrer"],
        })
        .use(rehypeStringify);
    })();
  }
  return pipelinePromise;
}

/**
 * Parses and sanitizes a GFM markdown string into safe HTML.
 */
export async function renderMarkdownToHtml(markdown: string): Promise<string> {
  if (!markdown || typeof markdown !== "string") {
    return "";
  }

  const processor = await getMarkdownProcessor();
  const result = await processor.process(markdown);
  return String(result).trim();
}
