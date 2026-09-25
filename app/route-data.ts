export type RouteStop = {
  city: string;
  state: string;
  /** WGS84 longitude, latitude. Never use screen or SVG coordinates here. */
  coordinates: [number, number];
  wikiSlug?: string | null;
};

// City points are the primary GNIS points in the USGS National Map gazetteer
// (queried 2026-09-25). The Bear Mountain stop is the bridge on US 6, not the
// nearby summit; its position is the bridge coordinate, 41.32000, -73.98028.
export const salParadiseRoute: RouteStop[] = [
  { city: "New York City", state: "NY", coordinates: [-74.005974, 40.714277], wikiSlug: "New_York_City" },
  { city: "Paterson", state: "NJ", coordinates: [-74.171813, 40.916774], wikiSlug: "Paterson,_New_Jersey" },
  { city: "Bear Mountain Bridge", state: "NY", coordinates: [-73.98028, 41.32], wikiSlug: "Bear_Mountain_Bridge" },
  { city: "Chicago", state: "IL", coordinates: [-87.650058, 41.850041], wikiSlug: "Chicago" },
  { city: "Joliet", state: "IL", coordinates: [-88.081731, 41.525039], wikiSlug: "Joliet,_Illinois" },
  { city: "Davenport", state: "IA", coordinates: [-90.577643, 41.523651], wikiSlug: "Davenport,_Iowa" },
  { city: "Des Moines", state: "IA", coordinates: [-93.609114, 41.600552], wikiSlug: "Des_Moines" },
  { city: "Council Bluffs", state: "IA", coordinates: [-95.860841, 41.261952], wikiSlug: "Council_Bluffs,_Iowa" },
  { city: "Omaha", state: "NE", coordinates: [-95.9378, 41.258617], wikiSlug: "Omaha,_Nebraska" },
  { city: "North Platte", state: "NE", coordinates: [-100.765432, 41.123894], wikiSlug: "North_Platte,_Nebraska" },
  { city: "Cheyenne", state: "WY", coordinates: [-104.820256, 41.139988], wikiSlug: "Cheyenne,_Wyoming" },
  { city: "Denver", state: "CO", coordinates: [-104.984714, 39.73916], wikiSlug: "Denver" },
  { city: "Central City", state: "CO", coordinates: [-105.514174, 39.801939], wikiSlug: "Central_City,_Colorado" },
  { city: "Denver", state: "CO", coordinates: [-104.984714, 39.73916], wikiSlug: "Denver" },
  { city: "Salt Lake City", state: "UT", coordinates: [-111.891059, 40.760785], wikiSlug: "Salt_Lake_City" },
  { city: "Reno", state: "NV", coordinates: [-119.813816, 39.529638], wikiSlug: "Reno,_Nevada" },
  { city: "Sacramento", state: "CA", coordinates: [-121.494413, 38.581577], wikiSlug: "Sacramento,_California" },
  { city: "San Francisco", state: "CA", coordinates: [-122.419458, 37.775005], wikiSlug: "San_Francisco" },
  { city: "Los Angeles", state: "CA", coordinates: [-118.243697, 34.052239], wikiSlug: "Los_Angeles" },
  { city: "Bakersfield", state: "CA", coordinates: [-119.018725, 35.373297], wikiSlug: "Bakersfield,_California" },
];
