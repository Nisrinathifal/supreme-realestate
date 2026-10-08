/**
 * The contact form and its route (DESIGN §9.11, PRD §9.2): every field's error state, the order of judging, the
 * success and failure outcomes, the honeypot, server-side validation, the rate limit, and the post without
 * JavaScript. Runs against the production server with MAIL_PROVIDER=mock (playwright.config.ts).
 */
import { test, expect } from "@playwright/test";

const invalid = (page: import("@playwright/test").Page) =>
  page.evaluate(() => [...document.querySelectorAll("[aria-invalid='true']")].map((el) => `${el.getAttribute("name")}: ${document.getElementById(el.getAttribute("aria-describedby") ?? "")?.textContent ?? "(no message)"}`));

test.describe("contact form", () => {
  test("every required field has a specific error, focus goes to the first, errors clear as fields are put right", async ({ page }) => {
    await page.goto("/en/contact?onderwerp=pers");
    await expect(page.locator('select[name="subject"]')).toHaveValue("pers"); // ?onderwerp= pre-selects
    await page.locator('button[type="submit"]').click();
    expect(await invalid(page)).toEqual([
      "name: This field is required.",
      "email: This field is required.",
      "message: This field is required.",
      "consent: Agree to the privacy policy to send the message.",
    ]);
    await expect(page.locator('input[name="name"]')).toBeFocused();
    // every error is linked to its field and announced
    for (const el of await page.locator("[aria-invalid='true']").all()) {
      const id = await el.getAttribute("aria-describedby");
      await expect(page.locator(`#${id}`)).toHaveAttribute("role", "alert");
    }
    // a bad address is judged when the field is left
    await page.fill('input[name="email"]', "not-an-address");
    await page.locator('input[name="name"]').focus();
    expect(await invalid(page)).toContain("email: Enter a valid email address.");
    // and cleared the moment it is put right
    await page.fill('input[name="email"]', "test@example.com");
    expect(await invalid(page)).not.toContain("email: Enter a valid email address.");
    await page.fill('input[name="name"]', "Test Person");
    expect(await invalid(page)).toEqual(["message: This field is required.", "consent: Agree to the privacy policy to send the message."]);
  });

  test("a valid message is sent and the success reads inline; the form resets", async ({ page }) => {
    await page.goto("/en/contact");
    await page.fill('input[name="name"]', "Test Person");
    await page.fill('input[name="email"]', "test@example.com");
    await page.selectOption('select[name="subject"]', "overig");
    await page.fill('textarea[name="message"]', "A test message from the suite.");
    await page.locator('input[name="consent"]').check();
    const [res] = await Promise.all([page.waitForResponse((r) => r.url().includes("/api/contact")), page.locator('button[type="submit"]').click()]);
    expect(res.status()).toBe(200);
    await expect(page.locator('[role="status"]')).toHaveText("Thank you. We will contact you personally.");
    await expect(page.locator('input[name="name"]')).toHaveValue("");
    expect(await invalid(page)).toEqual([]);
  });

  test("the route: honeypot, server-side validation, rate limit, no-JS redirect in the form's language", async ({ request }) => {
    const post = (body: Record<string, unknown>, ip: string) => request.post("/api/contact", { data: body, headers: { "x-forwarded-for": ip } });
    const bot = await post({ name: "x", email: "x@y.zz", subject: "pers", message: "m", consent: true, website: "http://spam" }, "203.0.113.1");
    expect(bot.status()).toBe(200); // a bot is told nothing
    const bad = await post({ name: "", email: "nope", subject: "zzz", message: "", consent: false }, "203.0.113.2");
    expect(bad.status()).toBe(400);
    expect((await bad.json()).errors).toEqual({ name: "required", email: "email", subject: "required", message: "required", consent: "consent" });
    const codes: number[] = [];
    for (let i = 0; i < 7; i++) codes.push((await post({ name: "x", email: "x@y.zz", subject: "overig", message: "m", consent: true }, "203.0.113.3")).status());
    expect(codes).toEqual([200, 200, 200, 200, 200, 429, 429]);
    for (const [lang, path] of [["en", "/en/contact"], ["nl", "/contact"]] as const) {
      const r = await request.post("/api/contact", { form: { lang, name: "", email: "nope", subject: "pers", message: "", consent: "on" }, headers: { "x-forwarded-for": `203.0.113.${lang === "en" ? 4 : 5}` }, maxRedirects: 0 });
      expect(r.status()).toBe(303);
      expect(r.headers().location).toContain(`${path}?error=invalid`);
    }
  });
});

test.describe("no slop (owner's list, 2026-10-08)", () => {
  for (const path of ["/", "/en/contact", "/en/privacy"]) {
    test(`${path}: no aside, no card in a card, only soft shadows, no glowing borders`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const r = await page.evaluate(() => {
        const asides = document.querySelectorAll("aside").length;
        const nested = [...document.querySelectorAll('[class*="card"] [class*="card"]')].filter((el) => !/cardMedia|cardFoot|cardText|cardName|cardMeta|cardArrow|cardButton/.test(el.className)).length;
        const hard: string[] = [], glow: string[] = [];
        for (const el of document.querySelectorAll("body *")) {
          const s = getComputedStyle(el).boxShadow;
          if (!s || s === "none") continue;
          // every outer shadow is soft: blurred (≥ 16px) and translucent; an inset 1px line is a hairline, not a shadow
          for (const part of s.split(/,(?![^(]*\))/)) {
            const p = part.trim();
            if (p.includes("inset") || /\)\s+0px 0px 0px 1px$/.test(p)) continue; // the computed value puts "inset" last
            const m = p.match(/^(rgba?\([^)]*\))\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+(-?[\d.]+)px/);
            if (!m) continue;
            const alpha = m[1].startsWith("rgba") ? Number(m[1].split(",")[3]) : 1;
            if (Number(m[4]) < 16 || alpha > 0.75) hard.push(`${el.tagName}.${el.className}: ${p}`);
            if (Number(m[2]) === 0 && Number(m[3]) === 0 && Number(m[4]) > 0) glow.push(`${el.tagName}.${el.className}: ${p}`);
          }
        }
        return { asides, nested, hard, glow };
      });
      expect(r.asides).toBe(0);
      expect(r.nested).toBe(0);
      expect(r.hard).toEqual([]);
      expect(r.glow).toEqual([]);
    });
  }
});
