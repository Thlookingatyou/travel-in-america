"use client";

import usaMap from "@svg-maps/usa.states-territories";
import { useCallback, useEffect, useState } from "react";
import { stateByName, type StateRecord } from "./data";
import "./map.css";

type CityLocation = { name: string; lat: number; lon: number };
type LocationMap = Map<string, CityLocation>;

const normalize = (value: string) => value.toLowerCase().replace(/\bcity\b/g, "").replace(/[^a-z0-9]/g, "");
const wikiUrl = (label: string) => `https://en.wikipedia.org/wiki/${encodeURIComponent(label.replaceAll(" ", "_"))}`;
const youtubeUrl = (query: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
const locationKey = (state: StateRecord, city: string) => `${state.abbr}:${normalize(city)}`;

function parseCityCsv(csv: string): LocationMap {
  const locations: LocationMap = new Map();
  for (const line of csv.split(/\r?\n/).slice(1)) {
    const columns = line.split(",");
    if (columns.length < 7) continue;
    const [, abbr, , city, , lat, lon] = columns;
    const latitude = Number(lat);
    const longitude = Number(lon);
    if (!abbr || !city || !Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;
    locations.set(`${abbr}:${normalize(city)}`, { name: city, lat: latitude, lon: longitude });
  }
  return locations;
}

function useCityLocations() {
  const [locations, setLocations] = useState<LocationMap>(new Map());
  useEffect(() => {
    let active = true;
    fetch("/us-cities.csv").then((response) => response.text()).then((csv) => {
      if (active) setLocations(parseCityCsv(csv));
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);
  return locations;
}

function StateMap({ selected, interactive, onSelect, className = "" }: {
  selected?: StateRecord | null;
  interactive?: boolean;
  onSelect?: (state: StateRecord) => void;
  className?: string;
}) {
  const states = usaMap.locations.flatMap((location) => {
    const state = stateByName.get(location.name);
    return state ? [{ location, state }] : [];
  });

  return <div className={`map-svg-wrap ${className}`}>
    <svg viewBox={usaMap.viewBox} role="img" aria-label={selected ? `Map highlighting ${selected.name}` : "Interactive administrative map of the United States"}>
      {states.map(({ location, state }) => {
        const choose = () => interactive && onSelect?.(state);
        return <path
          key={state.abbr}
          id={`state-${location.id}`}
          d={location.path}
          className={`state-shape${selected?.abbr === state.abbr ? " state-focus" : ""}`}
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
    </svg>
  </div>;
}

function getPositionedLocations(state: StateRecord, locations: LocationMap) {
  const cities = state.cities.map((city) => locations.get(locationKey(state, city.name))).filter((city): city is CityLocation => Boolean(city));
  const capital = locations.get(locationKey(state, state.capital));
  const all = capital ? [...cities, capital] : cities;
  if (!all.length) return { cities: [], capital: null };
  const minLon = Math.min(...all.map((point) => point.lon));
  const maxLon = Math.max(...all.map((point) => point.lon));
  const minLat = Math.min(...all.map((point) => point.lat));
  const maxLat = Math.max(...all.map((point) => point.lat));
  const x = (lon: number) => 14 + ((lon - minLon) / Math.max(maxLon - minLon, 0.2)) * 72;
  const y = (lat: number) => 86 - ((lat - minLat) / Math.max(maxLat - minLat, 0.2)) * 72;
  const point = (location: CityLocation) => ({ ...location, left: `${x(location.lon)}%`, top: `${y(location.lat)}%` });
  return {
    cities: state.cities.map((city) => locations.get(locationKey(state, city.name))).filter((city): city is CityLocation => Boolean(city)).map(point),
    capital: capital ? point(capital) : null,
  };
}

export default function Home() {
  const [previewState, setPreviewState] = useState<StateRecord | null>(null);
  const [detailState, setDetailState] = useState<StateRecord | null>(null);
  const handleSelect = useCallback((state: StateRecord) => setPreviewState(state), []);

  return (
    <main className="site-shell">
      <header className="topbar">
        <a className="brand" href="#top"><span className="brand-mark">✦</span><span>TRAVEL IN AMERICA<small>an atlas for curious travelers</small></span></a>
        <div className="header-note"><span className="live-dot" />50 states · one curious map</div>
      </header>
      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">THE UNITED STATES, UNFOLDED</p>
          <h1>Go somewhere<br /><em>you haven’t been.</em></h1>
          <p className="hero-lede">Tap a state on the administrative map to zoom in. Find its capital, its ten largest cities, and a jumping-off point for your next trip.</p>
          <div className="legend"><span><i className="legend-dot blue" />top cities</span><span><i className="legend-star">★</i>capital</span></div>
        </div>
        <div className="hero-stamp"><span>EST.</span><strong>50</strong><span>STATES</span></div>
      </section>

      {detailState ? <Detail state={detailState} onBack={() => setDetailState(null)} /> : (
        <section className="atlas-section">
          <div className="section-heading">
            <div><p className="eyebrow">01 / THE BIG PICTURE</p><h2>Pick your next<br /><em>American chapter.</em></h2></div>
            <p className="section-hint">Click a state boundary<br />to zoom in →</p>
          </div>
          <div className="map-frame">
            <div className="map-caption">ADMINISTRATIVE MAP <span>•</span> 50 STATES</div>
            <StateMap interactive onSelect={handleSelect} />
            {previewState && <StateCallout state={previewState} onClose={() => setPreviewState(null)} onExplore={() => setDetailState(previewState)} />}
          </div>
        </section>
      )}
      <footer><span>TRAVEL IN AMERICA</span><span>State, city, and link records live in app/data.ts.</span><span>© {new Date().getFullYear()}</span></footer>
    </main>
  );
}

function StateCallout({ state, onClose, onExplore }: { state: StateRecord; onClose: () => void; onExplore: () => void }) {
  return <aside className="state-callout" aria-live="polite">
    <button className="callout-close" onClick={onClose} aria-label="Close state options">×</button>
    <p className="eyebrow">STATE SELECTED</p>
    <h3>{state.name}<span>{state.abbr}</span></h3>
    <p>{state.region} region · capital: {state.capital}</p>
    <div className="callout-actions">
      <a href={wikiUrl(state.name)} target="_blank" rel="noreferrer">Wikipedia ↗</a>
      <a href={youtubeUrl(`travel in ${state.name}`)} target="_blank" rel="noreferrer">YouTube ↗</a>
      <button onClick={onExplore}>Open state map →</button>
    </div>
  </aside>;
}

function Detail({ state, onBack }: { state: StateRecord; onBack: () => void }) {
  const locations = useCityLocations();
  const positioned = getPositionedLocations(state, locations);
  return (
    <section className="detail-section">
      <button className="back-button" onClick={onBack}>← back to the full map</button>
      <div className="detail-grid">
        <div className="detail-copy">
          <p className="eyebrow">02 / YOU ARE HERE</p>
          <div className="state-title-line"><h2>{state.name}</h2><span>{state.abbr}</span></div>
          <p className="state-region">{state.region} region · capital: {state.capital}</p>
          <div className="action-row">
            <a className="action primary" href={wikiUrl(state.name)} target="_blank" rel="noreferrer">Read the story <span>↗</span><small>Wikipedia guide</small></a>
            <a className="action secondary" href={youtubeUrl(`travel in ${state.name}`)} target="_blank" rel="noreferrer">See it in motion <span>↗</span><small>YouTube search</small></a>
          </div>
        </div>
        <div className="zoom-map">
          <div className="zoom-label">ZOOMED STATE MAP <span>{state.abbr}</span></div>
          <StateMap selected={state} className="detail-svg" />
          <div className="marker-layer">
            {positioned.capital && <a className="capital-marker" style={{ left: positioned.capital.left, top: positioned.capital.top }} href={wikiUrl(state.capital)} target="_blank" rel="noreferrer" title={`Open ${state.capital} on Wikipedia`}><span>★</span><small>{state.capital}</small></a>}
            {positioned.cities.map((city, index) => <a key={city.name} className="city-marker" style={{ left: city.left, top: city.top }} href={wikiUrl(city.name)} target="_blank" rel="noreferrer" title={`Open ${city.name} on Wikipedia`}><i /><span>{index + 1}. {city.name}</span></a>)}
          </div>
          <div className="zoom-legend"><span><i className="legend-dot blue" />top 10 cities · Wikipedia markers</span><span><i className="legend-star">★</i>capital</span></div>
        </div>
      </div>
      <div className="city-list">
        <div><p className="eyebrow">THE CITY INDEX</p><h3>Ten places to start</h3><p className="data-note">Largest cities by 2020 Census city-proper population ordering; coordinates load from a public US city gazetteer.</p></div>
        <div className="city-columns">
          <div className="capital-row"><span className="city-rank">CAPITAL</span><strong>{state.capital}</strong><a href={wikiUrl(state.capital)} target="_blank" rel="noreferrer">Wiki ↗</a><a href={youtubeUrl(`travel in ${state.capital} ${state.name}`)} target="_blank" rel="noreferrer">YouTube ↗</a></div>
          {state.cities.map((city, index) => <div className="city-row" key={city.name}><span className="city-rank">{String(index + 1).padStart(2, "0")}</span><strong>{city.name}</strong><a href={wikiUrl(city.name)} target="_blank" rel="noreferrer">Wiki ↗</a><a href={youtubeUrl(`travel in ${city.name} ${state.name}`)} target="_blank" rel="noreferrer">YouTube ↗</a></div>)}
        </div>
      </div>
    </section>
  );
}

