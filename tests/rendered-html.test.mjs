import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import { geoBounds } from "d3-geo";

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
  const [data, page, links, historyData, favorites, svg] = await Promise.all([
    readFile(new URL("../app/data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/links.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/history/history-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/favorites.tsx", import.meta.url), "utf8"),
    readFile(new URL("../public/us-states.svg", import.meta.url), "utf8"),
  ]);
  assert.match(data, /stateCatalog/);
  assert.match(data, /Alabama/);
  assert.match(data, /Wyoming/);
  assert.match(page, /wikiUrl/);
  assert.match(page, /youtubeUrl/);
  assert.doesNotMatch(page, /href=\{wikiUrl\(city\.name\)\}/);
  assert.match(links, /Georgia \(U\.S\. state\)/);
  assert.match(links, /Washington \(state\)/);
  assert.match(links, /cityWikiUrl/);
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

test("all 50 states have ten featured cities and coordinate data", async () => {
  const [data, csv] = await Promise.all([
    readFile(new URL("../app/data.ts", import.meta.url), "utf8"),
    readFile(new URL("../public/us-cities.csv", import.meta.url), "utf8"),
  ]);
  const stateRows = [...data.matchAll(/\["([^"]+)","([A-Z]{2})","([^"]+)","(?:Northeast|Midwest|South|West)"\]/g)];
  assert.equal(stateRows.length, 50);
  const cityLists = [...data.matchAll(/([A-Z]{2}):\[(.*?)\]/g)];
  assert.equal(cityLists.length, 50);
  for (const [, , cities] of cityLists) assert.equal(cities.split(",").length, 10);
  assert.match(csv, /STATE_CODE,STATE_NAME,CITY,COUNTY,LATITUDE,LONGITUDE/);
  assert.match(csv, /Los Angeles/);
  assert.match(csv, /-118\.247/);
});

test("featured city coordinates stay within their own state extents", async () => {
  const [{ stateCatalog }, geoJson, csv, overridesCsv] = await Promise.all([
    import("../app/data.ts"),
    readFile(new URL("../public/us-states.geojson", import.meta.url), "utf8"),
    readFile(new URL("../public/us-cities.csv", import.meta.url), "utf8"),
    readFile(new URL("../public/us-city-overrides.csv", import.meta.url), "utf8"),
  ]);
  const parseLine = (line) => {
    const columns = [];
    let field = "";
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const character = line[index];
      if (character === '"') quoted = !quoted;
      else if (character === "," && !quoted) { columns.push(field); field = ""; }
      else field += character;
    }
    columns.push(field);
    return columns;
  };
  const normalize = (value) => value.toLowerCase().replace(/\bcity\b/g, "").replace(/[^a-z0-9]/g, "");
  const rows = `${csv.trim()}\n${overridesCsv.trim().split(/\r?\n/).slice(1).join("\n")}`.split(/\r?\n/).slice(1).map((line) => {
    const columns = parseLine(line);
    return { abbr: columns[1], city: columns[3], lat: Number(columns[5]), lon: Number(columns[6]) };
  });
  const geo = JSON.parse(geoJson);
  const invalid = [];
  for (const state of stateCatalog) {
    const feature = geo.features.find((candidate) => candidate.properties?.name === state.name);
    const [[minLon, minLat], [maxLon, maxLat]] = geoBounds(feature);
    for (const city of [state.capital, ...state.cities.map(({ name }) => name)]) {
      const row = rows.find((candidate) => candidate.abbr === state.abbr && normalize(candidate.city) === normalize(city));
      assert.ok(row, `Missing coordinates for ${city}, ${state.name}`);
      if (row.lon < minLon || row.lon > maxLon || row.lat < minLat || row.lat > maxLat) invalid.push(`${city}, ${state.name}`);
    }
  }
  assert.deepEqual(invalid, []);
});

