import { chromium } from "playwright";
const SCRATCH = "/private/tmp/claude-501/-Users-hannahkatsenelson/bb70d643-6ede-4e13-8e94-40d23647f4d6/scratchpad";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto("https://realestatebrokermatch.com/", { waitUntil: "networkidle", timeout: 90000 });
await page.evaluate(() => document.fonts.ready);
await page.evaluate(async () => {
  for (const img of document.querySelectorAll("img")) img.loading = "eager";
  await new Promise((r) => { let y = 0; const t = setInterval(() => { scrollTo(0, y); y += 600; if (y > document.body.scrollHeight) { clearInterval(t); r(); } }, 30); });
  await Promise.all([...document.querySelectorAll("img")].map((i) => (i.complete ? 0 : i.decode().catch(() => {}))));
});
await page.waitForTimeout(2500);
await page.screenshot({ path: `${SCRATCH}/full-page.png`, fullPage: true });
await browser.close();
console.log("wrote full-page.png");
