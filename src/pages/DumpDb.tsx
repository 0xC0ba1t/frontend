import React, { useEffect, useState } from "react";
import { BookCard } from "@/components/BookCard";

interface Book {
  id: number;
  title: string;
  author: string;
  cost: number;
  genre: string;
  age_rating: string;
  coverUrl?: string;
  description?: string;
}

export default function DumpDb() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("https://8000-01jtrkrgvb5brn7hg3gkn1gyv1.cloudspaces.litng.ai/dump-db?password=")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data.books)) setBooks(data.books);
        else throw new Error("Invalid response");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center px-4 md:px-6 py-8 bg-transparent">
      <h1 className="text-3xl font-bold mb-2 tracking-tight">Database Books</h1>
      <div className="text-muted-foreground mb-7">All books currently in the database.</div>

      {loading && (
        <div className="flex items-center justify-center py-24 text-lg">
          Loading...
        </div>
      )}

      {error && (
        <div className="text-destructive py-6 text-center">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-5xl">
        {books.map((book, i) => (
          <BookCard key={book.id} book={book} index={i} />
        ))}

        {!loading && books.length === 0 && !error && (
          <div className="opacity-60 py-8 text-center col-span-full">
            No books in the database.
          </div>
        )}
      </div>
    </div>
  );
}
