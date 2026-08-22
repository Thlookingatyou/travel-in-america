import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }), {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
  }, { waitUntil() {}, passThroughOnException() {} });
}

test("server-renders the Travel in America atlas", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /Travel in America/i);
  assert.match(html, /50 states/i);
  assert.match(html, /administrative map/i);
  assert.match(html, /Pick your next/i);
  assert.match(html, /og\.png/i);
  assert.match(html, /github\.com\/Thlookingatyou\/travel-in-america/i);
  assert.match(html, /Open the Travel in America GitHub repository/i);
  assert.doesNotMatch(html, /Your site is taking shape|Building your site|codex-preview/i);
});

test("server-renders the American history gallery", async () => {
  const response = await render("/history");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /History happened/i);
  assert.match(html, /Before the republic/i);
  assert.match(html, /Civil rights in action/i);
  assert.match(html, /Stonewall National Monument/i);
  assert.match(html, /24 places/i);
  assert.match(html, /history\/history-cover\.jpg/i);
  assert.match(html, /github\.com\/Thlookingatyou\/travel-in-america/i);
  assert.doesNotMatch(html, /og\.png/i);
});

test("source keeps the atlas records and external links upgradeable", async () => {
  const [data, page, historyData, favorites, svg] = await Promise.all([
    readFile(new URL("../app/data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/history/history-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/favorites.tsx", import.meta.url), "utf8"),
    readFile(new URL("../public/us-states.svg", import.meta.url), "utf8"),
  ]);
  assert.match(data, /stateCatalog/);
  assert.match(data, /Alabama/);
  assert.match(data, /Wyoming/);
  assert.match(page, /wikiUrl/);
  assert.match(page, /youtubeUrl/);
  assert.match(page, /us-cities\.csv/);
  assert.match(page, /Click to know more about the US/);
  assert.match(historyData, /historyChapters/);
  assert.match(historyData, /Cahokia Mounds/);
  assert.match(historyData, /National September 11 Memorial/);
  assert.match(favorites, /travel-in-america:favorites:v1/);
  assert.match(svg, /id="Alabama"/);
  assert.match(svg, /id="Wyoming"/);
  await assert.rejects(access(new URL("../app/_sites-preview/SkeletonPreview.tsx", templateRoot)));
});
