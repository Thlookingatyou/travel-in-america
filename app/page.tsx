"use client";

/* eslint-disable @next/next/no-img-element */

import usaMap from "@svg-maps/usa.states-territories";
import { geoAlbersUsa, geoArea, geoPath } from "d3-geo";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { stateByAbbr, stateByName, type StateRecord } from "./data";
import { FavoriteButton, FavoritesTrigger, type FavoriteItem } from "./favorites";
import { cityWikiUrl, cityYoutubeUrl, stateWikiUrl, stateYoutubeUrl, wikiUrl, youtubeUrl } from "./links";
import { salParadiseRoute, type RouteStop } from "./route-data";
import "./map.css";

type CityLocation = { name: string; lat: number; lon: number };
type LocationMap = Map<string, CityLocation>;
type RoutePoint = RouteStop & { x: number; y: number; index: number };
type RandomDestination = CityLocation & { city: string; state: StateRecord };
type Position = [number, number];
type PolygonCoordinates = Position[][];
type GeoGeometry =
  | { type: "Polygon"; coordinates: PolygonCoordinates }
  | { type: "MultiPolygon"; coordinates: PolygonCoordinates[] };
type GeoFeature = { type: "Feature"; properties?: { name?: string }; geometry: GeoGeometry };
type GeoCollection = { type: "FeatureCollection"; features: GeoFeature[] };

const famousDestinationSeeds: [city: string, stateAbbr: string][] = [
  ["New York City", "NY"], ["Boston", "MA"], ["Philadelphia", "PA"], ["Pittsburgh", "PA"],
  ["Baltimore", "MD"], ["Portland", "ME"], ["Providence", "RI"], ["Burlington", "VT"],
  ["Miami", "FL"], ["Orlando", "FL"], ["New Orleans", "LA"], ["Charleston", "SC"],
  ["Savannah", "GA"], ["Atlanta", "GA"], ["Nashville", "TN"], ["Memphis", "TN"],
  ["Charlotte", "NC"], ["Virginia Beach", "VA"], ["Louisville", "KY"], ["Chicago", "IL"],
  ["Detroit", "MI"], ["Minneapolis", "MN"], ["Milwaukee", "WI"], ["Cleveland", "OH"],
  ["Indianapolis", "IN"], ["Kansas City", "MO"], ["St. Louis", "MO"], ["Omaha", "NE"],
  ["Austin", "TX"], ["San Antonio", "TX"], ["Dallas", "TX"], ["Houston", "TX"],
  ["Denver", "CO"], ["Santa Fe", "NM"], ["Albuquerque", "NM"], ["Phoenix", "AZ"],
  ["Tucson", "AZ"], ["Las Vegas", "NV"], ["Salt Lake City", "UT"], ["Boise", "ID"],
  ["Portland", "OR"], ["Seattle", "WA"], ["San Francisco", "CA"], ["Los Angeles", "CA"],
  ["San Diego", "CA"], ["Honolulu", "HI"], ["Anchorage", "AK"],
];

function projectRoute(projection: ReturnType<typeof geoAlbersUsa>): RoutePoint[] {
  return salParadiseRoute.flatMap((stop, index) => {
    const projected = projection(stop.coordinates);
    return projected ? [{ ...stop, x: projected[0], y: projected[1], index }] : [];
  });
}

const normalize = (value: string) => value.toLowerCase().replace(/\bcity\b/g, "").replace(/[^a-z0-9]/g, "");
const routeWikiUrl = (stop: RouteStop) => stop.wikiSlug === null ? null : wikiUrl(stop.wikiSlug ?? stop.city);
const locationKey = (state: StateRecord, city: string) => `${state.abbr}:${normalize(city)}`;
const stateFavorite = (state: StateRecord): FavoriteItem => ({
  id: `state:${state.abbr}`,
  type: "state",
  label: state.name,
  subtitle: `${state.region} region · capital: ${state.capital}`,
  href: stateWikiUrl(state),
});
const cityFavorite = (city: string, state: StateRecord): FavoriteItem => ({
  id: `city:${state.abbr}:${normalize(city)}`,
  type: "city",
  label: city,
  subtitle: state.name,
  href: cityWikiUrl(city, state),
});

function parseCsvLine(line: string): string[] {
  const columns: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      columns.push(field.trim());
      field = "";
    } else {
      field += character;
    }
  }
  columns.push(field.trim());
  return columns;
}

function parseCityCsv(csv: string): LocationMap {
  const locations: LocationMap = new Map();
  for (const line of csv.split(/\r?\n/).slice(1)) {
    if (!line.trim()) continue;
    const columns = parseCsvLine(line);
    if (columns.length < 7) continue;
    const [, abbr, , city, , lat, lon] = columns;
    const cityName = city;
    const latitude = Number(lat);
    const longitude = Number(lon);
    if (!abbr || !cityName || !Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;
    const key = `${abbr}:${normalize(cityName)}`;
    if (!locations.has(key)) locations.set(key, { name: cityName, lat: latitude, lon: longitude });
  }
  return locations;
}

function useCityLocations() {
  const [locations, setLocations] = useState<LocationMap>(new Map());
  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/us-cities.csv").then((response) => response.text()),
      fetch("/us-city-overrides.csv").then((response) => response.text()),
    ]).then(([cityCsv, overrideCsv]) => {
      if (!active) return;
      const merged = parseCityCsv(cityCsv);
      for (const [key, location] of parseCityCsv(overrideCsv)) merged.set(key, location);
      setLocations(merged);
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);
  return locations;
}

function useUsaGeography() {
  const [geography, setGeography] = useState<GeoCollection | null>(null);
  useEffect(() => {
    let active = true;
    fetch("/us-states.geojson")
      .then((response) => response.json() as Promise<GeoCollection>)
      .then((data) => {
        if (!active) return;
        const features = data.features.map((feature) => {
          if (feature.geometry.type !== "MultiPolygon") return feature;
          const coordinates = feature.geometry.coordinates.filter((polygon) => {
            const area = geoArea({ type: "Polygon", coordinates: polygon } as never);
            return area < Math.PI;
          });
          return { ...feature, geometry: { ...feature.geometry, coordinates } };
        });
        setGeography({ ...data, features });
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);
  return geography;
}

function StateMap({ selected, interactive, onSelect, className = "", routeVisible = false, routeSelected, onRouteSelect, randomDestination }: {
  selected?: StateRecord | null;
  interactive?: boolean;
  onSelect?: (state: StateRecord) => void;
  className?: string;
  routeVisible?: boolean;
  routeSelected?: RoutePoint | null;
  onRouteSelect?: (stop: RoutePoint) => void;
  randomDestination?: RandomDestination | null;
}) {
  const geography = useUsaGeography();
  const projection = geography
    ? geoAlbersUsa().fitSize([959, 593], geography as never)
    : geoAlbersUsa();
  const routePoints = geography ? projectRoute(projection) : [];
  const randomPoint = geography && randomDestination ? projection([randomDestination.lon, randomDestination.lat]) : null;
  const pathGenerator = geoPath(projection);
  const states = geography
    ? geography.features.flatMap((feature) => {
      const state = stateByName.get(feature.properties?.name ?? "");
      const path = pathGenerator(feature as never);
      return state && path ? [{ state, path }] : [];
    })
    : usaMap.locations.flatMap((location) => {
      const state = stateByName.get(location.name);
      return state ? [{ state, path: location.path }] : [];
    });

  return <div className={`map-svg-wrap ${className}`}>
    <svg viewBox={geography ? "0 0 959 593" : usaMap.viewBox} role="img" aria-label={selected ? `Map highlighting ${selected.name}` : "Interactive administrative map of the United States"}>
      {states.map(({ state, path }) => {
        const choose = () => interactive && onSelect?.(state);
        return <path
          key={state.abbr}
          id={`state-${state.abbr}`}
          d={path}
          className={`state-shape${selected?.abbr === state.abbr ? " state-focus" : ""}${randomDestination?.state.abbr === state.abbr ? " random-state" : ""}`}
          aria-label={state.name}
          role={interactive ? "button" : undefined}
          tabIndex={interactive ? 0 : undefined}
          onClick={choose}
          onKeyDown={(event) => {
            if (interactive && (event.key === "Enter" || event.key === " ")) {
              event.preventDefault();
              choose();
            }
          }}
        >
          <title>{state.name}</title>
        </path>;
      })}
      {routeVisible && geography && <g className="sal-route-overlay" aria-label="Sal Paradise first trip west">
        <path className="sal-route-line" d={routePoints.map((point, index) => `${index ? "L" : "M"}${point.x} ${point.y}`).join(" ")} />
        {routePoints.map((point) => {
          const choose = () => onRouteSelect?.(point);
          const isSelected = routeSelected?.index === point.index;
          const canOpen = routeWikiUrl(point) !== null;
          return <g
            key={`${point.city}-${point.index}`}
            className={`sal-route-point${isSelected ? " selected" : ""}${canOpen ? "" : " static"}`}
            role={canOpen ? "button" : undefined}
            tabIndex={canOpen ? 0 : undefined}
            aria-label={`${point.city}, ${point.state}${canOpen ? " route stop" : " (Wikipedia unavailable)"}`}
            onClick={canOpen ? choose : undefined}
            onKeyDown={canOpen ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                choose();
              }
            } : undefined}
          >
            <circle className="sal-route-halo" cx={point.x} cy={point.y} r={isSelected ? 8 : 5.5} />
            <circle className="sal-route-dot" cx={point.x} cy={point.y} r={isSelected ? 4.5 : 3} />
            <text x={point.x + 7} y={point.y - 7}>{point.city}</text>
            <title>{point.city}, {point.state}</title>
          </g>;
        })}
      </g>}
      {randomDestination && randomPoint && <g key={`${randomDestination.state.abbr}-${randomDestination.city}`} className="random-destination-marker" aria-label={`${randomDestination.city}, ${randomDestination.state.name}`}>
        <circle className="random-destination-pulse" cx={randomPoint[0]} cy={randomPoint[1]} r="17" />
        <circle className="random-destination-ring" cx={randomPoint[0]} cy={randomPoint[1]} r="9" />
        <circle className="random-destination-dot" cx={randomPoint[0]} cy={randomPoint[1]} r="4" />
        <text x={randomPoint[0] + 13} y={randomPoint[1] - 13}>{randomDestination.city}, {randomDestination.state.abbr}</text>
        <title>{randomDestination.city}, {randomDestination.state.name}</title>
      </g>}
    </svg>
  </div>;
}

function HeroUSA() {
  return <div className="hero-photo">
    <img src="/USAsvg.webp" alt="The United States highlighted on a globe" />
    <span>USA</span>
  </div>;
}

function StateDetailMap({ state, locations }: { state: StateRecord; locations: LocationMap }) {
  const geography = useUsaGeography();
  const feature = geography?.features.find((candidate) => candidate.properties?.name === state.name);
  if (!feature) return <div className="state-map-loading">Preparing the {state.name} map…</div>;

  const projection = geoAlbersUsa().fitExtent([[78, 62], [822, 458]], feature as never);
  const outline = geoPath(projection)(feature as never);
  const cities = state.cities.flatMap((city, index) => {
    const location = locations.get(locationKey(state, city.name));
    if (!location) return [];
    const projected = projection([location.lon, location.lat]);
    return projected ? [{ ...city, index, x: projected[0], y: projected[1] }] : [];
  });
  const capitalLocation = locations.get(locationKey(state, state.capital));
  const capitalProjected = capitalLocation ? projection([capitalLocation.lon, capitalLocation.lat]) : null;
  const capitalInCities = cities.some((city) => normalize(city.name) === normalize(state.capital));
  const labelOffsets = [
    { dx: 12, dy: -10, anchor: "start" as const },
    { dx: 12, dy: 17, anchor: "start" as const },
    { dx: -12, dy: -10, anchor: "end" as const },
    { dx: -12, dy: 17, anchor: "end" as const },
  ];

  return <svg className="state-detail-map" viewBox="0 0 900 520" role="img" aria-label={`${state.name} map with its capital and ten largest cities`}>
    {outline && <path className="state-detail-shape" d={outline}><title>{state.name}</title></path>}
    {cities.map((city) => {
      const isCapital = normalize(city.name) === normalize(state.capital);
      const offset = labelOffsets[city.index % labelOffsets.length];
      return <a
        key={city.name}
        className={`state-place${isCapital ? " state-place-capital" : ""}`}
        href={cityWikiUrl(city.name, state)}
        target="_blank"
        rel="noreferrer"
        aria-label={`Open ${city.name} on Wikipedia`}
      >
        {isCapital
          ? <text className="state-capital-star" x={city.x} y={city.y + 7} textAnchor="middle">★</text>
          : <circle cx={city.x} cy={city.y} r="5" />}
        <text className="state-place-label" x={city.x + offset.dx} y={city.y + offset.dy} textAnchor={offset.anchor}>
          {isCapital ? `${city.name} · capital` : city.name}
        </text>
        <title>{city.name}{isCapital ? `, capital of ${state.name}` : `, ${state.name}`}</title>
      </a>;
    })}
    {capitalProjected && !capitalInCities && <a
      className="state-place state-place-capital"
      href={cityWikiUrl(state.capital, state)}
      target="_blank"
      rel="noreferrer"
      aria-label={`Open ${state.capital} on Wikipedia`}
    >
      <text className="state-capital-star" x={capitalProjected[0]} y={capitalProjected[1] + 7} textAnchor="middle">★</text>
      <text className="state-place-label" x={capitalProjected[0] + 14} y={capitalProjected[1] - 11}>{state.capital} · capital</text>
      <title>{state.capital}, capital of {state.name}</title>
    </a>}
  </svg>;
}

export default function Home() {
  const [previewState, setPreviewState] = useState<StateRecord | null>(null);
  const [detailState, setDetailState] = useState<StateRecord | null>(null);
  const [showSalRoute, setShowSalRoute] = useState(false);
  const [selectedRouteStop, setSelectedRouteStop] = useState<RoutePoint | null>(null);
  const [randomDestination, setRandomDestination] = useState<RandomDestination | null>(null);
  const cityLocations = useCityLocations();
  const famousDestinations = famousDestinationSeeds.flatMap(([city, stateAbbr]) => {
    const state = stateByAbbr.get(stateAbbr);
    if (!state) return [];
    const location = cityLocations.get(locationKey(state, city));
    return location ? [{ ...location, city, state }] : [];
  });
  const handleSelect = useCallback((state: StateRecord) => setPreviewState(state), []);
  const chooseRandomDestination = () => {
    if (!famousDestinations.length) return;
    let next = famousDestinations[Math.floor(Math.random() * famousDestinations.length)];
    if (famousDestinations.length > 1 && next.city === randomDestination?.city && next.state.abbr === randomDestination.state.abbr) {
      const currentIndex = famousDestinations.findIndex((destination) => destination.city === next.city && destination.state.abbr === next.state.abbr);
      next = famousDestinations[(currentIndex + 1) % famousDestinations.length];
    }
    setRandomDestination(next);
    setPreviewState(null);
    setShowSalRoute(false);
    setSelectedRouteStop(null);
  };

  return (
    <main className="site-shell">
      <header className="topbar">
        <a className="brand" href="#top"><span className="brand-mark">✦</span><span>TRAVEL IN AMERICA<small>an atlas for curious travelers</small></span></a>
        <div className="topbar-actions"><div className="header-note"><span className="live-dot" />50 states · one curious map</div><FavoritesTrigger compact /></div>
      </header>
      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">THE UNITED STATES, UNFOLDED</p>
          <h1>Welcome to the<br /><em>United States.</em></h1>
          <p className="hero-lede">Traveling in such a large and diverse country can cause decidophobia. Well, before you start your trip, click the state you are interested in the map below and you can imagine the trip with introduction from Wikipedia and videos from YouTube.</p>
          <div className="legend"><span><i className="legend-dot blue" />top cities</span><span><i className="legend-star">★</i>capital</span></div>
        </div>
        <HeroUSA />
      </section>

      {detailState ? <Detail state={detailState} locations={cityLocations} onBack={() => setDetailState(null)} /> : (
        <section className="atlas-section">
          <div className="section-heading">
            <div><p className="eyebrow">01 / THE BIG PICTURE</p><h2>Pick your next<br /><em>American chapter.</em></h2></div>
            <p className="section-hint">Click a state boundary<br />to zoom in →</p>
          </div>
          <div className="map-frame">
            <div className="map-caption">ADMINISTRATIVE MAP <span>•</span> 50 STATES</div>
            <button className="route-button" onClick={() => setShowSalRoute((visible) => !visible)} aria-expanded={showSalRoute}>
              {showSalRoute ? "Hide Sal Paradise's route" : "Show Sal Paradise's first trip west"} <span>{showSalRoute ? "↑" : "→"}</span>
            </button>
            <StateMap interactive onSelect={handleSelect} routeVisible={showSalRoute} routeSelected={selectedRouteStop} onRouteSelect={setSelectedRouteStop} randomDestination={randomDestination} />
            {showSalRoute && <RouteIntro />}
            {showSalRoute && selectedRouteStop && <RouteStopCard stop={selectedRouteStop} />}
            {previewState && <StateCallout state={previewState} onClose={() => setPreviewState(null)} onExplore={() => setDetailState(previewState)} />}
          </div>
          <div className="random-destination-panel">
            <div className="random-destination-copy">
              <p className="eyebrow">LET CHANCE DECIDE</p>
              <h3>Randomly choose a place to visit <em>if you are not sure where to.</em></h3>
              <p>A curated draw from {famousDestinationSeeds.length} well-known American cities. Each click places the destination directly on the map above.</p>
            </div>
            <div className="random-destination-controls">
              <button type="button" onClick={chooseRandomDestination} disabled={!famousDestinations.length}>
                {famousDestinations.length ? "Choose a random city" : "Preparing destinations…"} <span>→</span>
              </button>
              <div className={`random-destination-result${randomDestination ? " has-result" : ""}`} aria-live="polite">
                {randomDestination ? <>
                  <p>Your next American chapter</p>
                  <h4>{randomDestination.city}<span>{randomDestination.state.abbr}</span></h4>
                  <div>
                    <a href={cityWikiUrl(randomDestination.city, randomDestination.state)} target="_blank" rel="noreferrer">Wikipedia ↗</a>
                    <a href={cityYoutubeUrl(randomDestination.city, randomDestination.state)} target="_blank" rel="noreferrer">YouTube ↗</a>
                    <FavoriteButton item={cityFavorite(randomDestination.city, randomDestination.state)} />
                  </div>
                </> : <p>Press the button and let the map choose for you.</p>}
              </div>
            </div>
          </div>
        </section>
      )}
      {!detailState && <HistoryCover />}
      <footer><span>TRAVEL IN AMERICA</span><span>State, city, history, and link records are kept in simple data files.</span><span>© {new Date().getFullYear()}</span></footer>
    </main>
  );
}

function RouteStopCard({ stop }: { stop: RoutePoint | null }) {
  if (!stop) return null;
  const wikipedia = routeWikiUrl(stop);
  return <aside className="route-stop-card" aria-live="polite">
    <p className="eyebrow">ON THE ROAD · ROUTE STOP</p>
    <h3>{stop.city}<span>{stop.state}</span></h3>
    <div className="route-city-actions">{wikipedia && <a href={wikipedia} target="_blank" rel="noreferrer">Wikipedia ↗</a>}<a href={youtubeUrl(`travel in ${stop.city}, ${stop.state}, USA`)} target="_blank" rel="noreferrer">YouTube ↗</a></div>
  </aside>;
}

function RouteIntro() {
  return <aside className="route-intro">
    <p className="eyebrow">A LITERARY ROAD WEST</p>
    <h3>Sal Paradise’s first trip west</h3>
    <p>Jack Kerouac’s 1957 novel follows the restless narrator Sal Paradise across America with Dean Moriarty, a fictionalized Neal Cassady. This first westbound journey runs from New York through Chicago and Denver toward the Pacific coast: part travelogue, part portrait of the Beat Generation’s search for freedom, friendship, and experience.</p>
    <a href="https://en.wikipedia.org/wiki/On_the_Road" target="_blank" rel="noreferrer">About the novel ↗</a>
  </aside>;
}

function StateCallout({ state, onClose, onExplore }: { state: StateRecord; onClose: () => void; onExplore: () => void }) {
  return <aside className="state-callout" aria-live="polite">
    <button className="callout-close" onClick={onClose} aria-label="Close state options">×</button>
    <p className="eyebrow">STATE SELECTED</p>
    <h3>{state.name}<span>{state.abbr}</span></h3>
    <p>{state.region} region · capital: {state.capital}</p>
    <div className="callout-actions">
      <a href={stateWikiUrl(state)} target="_blank" rel="noreferrer">Wikipedia ↗</a>
      <a href={stateYoutubeUrl(state)} target="_blank" rel="noreferrer">YouTube ↗</a>
      <button onClick={onExplore}>Open state map →</button>
      <FavoriteButton item={stateFavorite(state)} />
    </div>
  </aside>;
}

function Detail({ state, locations, onBack }: { state: StateRecord; locations: LocationMap; onBack: () => void }) {
  return (
    <section className="detail-section">
      <button className="back-button" onClick={onBack}>← back to the full map</button>
      <div className="detail-grid">
        <div className="detail-copy">
          <p className="eyebrow">02 / YOU ARE HERE</p>
          <div className="state-title-line"><h2>{state.name}</h2><span>{state.abbr}</span></div>
          <p className="state-region">{state.region} region · capital: {state.capital}</p>
          <div className="action-row">
            <a className="action primary" href={stateWikiUrl(state)} target="_blank" rel="noreferrer">Read the story <span>↗</span><small>Wikipedia guide</small></a>
            <a className="action secondary" href={stateYoutubeUrl(state)} target="_blank" rel="noreferrer">See it in motion <span>↗</span><small>YouTube search</small></a>
            <FavoriteButton item={stateFavorite(state)} className="detail-favorite" />
          </div>
        </div>
        <div className="zoom-map">
          <div className="zoom-label">ZOOMED STATE MAP <span>{state.abbr}</span></div>
          <StateDetailMap state={state} locations={locations} />
          <div className="zoom-legend"><span><i className="legend-dot blue" />top 10 cities · Wikipedia markers</span><span><i className="legend-star">★</i>capital</span></div>
        </div>
      </div>
      <div className="city-list">
        <div><p className="eyebrow">THE CITY INDEX</p><h3>Ten places to start</h3><p className="data-note">Ten curated major population centers; coordinates load from a public US city gazetteer and local corrections.</p></div>
        <div className="city-columns">
          <div className="capital-row"><span className="city-rank">CAPITAL</span><strong>{state.capital}</strong><a href={cityWikiUrl(state.capital, state)} target="_blank" rel="noreferrer">Wiki ↗</a><a href={cityYoutubeUrl(state.capital, state)} target="_blank" rel="noreferrer">YouTube ↗</a><FavoriteButton item={cityFavorite(state.capital, state)} showLabel={false} /></div>
          {state.cities.map((city, index) => <div className="city-row" key={city.name}><span className="city-rank">{String(index + 1).padStart(2, "0")}</span><strong>{city.name}</strong><a href={cityWikiUrl(city.name, state)} target="_blank" rel="noreferrer">Wiki ↗</a><a href={cityYoutubeUrl(city.name, state)} target="_blank" rel="noreferrer">YouTube ↗</a><FavoriteButton item={cityFavorite(city.name, state)} showLabel={false} /></div>)}
        </div>
      </div>
    </section>
  );
}

function HistoryCover() {
  return <section className="history-cover-section" aria-labelledby="history-cover-title">
    <div className="history-cover-image">
      <img src="/history/history-cover.jpg" alt="John Trumbull’s painting of the Declaration committee presenting its draft to the Second Continental Congress" loading="lazy" />
      <a href="https://commons.wikimedia.org/wiki/File:The_Declaration_of_Independence,_July_4,_1776,_by_John_Trumbull.jpg" target="_blank" rel="noreferrer">John Trumbull · public domain ↗</a>
    </div>
    <div className="history-cover-copy">
      <p className="eyebrow">03 / HISTORY HAPPENED SOMEWHERE</p>
      <h2 id="history-cover-title">These places are very <em>“American.”</em></h2>
      <p>Walk through 24 places where Indigenous cities rose, delegates debated, wars turned, rights were demanded, and new cultures found their voice.</p>
      <div className="history-cover-meta"><span>8 chapters</span><span>24 visitable places</span><span>save your favorites</span></div>
      <Link className="history-cover-button" href="/history">Click to know more about the US <span>→</span></Link>
    </div>
  </section>;
}
