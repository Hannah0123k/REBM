import { chromium } from "playwright";
const SCRATCH = "/private/tmp/claude-501/-Users-hannahkatsenelson/bb70d643-6ede-4e13-8e94-40d23647f4d6/scratchpad";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto("https://realestatebrokermatch.com/", { waitUntil: "networkidle", timeout: 90000 });
await page.evaluate(() => document.fonts.ready);
await page.evaluate(async () => { await new Promise((r)=>{let y=0;const t=setInterval(()=>{scrollTo(0,y);y+=500;if(y>document.body.scrollHeight){clearInterval(t);r();}},30);}); });
await page.waitForTimeout(1500);

// click the "Show More" button if present so all questions are in the DOM
const before = await page.evaluate(() => document.querySelectorAll("#faq details").length);
const clicked = await page.evaluate(() => {
  const btn = [...document.querySelectorAll("a,button,span,div")].find((e) => /show more/i.test(e.textContent) && e.getBoundingClientRect().height > 0 && e.getBoundingClientRect().height < 80);
  if (btn) { btn.click(); return btn.outerHTML.slice(0, 120); }
  return null;
});
await page.waitForTimeout(1200);

// open state: open the first details and capture computed style of summary + icon
const openState = await page.evaluate(() => {
  const d = document.querySelector("#faq details");
  d.open = true;
  const sum = d.querySelector("summary");
  const icon = d.querySelector("i");
  const csS = getComputedStyle(sum);
  const answer = d.querySelector("summary + *, .e-n-accordion-item-content, [class*=content]");
  return {
    summaryBg: csS.backgroundColor,
    summaryRadius: csS.borderRadius,
    iconClass: icon ? icon.className : null,
    iconAfter: icon ? getComputedStyle(icon, "::before").content : null,
    detailsCount: document.querySelectorAll("#faq details").length,
  };
});

const items = await page.evaluate(() => {
  return [...document.querySelectorAll("#faq details")].map((d) => {
    const q = d.querySelector("summary div, summary span div, summary")?.textContent.trim().replace(/\s+/g, " ") || "";
    // answer = everything in details except the summary
    const clone = d.cloneNode(true);
    clone.querySelector("summary")?.remove();
    const a = clone.textContent.trim().replace(/\s+/g, " ");
    return { q, a };
  });
});

console.log("details before Show More:", before, "| after:", openState.detailsCount);
console.log("Show More clicked:", clicked);
console.log("OPEN STATE:", JSON.stringify(openState, null, 2));
console.log("\n=== FAQ ITEMS (" + items.length + ") ===");
items.forEach((it, i) => console.log(`\nQ${i + 1}: ${it.q}\nA${i + 1}: ${it.a}`));
await browser.close();
