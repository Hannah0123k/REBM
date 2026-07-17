/**
 * Probe specific selectors for arbitrary computed properties.
 * Usage: node scripts/spec-probe.mjs '<sel1>;;<sel2>' 'prop1,prop2' [url]
 */
import { chromium } from "playwright";

const sels = (process.argv[2] ?? "body").split(";;");
const props = (process.argv[3] ?? "position,top,left,zIndex,height,backgroundColor,backgroundImage").split(",");
const url = process.argv[4] ?? "https://realestatebrokermatch.com/";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(800);

const out = await page.evaluate(
  ({ sels, props }) => {
    const res = [];
    for (const sel of sels) {
      const els = document.querySelectorAll(sel);
      if (!els.length) {
        res.push(`${sel}  → NOT FOUND`);
        continue;
      }
      [...els].slice(0, 6).forEach((el, i) => {
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        res.push(
          `${sel} [${i}] <${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}>` +
            `\n   rect: y=${Math.round(r.top + scrollY)} x=${Math.round(r.left)} w=${Math.round(r.width * 10) / 10} h=${Math.round(r.height * 10) / 10}` +
            props.map((p) => `\n   ${p}: ${cs[p]}`).join(""),
        );
      });
    }
    return res.join("\n");
  },
  { sels, props },
);
console.log(out);
await browser.close();
