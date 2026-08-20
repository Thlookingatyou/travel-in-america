"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { FavoriteButton, FavoritesTrigger, type FavoriteItem } from "../favorites";
import { historyChapters, historyMapUrl, historyPlaces, type HistoryPlace } from "./history-data";
import "./history.css";

const historyFavorite = (place: HistoryPlace): FavoriteItem => ({
  id: `history:${place.id}`,
  type: "history",
  label: place.place,
  subtitle: `${place.year} · ${place.location}`,
  href: place.learnUrl,
});

export default function HistoryPageClient() {
  return <main className="history-shell">
    <header className="history-topbar">
      <Link className="history-brand" href="/"><span>✦</span><strong>TRAVEL IN AMERICA<small>an atlas for curious travelers</small></strong></Link>
      <nav><Link href="/">← Back to the atlas</Link><FavoritesTrigger compact /></nav>
    </header>

    <section className="history-hero">
      <img src="/history/history-cover.jpg" alt="John Trumbull’s painting of the Declaration committee presenting its draft to Congress" />
      <div className="history-hero-shade" />
      <div className="history-hero-copy">
        <p>THE UNITED STATES, REMEMBERED</p>
        <h1>History happened<br /><em>somewhere.</em></h1>
        <div><span>{historyPlaces.length} places</span><span>{historyChapters.length} chapters</span><span>one unfinished story</span></div>
      </div>
      <a className="history-scroll-cue" href="#history-intro">Scroll through time <span>↓</span></a>
      <a className="history-image-credit" href="https://commons.wikimedia.org/wiki/File:The_Declaration_of_Independence,_July_4,_1776,_by_John_Trumbull.jpg" target="_blank" rel="noreferrer">John Trumbull · public domain ↗</a>
    </section>

    <section className="history-intro" id="history-intro">
      <div>
        <p className="history-eyebrow">THE PLACES KEEP THE MEMORY</p>
        <h2>These places are very <em>“American.”</em></h2>
      </div>
      <div className="history-intro-copy">
        <p>This is not a list of monuments to admire from a distance. It is a route through places where people argued, resisted, migrated, fought, created, and changed what the United States could mean.</p>
        <p>The cover is often mistaken for a signing scene. John Trumbull actually imagined the Declaration committee presenting its draft to the Second Continental Congress—a useful reminder that history is built through debate before it becomes an icon.</p>
      </div>
    </section>

    <nav className="history-index" aria-label="American history chapters">
      {historyChapters.map((chapter) => <a href={`#${chapter.id}`} key={chapter.id}><span>{chapter.number}</span>{chapter.title}<small>{chapter.years}</small></a>)}
    </nav>

    <div className="history-timeline">
      {historyChapters.map((chapter) => <section className="history-chapter" id={chapter.id} key={chapter.id}>
        <aside className="chapter-heading">
          <p>{chapter.number} / {chapter.years}</p>
          <h2>{chapter.title}</h2>
          <div className="chapter-rule" />
          <p className="chapter-intro">{chapter.introduction}</p>
        </aside>
        <div className="history-grid">
          {chapter.places.map((place) => <article className="history-card" key={place.id}>
            <div className="history-card-image">
              <img src={place.image} alt={place.imageAlt} loading="lazy" />
              <span>{place.year}</span>
              <FavoriteButton item={historyFavorite(place)} className="history-card-favorite" showLabel={false} />
            </div>
            <div className="history-card-body">
              <p className="history-event">{place.event}</p>
              <h3>{place.place}</h3>
              <p className="history-location"><span>●</span>{place.location}</p>
              <p className="history-summary">{place.summary}</p>
              <div className="history-card-actions">
                <a href={place.learnUrl} target="_blank" rel="noreferrer">Read the history ↗</a>
                <a href={historyMapUrl(place.mapQuery)} target="_blank" rel="noreferrer">Find the place ↗</a>
              </div>
              <a className="history-source" href={place.imageSource} target="_blank" rel="noreferrer">Image source ↗</a>
            </div>
          </article>)}
        </div>
      </section>)}
    </div>

    <section className="history-ending">
      <p className="history-eyebrow">THE STORY IS STILL MOVING</p>
      <h2>Every place adds another<br /><em>American chapter.</em></h2>
      <p>Save the places that stay with you, then return to the atlas to choose where your own route begins.</p>
      <div><Link href="/">Return to the map →</Link><FavoritesTrigger /></div>
    </section>

    <footer className="history-footer"><span>TRAVEL IN AMERICA</span><span>History entries live in app/history/history-data.ts for easy updates.</span><span>© {new Date().getFullYear()}</span></footer>
  </main>;
}
