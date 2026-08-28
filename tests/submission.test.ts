import { describe, expect, it } from "vitest";
import { submissionFromBody } from "../src/index";

describe("public submissions", () => {
  it("accepts a bounded merchant submission", () => {
    expect(
      submissionFromBody({
        kind: "merchant",
        name: "公开货源商",
        contact: "contact@example.com",
        sourceUrl: "https://merchant.example/catalog",
        content: "这是公开可核验的货源说明，包含交付方式、售后方式和报价更新频率。",
      }),
    ).toMatchObject({ kind: "merchant", name: "公开货源商" });
  });

  it("rejects unsafe URLs, invalid kinds and thin content", () => {
    expect(() =>
      submissionFromBody({
        kind: "merchant",
        name: "货源商",
        sourceUrl: "https://127.0.0.1/catalog",
        content: "这是足够长度但链接不安全的公开货源说明内容。",
      }),
    ).toThrow("invalid_submission_url");
    expect(() =>
      submissionFromBody({
        kind: "unknown",
        name: "货源商",
        content: "这是足够长度的公开货源说明内容。",
      }),
    ).toThrow("invalid_submission_kind");
    expect(() => submissionFromBody({ kind: "offer", name: "报价", content: "太短" })).toThrow(
      "invalid_submission_content",
    );
  });
});
