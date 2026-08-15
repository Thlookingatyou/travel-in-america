"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { stateByName, stateCatalog, stateId, type StateRecord } from "./data";

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
  const [svg, setSvg] = useState("");
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/us-states.svg").then((response) => response.text()).then(setSvg).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!svg || !mapRef.current) return;
    const root = mapRef.current.querySelector("svg");
    if (!root) return;
    root.setAttribute("role", "img");
    root.setAttribute("aria-label", selected ? `Map of ${selected.name}` : "Administrative map of the United States");
    const statePaths = Array.from(root.querySelectorAll<SVGPathElement>("#states > path"));
    statePaths.forEach((path) => {
      const state = stateByName.get(path.id.replaceAll("_", " "));
      if (!state) return;
      path.classList.toggle("state-focus", selected?.abbr === state.abbr);
      path.setAttribute("aria-label", state.name);
      if (!interactive) return;
      path.setAttribute("tabindex", "0");
      path.setAttribute("role", "button");
      const choose = () => onSelect?.(state);
      const keydown = (event: Event) => {
        const keyboardEvent = event as KeyboardEvent;
        if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
          keyboardEvent.preventDefault();
          choose();
        }
      };
      path.addEventListener("click", choose);
      path.addEventListener("keydown", keydown);
    });
    if (selected) {
      const selectedPath = root.querySelector<SVGPathElement>(`#${stateId(selected.name)}`);
      if (selectedPath) {
        const box = selectedPath.getBBox();
        const padding = Math.max(box.width, box.height) * 0.18;
        root.setAttribute("viewBox", `${box.x - padding} ${box.y - padding} ${box.width + padding * 2} ${box.height + padding * 2}`);
      }
    } else {
      root.setAttribute("viewBox", "0 0 800 698");
    }
    return () => statePaths.forEach((path) => path.replaceWith(path.cloneNode(true)));
  }, [svg, selected, interactive, onSelect]);

  if (!svg) return <div className="map-loading" role="status">Loading the map…</div>;
  return <div ref={mapRef} className={`map-svg-wrap ${className}`} dangerouslySetInnerHTML={{ __html: svg }} />;
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
  const [selected, setSelected] = useState<StateRecord | null>(null);
  const handleSelect = useCallback((state: StateRecord) => setSelected(state), []);
  const regions = useMemo(() => ["Northeast", "Midwest", "South", "West"].map((region) => ({
    region,
    items: stateCatalog.filter((state) => state.region === region),
  })), []);

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

      {selected ? <Detail state={selected} onBack={() => setSelected(null)} /> : (
        <section className="atlas-section">
          <div className="section-heading">
            <div><p className="eyebrow">01 / THE BIG PICTURE</p><h2>Pick your next<br /><em>American chapter.</em></h2></div>
            <p className="section-hint">Click a state boundary<br />to zoom in →</p>
          </div>
          <div className="map-frame">
            <div className="map-caption">ADMINISTRATIVE MAP <span>•</span> 50 STATES</div>
            <StateMap interactive onSelect={handleSelect} />
          </div>
          <div className="state-index" aria-label="All states">
            {stateCatalog.map((state) => <button key={state.abbr} onClick={() => handleSelect(state)}>{state.abbr}<span>{state.name}</span></button>)}
          </div>
        </section>
      )}
      <footer><span>TRAVEL IN AMERICA</span><span>State, city, and link records live in app/data.ts.</span><span>© {new Date().getFullYear()}</span></footer>
    </main>
  );
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
