/**
 * Render the logo SVG by inlining its source (file:// is blocked from about:blank).
 */
import { readFileSync } from "node:fs";
import { chromium } from "playwright";

const SCRATCH =
  "/private/tmp/claude-501/-Users-hannahkatsenelson/bb70d643-6ede-4e13-8e94-40d23647f4d6/scratchpad";
const svg = readFileSync(`${SCRATCH}/rebm-logo.svg`, "utf8");
const scaled = svg.replace('width="458"', 'width="1374"').replace('height="67"', 'height="201"');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1434, height: 522 } });
await page.setContent(`<body style="margin:0">
  <div style="background:#ffffff;padding:30px">${scaled}</div>
  <div style="background:#689ECF;padding:30px">${scaled}</div>
</body>`);
await page.waitForTimeout(400);
await page.screenshot({ path: `${SCRATCH}/logo-render-3x.png`, fullPage: true });
await browser.close();
console.log("wrote logo-render-3x.png");
