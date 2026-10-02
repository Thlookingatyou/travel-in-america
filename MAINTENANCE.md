# Link maintenance — 3 October 2026

The audit covered all 50 states, 500 featured cities, state capitals, literary-route stops, the novel link, and the history gallery. Random destinations use the same city-link registry. No geographical coordinates or map projections changed in this maintenance update.

## Corrected destinations

- Saint Paul, Minnesota now opens the city article; the old `Saint Paul` title redirected to Paul the Apostle.
- Hamilton, New Jersey now opens Hamilton Township in Mercer County, matching the atlas's place record.
- Rutland, Barre, St. Albans, and Newport in Vermont now open their city articles rather than town/city disambiguation pages.
- The hip-hop history entry now links to the Smithsonian National Museum of African American History and Culture's [Hip-Hop in the Bronx](https://nmaahc.si.edu/explore/stories/hip-hop-bronx) article. The previous general Smithsonian spotlight could not be retrieved reliably during the audit.
- Saved state, city, and history favorites refresh their links from current atlas content when loaded, preserving the visitor's saved places.

## Verification

Wikipedia's query API checked 561 unique article titles, following redirects and detecting missing pages and disambiguation pages. All six replacement city titles were separately confirmed as existing articles. Existing valid redirects remain supported; links do not need to change simply because Wikipedia redirects a title to its canonical article.

A second full Wikipedia pass encountered rate limiting, so it is not counted as a complete repeat audit. The initial complete pass and the separate successful verification of all six replacements support the corrections above.

The gallery's 48 unique history and image-source URLs were checked. Forty-six returned HTTP 200. UNESCO's Cahokia page and Smithsonian pages blocked direct automated requests; their current content was independently checked through web search. Automated blocking is not evidence that a visitor-facing page is broken. The replacement Smithsonian article is indexed with its relevant Bronx history content, but a direct automated HTTP check remained blocked.

Wikipedia and YouTube links are generated centrally, and Google Maps links use encoded place-search queries. Search destinations may present consent screens or restrict automated access; their individual results cannot be guaranteed. All audited results describe this date, and external sites can change later.

All 600 generated state/capital/city YouTube queries and all 24 gallery map queries passed local URL checks. Representative YouTube and Google Maps searches and the public GitHub repository returned HTTP 200. The production build completed and all seven existing tests passed, including both rendered pages and the geographic checks.

## Next maintenance pass

1. Collect Wikipedia titles from `app/links.ts`, `app/data.ts`, and `app/route-data.ts`; check redirects, missing pages, disambiguation, and the actual subject.
2. Check each history and image-source URL in `app/history/history-data.ts`, investigating blocked responses separately from missing pages.
3. Verify encoded YouTube and Google Maps queries, internal navigation, and the public GitHub repository link.
4. Build and run the existing tests, then update GitHub and publish the matching source to Sites.
