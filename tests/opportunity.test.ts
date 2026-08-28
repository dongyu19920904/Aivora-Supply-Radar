import { describe, expect, it } from "vitest";
import { parseOpportunityMarkdown, shanghaiDate } from "../src/ingest/opportunity";

describe("account opportunity import", () => {
  it("parses the published Markdown contract", () => {
    const body = `## 今日判断\n\n${"这是经过质量校验的账号商机正文。".repeat(10)}`;
    const document = parseOpportunityMarkdown(
      `---\ntitle: "AI 账号商机日报"\ndate: 2026-08-27T08:00:00+08:00\ndescription: "经营判断"\n---\n${body}`,
      "https://news.aivora.cn/account-opportunity/2026-08/2026-08-27/",
    );
    expect(document.reportDate).toBe("2026-08-27");
    expect(document.title).toBe("AI 账号商机日报");
    expect(document.description).toBe("经营判断");
    expect(document.bodyMarkdown).toContain("今日判断");
  });

  it("rejects missing frontmatter and thin content", () => {
    expect(() => parseOpportunityMarkdown("plain text", "https://example.com")).toThrow(
      "opportunity_frontmatter_missing",
    );
    expect(() =>
      parseOpportunityMarkdown("---\ndate: 2026-08-27\n---\n太短", "https://example.com"),
    ).toThrow("opportunity_body_too_short");
  });

  it("uses Asia/Shanghai around UTC date boundaries", () => {
    expect(shanghaiDate(0, new Date("2026-08-28T16:30:00Z"))).toBe("2026-08-29");
    expect(shanghaiDate(-1, new Date("2026-08-28T16:30:00Z"))).toBe("2026-08-28");
  });
});
