# Travel in America

Travel in America is an interactive atlas for curious travelers who want to explore the United States through geography, cities, literature, and the historic places where the country changed.

The homepage centers on a clickable administrative map of all 50 states. Selecting a state opens a focused boundary map with its capital and ten featured cities in their geographic positions. Visitors can also trace Sal Paradise’s first trip west from *On the Road*, ask the atlas to choose a famous city at random, save places for later, or enter a scrollable American-history gallery.

## Main experiences

- Click any state directly on the national map and open its isolated state map.
- See the state capital as a red star and ten featured cities as blue markers.
- Open centrally generated Wikipedia and YouTube travel links.
- Display Sal Paradise’s first westbound route directly on the map.
- Randomly choose from 47 well-known American cities and mark the result on the map.
- Save states, cities, and historic places in a device-local favorites drawer.
- Visit **These places are very “American”**, an eight-chapter gallery of 24 visitable historical places.
- Follow American history from Cahokia and the Revolution through expansion, the Civil War, civil rights, counterculture, hip-hop, and modern remembrance.

## Project structure

- [app/page.tsx](app/page.tsx) contains the main atlas, state exploration, literary route, random chooser, and history cover.
- [app/data.ts](app/data.ts) contains the 50 states, capitals, regions, and featured cities.
- [app/links.ts](app/links.ts) is the single link registry for state/city Wikipedia titles and YouTube searches.
- [app/history/history-data.ts](app/history/history-data.ts) contains every history chapter and place shown in the gallery.
- [app/history/HistoryPageClient.tsx](app/history/HistoryPageClient.tsx) renders the scrollable history experience.
- [app/favorites.tsx](app/favorites.tsx) manages the reusable favorites drawer and device-local storage.
- [public/history](public/history) contains the gallery’s locally stored historical images.
- [public/us-states.geojson](public/us-states.geojson) provides the state boundaries.
- [public/us-cities.csv](public/us-cities.csv) and [public/us-city-overrides.csv](public/us-city-overrides.csv) provide city coordinates.
- [tests/rendered-html.test.mjs](tests/rendered-html.test.mjs) verifies both routes, social metadata, and the upgradeable data structure.

## Updating atlas content

Edit [app/data.ts](app/data.ts) to change a state, capital, region, or featured city. Wikipedia and YouTube URLs are generated centrally in [app/links.ts](app/links.ts), so link-format changes stay in one place. State-specific titles are used for ambiguous articles such as Georgia, Washington, and New York, and city links include their state when needed.

City names must match the coordinate records in [public/us-cities.csv](public/us-cities.csv) or [public/us-city-overrides.csv](public/us-city-overrides.csv). Coordinates are projected through the same geographic projection as the relevant map.

The random-city collection is the `famousDestinationSeeds` list in [app/page.tsx](app/page.tsx).

## Updating the history gallery

All history content lives in [app/history/history-data.ts](app/history/history-data.ts). Each chapter has a title, date range, introduction, and a list of places. Each place contains:

- the event and year;
- a visitable site and location;
- a short historical introduction;
- a local image path and accessible description;
- an image-source link;
- a history link and map-search query.

Add an image to [public/history](public/history), add one place record to the appropriate chapter, and the gallery will render it automatically. The page calculates its displayed place and chapter totals from the data.

## Favorites

Favorites are intentionally private to the visitor’s current browser and device. They are stored under `travel-in-america:favorites:v1` in local storage; no account or server database is required.

## Sources

State boundaries derive from public U.S. geographic data, while the city coordinate files are stored locally to avoid a runtime mapping dependency. History explanations link to the National Park Service, National Archives, UNESCO, Smithsonian, and relevant site organizations. Historical images are stored locally and retain source links beside their gallery entries; many are public-domain or openly licensed Wikimedia Commons records.

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
pnpm run lint
~~~

The project uses a Cloudflare-compatible Vinext/Sites build. GitHub stores the source, while Sites publishes the live website.

