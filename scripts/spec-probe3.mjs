import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto("https://realestatebrokermatch.com/", { waitUntil: "networkidle", timeout: 90000 });
await page.evaluate(() => document.fonts.ready);
await page.evaluate(async () => { await new Promise((r)=>{let y=0;const t=setInterval(()=>{scrollTo(0,y);y+=500;if(y>document.body.scrollHeight){clearInterval(t);r();}},30);}); });
await page.waitForTimeout(2000);
const out = await page.evaluate(() => {
  const res = [];
  for (const sel of ["#process", "#about", "#property", ".elementor-element-323dc4e", "#testamonial", ".elementor-element-aacd1f4"]) {
    const el = document.querySelector(sel);
    if (!el) continue;
    const cs = getComputedStyle(el);
    res.push(`${sel}: bgColor=${cs.backgroundColor} bgImg=${cs.backgroundImage.slice(0,120)} size=${cs.backgroundSize} pos=${cs.backgroundPosition} repeat=${cs.backgroundRepeat}`);
  }
  return res;
});
console.log(out.join("\n"));
await browser.close();
