import type { StateRecord } from "./data";

const stateWikiTitles: Record<string, string> = {
  "New York": "New York (state)",
  Georgia: "Georgia (U.S. state)",
  Washington: "Washington (state)",
};

// Wikipedia has a few city titles that are clearer or more stable than the
// generic "City, State" form. Keep these exceptions here so link maintenance
// stays separate from the map and page layout.
const cityWikiTitles: Record<string, string> = {
  "NY:New York City": "New York City",
  "CA:Los Angeles": "Los Angeles",
  "CA:San Francisco": "San Francisco",
  "CA:San Diego": "San Diego",
  "IL:Chicago": "Chicago",
  "MA:Boston": "Boston",
  "PA:Philadelphia": "Philadelphia",
  "TX:Austin": "Austin, Texas",
  "TX:Dallas": "Dallas",
  "TX:Houston": "Houston",
  "TX:San Antonio": "San Antonio",
  "MO:St. Louis": "St. Louis",
  "MN:Saint Paul": "Saint Paul",
  "LA:New Orleans": "New Orleans",
  "HI:Honolulu": "Honolulu",
  "AK:Anchorage": "Anchorage",
};

const encodeWikiTitle = (title: string) => encodeURIComponent(title.replaceAll(" ", "_"));

export const wikiUrl = (title: string) => `https://en.wikipedia.org/wiki/${encodeWikiTitle(title)}`;

export const stateWikiTitle = (state: Pick<StateRecord, "name">) => stateWikiTitles[state.name] ?? state.name;
export const stateWikiUrl = (state: Pick<StateRecord, "name">) => wikiUrl(stateWikiTitle(state));

export const cityWikiTitle = (city: string, state: Pick<StateRecord, "name" | "abbr">) =>
  cityWikiTitles[`${state.abbr}:${city}`] ?? `${city}, ${state.name}`;
export const cityWikiUrl = (city: string, state: Pick<StateRecord, "name" | "abbr">) => wikiUrl(cityWikiTitle(city, state));

export const youtubeUrl = (query: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
export const stateYoutubeUrl = (state: Pick<StateRecord, "name">) => youtubeUrl(`travel in ${state.name}, USA`);
export const cityYoutubeUrl = (city: string, state: Pick<StateRecord, "name">) => youtubeUrl(`travel in ${city}, ${state.name}, USA`);

