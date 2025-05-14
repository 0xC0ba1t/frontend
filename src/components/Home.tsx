import React, { useEffect, useState } from "react";
import { BookCard } from "@/components/BookCard";
import CloudGlow from "@/CloudGlow";

interface Book {
  id: number;
  title: string;
  author: string;
  cost: number;
  genre: string;
  age_rating: string;
  description?: string;
}

interface HomeProps {
  answers?: any;
  userId: string;
}

export default function Home({ answers, userId }: HomeProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    fetch(
      `https://8000-01jtrkrgvb5brn7hg3gkn1gyv1.cloudspaces.litng.ai/recommend-books?user_id=${userId}`
    )
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch books");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data.recommended_books)) setBooks(data.recommended_books);
        else if (Array.isArray(data.books)) setBooks(data.books);
        else if (Array.isArray(data)) setBooks(data);
        else throw new Error("Invalid response");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <div className="min-h-screen flex flex-col items-center px-4 md:px-6 py-8 bg-transparent">
      <CloudGlow />
      <header className="w-full max-w-4xl pt-4 pb-6 text-center">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tighter mb-2">
          Book Recommender
        </h1>
        {answers?.name && (
          <div className="text-xl my-1 text-emerald-300 font-mono uppercase tracking-wide flex items-center justify-center gap-2">
            Welcome, {answers.name}!
            <button
              className="ml-2 p-1 rounded-full hover:bg-white/10 transition-colors"
              style={{ display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle' }}
              title="Edit your preferences"
              aria-label="Edit preferences"
              onClick={() => {
                document.cookie = 'user_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                window.location.reload();
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
            </button>
          </div>
        )}
        <p className="text-muted-foreground md:text-lg">
          Discover your next favorite book.
        </p>
      </header>
      <main className="w-full max-w-5xl flex-1 flex flex-col items-center" style={{ background: "transparent" }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5 md:gap-6 w-full pb-8">
          {loading ? (
            <div className="opacity-70 col-span-full py-24 text-center text-lg">
              Loading recommendations...
            </div>
          ) : error ? (
            <div className="text-destructive col-span-full py-16 text-center">
              {error}
            </div>
          ) : books.length > 0 ? (
            books.map((book, i) => (
              <BookCard key={book.id} book={book} index={i} />
            ))
          ) : (
            <div className="opacity-60 col-span-full text-center py-16">
              No recommendations found.
            </div>
          )}
        </div>
      </main>
      <footer className="opacity-70 text-xs py-4 w-full text-center mt-auto">
        &copy; {new Date().getFullYear()} Book Recommender — Minimal, dark, Material-inspired UI
      </footer>
    </div>
  );
}
