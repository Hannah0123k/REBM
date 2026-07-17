import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto("https://realestatebrokermatch.com/", { waitUntil: "networkidle", timeout: 90000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1500);
const out = await page.evaluate(() => {
  const sec = document.querySelector("#process");
  const res = [];
  for (const el of sec.querySelectorAll("*")) {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (cs.backgroundImage !== "none" || el.tagName === "IMG" || el.tagName === "FIGURE" || cs.position === "absolute") {
      res.push(`<${el.tagName.toLowerCase()}${el.className ? "." + el.className.toString().split(/\s+/).slice(0,3).join(".") : ""}> pos=${cs.position} rect[x=${Math.round(r.left)} w=${Math.round(r.width)} h=${Math.round(r.height)}] bgImg=${cs.backgroundImage.slice(0,90)} size=${cs.backgroundSize} posn=${cs.backgroundPosition}`);
    }
  }
  // also the overlay
  for (const cls of [".elementor-background-overlay", ".elementor-background-slideshow"]) {
    const el = sec.querySelector(cls);
    if (el) res.push("OVERLAY " + cls + " " + getComputedStyle(el).backgroundImage);
  }
  return res;
});
console.log(out.join("\n") || "nothing");
await browser.close();
