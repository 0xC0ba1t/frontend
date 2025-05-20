import React from "react";
import CanvasStarfield from "@/CanvasStarfield";
import CloudGlow from "@/CloudGlow";
import * as algoliasearchNS from 'algoliasearch/lite';
import { InstantSearch, SearchBox, Hits, Pagination, Highlight, RefinementList } from 'react-instantsearch-dom';

const ALGOLIA_APP_ID = import.meta.env.VITE_ALGOLIA_APP_ID;
const ALGOLIA_SEARCH_KEY = import.meta.env.VITE_ALGOLIA_SEARCH_KEY;
const ALGOLIA_DEFAULT_INDEX = "books";

function BookHit({ hit }) {
  if (!hit) return null;
  return (
    <div className="flex flex-col px-5 py-3 rounded-xl bg-white/90 dark:bg-black/80 shadow border mb-3">
      <div className="font-semibold text-lg truncate"><Highlight attribute="title" hit={hit} tagName="mark" /></div>
      <div className="text-sm text-zinc-600 dark:text-zinc-200 mb-0.5">by <Highlight attribute="author" hit={hit} tagName="mark" /></div>
      <div className="text-xs text-zinc-500 dark:text-zinc-300 mb-1 uppercase tracking-wide"><Highlight attribute="genre" hit={hit} tagName="mark" /></div>
      <div className="flex flex-row gap-2 text-xs mt-auto">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full font-medium bg-slate-200/50 dark:bg-slate-700/70 text-slate-900 dark:text-slate-200">
          {typeof hit.cost === "number" ? `$${hit.cost.toFixed(2)}` : ""}
        </span>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full font-medium bg-slate-200/40 dark:bg-slate-700/60 text-slate-800 dark:text-slate-200">Age: {hit.age_rating}</span>
      </div>
    </div>
  );
}

export default function SearchPage() {
  try {
    if (!ALGOLIA_APP_ID || !ALGOLIA_SEARCH_KEY || ALGOLIA_APP_ID === 'your_algolia_app_id') {
      return (
        <div className="relative min-h-screen w-full bg-transparent flex flex-col items-center px-4 md:px-6 py-8">
          <CanvasStarfield />
          <CloudGlow />
          <main className="z-10 max-w-lg mx-auto flex flex-col items-center w-full pt-24 relative">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 gradient-title-shadow text-center">
              Manual Book Search
            </h1>
            <div className="p-7 mb-6 mt-3 rounded-xl border bg-white/50 dark:bg-black/40 text-black dark:text-white text-lg text-center">
              <div className="font-semibold mb-2">Algolia credentials missing</div>
              Please set <span className="font-mono">VITE_ALGOLIA_APP_ID</span> and <span className="font-mono">VITE_ALGOLIA_SEARCH_KEY</span> in your <span className="font-mono">.env</span> file.
            </div>
          </main>
        </div>
      );
    }

    // Universal ESM/CJS fallback, robust for all setups
    const searchClient = (algoliasearchNS as any).default
      ? (algoliasearchNS as any).default(ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY)
      : (algoliasearchNS as any)(ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY);

    return (
      <div className="relative min-h-screen w-full bg-transparent flex flex-col items-center px-4 md:px-6 py-8">
        <CanvasStarfield />
        <CloudGlow />
        <main className="relative z-10 max-w-4xl mx-auto flex flex-col items-center w-full pt-20">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-6 gradient-title-shadow text-center">
            Manual Book Search
          </h1>
          <InstantSearch searchClient={searchClient} indexName={ALGOLIA_DEFAULT_INDEX}>
            <div className="w-full flex flex-col md:flex-row md:items-start mb-8 gap-5">
              <div className="w-full md:w-64 flex-shrink-0">
                <div className="rounded-xl bg-white/70 dark:bg-black/40 p-3 mb-5 shadow border border-zinc-200 dark:border-zinc-800">
                  <span className="font-mono text-xs text-black/80 dark:text-white/80 block mb-2 font-bold">Filter by Genre</span>
                  <RefinementList attribute="genre" />
                </div>
                <div className="rounded-xl bg-white/70 dark:bg-black/40 p-3 shadow border border-zinc-200 dark:border-zinc-800">
                  <span className="font-mono text-xs text-black/80 dark:text-white/80 block mb-2 font-bold">Filter by Author</span>
                  <RefinementList attribute="author" />
                </div>
              </div>
              <div className="flex-1 max-w-2xl">
                <SearchBox translations={{ placeholder: 'Search for books, authors, genres...' }} autoFocus className="mb-5" />
                <Hits hitComponent={BookHit} />
                <Pagination showLast className="mt-8" />
              </div>
            </div>
          </InstantSearch>
        </main>
      </div>
    );
  } catch (err) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center text-center bg-black text-white">
        <h1 className="text-2xl font-bold mb-4">Something went wrong!</h1>
        <div className="text-lg opacity-90">{String(err)}</div>
      </div>
    );
  }
}
