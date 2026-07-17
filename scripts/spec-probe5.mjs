import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto("https://realestatebrokermatch.com/", { waitUntil: "networkidle", timeout: 90000 });
await page.evaluate(() => document.fonts.ready);
await page.evaluate(async () => { await new Promise((r)=>{let y=0;const t=setInterval(()=>{scrollTo(0,y);y+=500;if(y>document.body.scrollHeight){clearInterval(t);r();}},30);}); });
await page.waitForTimeout(1500);
const out = await page.evaluate(() => {
  const res = {};
  // Show More button real styling
  const sm = [...document.querySelectorAll("a")].find(a => /show more/i.test(a.textContent));
  if (sm) { const cs = getComputedStyle(sm); res.showMore = {bg: cs.backgroundColor, border: `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`, radius: cs.borderRadius, pad: cs.padding, w: Math.round(sm.getBoundingClientRect().width)}; }
  // open a details, find answer element + font
  const det = document.querySelector("#faq details");
  det.open = true;
  const kids = [...det.children].filter(c => c.tagName !== "SUMMARY");
  res.answerContainer = kids.map(k => k.className.toString().slice(0,50) + " tag=" + k.tagName);
  // find a <p> inside answer
  const p = det.querySelector("summary ~ * p, summary ~ p") || kids[0]?.querySelector("p") || kids[0];
  if (p) { const cs = getComputedStyle(p); res.answerFont = {family: cs.fontFamily.split(",")[0], size: cs.fontSize, lh: cs.lineHeight, weight: cs.fontWeight, color: cs.color}; }
  // icon position: is plus icon left or right of text?
  const sum = det.querySelector("summary");
  const icon = sum.querySelector("i");
  const qdiv = sum.querySelector("div");
  res.iconVsText = icon && qdiv ? {iconX: Math.round(icon.getBoundingClientRect().left), textX: Math.round(qdiv.getBoundingClientRect().left)} : null;
  res.summaryGap = getComputedStyle(sum).columnGap;
  // gap between items
  const dets = document.querySelectorAll("#faq details");
  if (dets.length>1) res.itemGap = Math.round(dets[1].getBoundingClientRect().top - dets[0].getBoundingClientRect().bottom);
  return res;
});
console.log(JSON.stringify(out, null, 2));
await browser.close();
