import React from "react";
import { Card } from "@/components/ui/card";
import { BookCard } from "@/components/BookCard";
import CloudGlow from "@/CloudGlow";

// Expect 'answers' prop from onboarding
export default function Home({ answers }) {
  // answers: { name, genres, budget, authors, age }
  return (
    <div className="min-h-screen flex flex-col items-center px-4 md:px-6 py-8 bg-transparent">
      <CloudGlow />
      <header className="w-full max-w-4xl pt-4 pb-6 text-center">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tighter mb-2">
          Book Recommender
        </h1>
        {answers?.name && (
          <div className="text-xl my-1 text-emerald-300 font-mono uppercase tracking-wide">
            Welcome, {answers.name}!
          </div>
        )}
        <p className="text-muted-foreground md:text-lg">
          Discover your next favorite book.
        </p>
      </header>
      <main className="w-full max-w-5xl flex-1 flex flex-col items-center" style={{ background: "transparent" }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5 md:gap-6 w-full pb-8">
          {/* Recommendations will go here; this is a placeholder */}
          <div className="opacity-60 col-span-full text-center py-16">
            Book recommendations personalized for you will appear here!
          </div>
        </div>
      </main>
      <footer className="opacity-70 text-xs py-4 w-full text-center mt-auto">
        &copy; {new Date().getFullYear()} Book Recommender — Minimal, dark, Material-inspired UI
      </footer>
    </div>
  );
}
