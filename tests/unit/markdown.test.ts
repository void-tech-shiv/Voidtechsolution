import { describe, it, expect } from "vitest";
import { renderMarkdownToHtml } from "@/lib/markdown";

describe("Task 10.1.11: GFM Markdown Parser & Strict Sanitization", () => {
  it("renders GFM tables into valid HTML table tags", async () => {
    const markdown = `
| Deliverable | Timeline | Status |
| :--- | :---: | ---: |
| MVP Backend | 2 Weeks | Ready |
| Production Release | 4 Weeks | Scheduled |
    `.trim();

    const html = await renderMarkdownToHtml(markdown);

    expect(html).toContain("<table>");
    expect(html).toContain("<thead>");
    expect(html).toContain("<tbody>");
    expect(html).toContain("Deliverable");
    expect(html).toContain("MVP Backend");
    expect(html).toContain("2 Weeks");

  });

  it("renders standard formatting and strikethrough", async () => {
    const markdown = "This is **bold**, *italic*, and ~~deprecated~~ code `next dev`.";
    const html = await renderMarkdownToHtml(markdown);

    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>italic</em>");
    expect(html).toContain("<del>deprecated</del>");
    expect(html).toContain("<code>next dev</code>");
  });

  it("applies target='_blank' and rel='noopener noreferrer' to external hyperlinks", async () => {
    const markdown = "Visit [VOIDTECH SOLUTION](https://voidtechsolution.codedev.co.in) for details.";
    const html = await renderMarkdownToHtml(markdown);

    expect(html).toContain('href="https://voidtechsolution.codedev.co.in"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("sanitizes malicious script tags and inline event handlers (XSS protection)", async () => {
    const malicious = `
# Engineering Report
<script>alert('pwned')</script>
<img src="https://example.com/pic.jpg" onerror="alert('xss')" />
<iframe src="javascript:alert(1)"></iframe>
<a href="javascript:alert('steal_cookie')">Click here</a>
    `.trim();

    const html = await renderMarkdownToHtml(malicious);

    expect(html).not.toContain("<script");
    expect(html).not.toContain("alert('pwned')");
    expect(html).not.toContain("onerror");
    expect(html).not.toContain("<iframe");
    expect(html).not.toContain("javascript:");
  });

  it("handles empty or falsy inputs gracefully without throwing", async () => {
    expect(await renderMarkdownToHtml("")).toBe("");
    expect(await renderMarkdownToHtml(null as any)).toBe("");
    expect(await renderMarkdownToHtml(undefined as any)).toBe("");
  });
});
