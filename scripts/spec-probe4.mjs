import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto("https://realestatebrokermatch.com/", { waitUntil: "networkidle", timeout: 90000 });
await page.evaluate(() => document.fonts.ready);
await page.evaluate(async () => { await new Promise((r)=>{let y=0;const t=setInterval(()=>{scrollTo(0,y);y+=500;if(y>document.body.scrollHeight){clearInterval(t);r();}},30);}); });
await page.waitForTimeout(1500);
const out = await page.evaluate(() => {
  const sec = document.querySelector(".elementor-element-aacd1f4");
  const res = [];
  // find the 3 text columns (elements holding the <p>)
  for (const p of sec.querySelectorAll("p")) {
    const col = p.closest(".elementor-widget") || p.parentElement;
    const c = col.closest("div.e-con-full") || col;
    const cs = getComputedStyle(c);
    const r = c.getBoundingClientRect();
    res.push(`col x=${Math.round(r.left)} w=${Math.round(r.width)} borderRight=${cs.borderRightWidth} ${cs.borderRightStyle} ${cs.borderRightColor} borderLeft=${cs.borderLeftWidth} ${cs.borderLeftColor}`);
  }
  return [...new Set(res)];
});
console.log(out.join("\n"));
await browser.close();
