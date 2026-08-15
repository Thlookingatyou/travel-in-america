# Travel in America

Travel in America is an interactive atlas for exploring the United States one state at a time.

The site begins with a geographic administrative map of all 50 states. Select a state to zoom into its boundary, discover its capital and ten largest city records, and jump directly to Wikipedia or YouTube for background, travel inspiration, and trip research.

## What the site does

- Shows all 50 states on an interactive administrative map.
- Lets visitors select states by clicking their boundaries or using the accessible state index.
- Opens a focused state view with the state boundary highlighted.
- Marks the state capital with a red star.
- Marks the ten featured largest cities with blue circles.
- Links each state, city, and capital to Wikipedia.
- Creates targeted YouTube travel searches for states, cities, and capitals.
- Keeps the atlas content in editable local data files instead of scattering links throughout the interface.

## Project structure

- [app/page.tsx](app/page.tsx) contains the interactive experience, map behavior, marker placement, and link helpers.
- [app/data.ts](app/data.ts) contains the 50 states, capitals, regions, and featured city records.
- [public/us-states.svg](public/us-states.svg) contains the state boundary map used by the interface.
- [public/us-cities.csv](public/us-cities.csv) supplies city coordinates for the detail maps.
- [tests/rendered-html.test.mjs](tests/rendered-html.test.mjs) verifies server rendering and the atlas data/link structure.

## Updating the content

To change a state, capital, or city record, edit [app/data.ts](app/data.ts). Each state record contains:

- the state name and abbreviation;
- its capital;
- its broad U.S. region;
- ten featured cities, ordered by the current atlas data.

Wikipedia and YouTube URLs are generated centrally in [app/page.tsx](app/page.tsx), so changing the link format only requires editing the wikiUrl or youtubeUrl helper.

City coordinates are matched from [public/us-cities.csv](public/us-cities.csv). If a city is renamed in [app/data.ts](app/data.ts), update the corresponding city name in the coordinate dataset or its marker will not appear on the detail map.

## Data and map sources

The state boundary asset is a CC0 map based on U.S. Census boundary data. The city coordinate file is a public U.S. city gazetteer. Both assets are stored locally so the interactive map does not depend on a third-party API at runtime.

The city ordering currently follows the atlas's 2020 city-proper population records. Refresh the city arrays in [app/data.ts](app/data.ts) when adopting a newer population source.

## Run locally

Prerequisite: Node.js 22.13 or newer.

~~~bash
pnpm install
pnpm run dev
~~~

Open the local URL printed by the development server.

## Verify the project

~~~bash
pnpm run build
node --test tests/rendered-html.test.mjs
~~~

The project is designed for a Cloudflare-compatible Vinext/Sites deployment. GitHub stores the source code; deployment is handled separately by the selected hosting provider.

