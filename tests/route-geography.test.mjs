import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { geoAlbersUsa, geoContains } from "d3-geo";
import { salParadiseRoute } from "../app/route-data.ts";

const stateNames = {
  NY: "New York", NJ: "New Jersey", IL: "Illinois", IA: "Iowa",
  NE: "Nebraska", WY: "Wyoming", CO: "Colorado", UT: "Utah",
  NV: "Nevada", CA: "California",
};

test("every literary-route marker projects onto its named state", async () => {
  const geo = JSON.parse(await readFile(new URL("../public/us-states.geojson", import.meta.url), "utf8"));
  const projection = geoAlbersUsa().fitSize([959, 593], geo);
  assert.equal(salParadiseRoute.length, 20);

  for (const stop of salParadiseRoute) {
    const feature = geo.features.find(({ properties }) => properties.name === stateNames[stop.state]);
    assert.ok(feature, `${stop.city}: missing state boundary`);
    assert.ok(geoContains(feature, stop.coordinates), `${stop.city}: point is outside ${stop.state}`);
    const position = projection(stop.coordinates);
    assert.ok(position && position[0] >= 0 && position[0] <= 959 && position[1] >= 0 && position[1] <= 593,
      `${stop.city}: point is outside the map viewport`);
  }
});

test("previously misplaced stops use the verified landmark coordinates", () => {
  const find = (city) => salParadiseRoute.find((stop) => stop.city === city)?.coordinates;
  // USGS GNIS primary populated-place points, rounded to six decimals.
  assert.deepEqual(find("Chicago"), [-87.650058, 41.850041]);
  assert.deepEqual(find("Denver"), [-104.984714, 39.73916]);
  assert.deepEqual(find("San Francisco"), [-122.419458, 37.775005]);
  assert.deepEqual(find("Los Angeles"), [-118.243697, 34.052239]);
  assert.deepEqual(find("Bakersfield"), [-119.018725, 35.373297]);
  assert.deepEqual(find("Bear Mountain Bridge"), [-73.98028, 41.32]);
  assert.deepEqual(salParadiseRoute[11].coordinates, salParadiseRoute[13].coordinates,
    "both visits to Denver must display at the same place");
});
