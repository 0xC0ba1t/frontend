import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import * as React from "react";
import CanvasStarfield from "./CanvasStarfield";
import CloudGlow from "./CloudGlow";

// --- Book and API logic ---
interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  description: string;
}

// API endpoint placeholder (set to your Python backend's URL)
const API_URL = "http://localhost:8000/api/recommendations"; // <-- Change to your backend

function useRecommendations() {
  const [loading, setLoading] = React.useState(false);
  const [books, setBooks] = React.useState<Book[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => {
    setLoading(true);
    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then(setBooks)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  return { books, loading, error };
}

// -- Main App --

function App() {
  const { books, loading, error } = useRecommendations();

  return (
    <>
      {/* Canvas background starfield always at root */}
      <CanvasStarfield />
      <div
        className="min-h-screen flex flex-col items-center px-2"
        style={{ background: "transparent", boxShadow: "none" }}
      >
        <CloudGlow />
        <header className="w-full max-w-2xl pt-8 pb-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tighter mb-2">
            Book Recommender
          </h1>
          <p className="text-muted-foreground md:text-lg">
            Discover your next favorite book.
          </p>
        </header>
        <main
          className="w-full max-w-2xl flex-1 flex flex-col items-center"
          style={{ background: "transparent" }}
        >
          {/* (optional) Search bar placeholder */}
          {/* <div className="mb-4 w-full flex justify-center">
            <Input placeholder="Search books..." className="max-w-md rounded-full bg-card/80 focus:bg-background" />
          </div> */}
          {loading && (
            <div className="py-24 text-lg">Loading recommendations...</div>
          )}
          {error && <div className="text-destructive py-16">{error}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full pb-8">
            {books.length === 0 && !loading && !error && (
              <div className="opacity-60 col-span-2 text-center py-16">
                No recommendations yet.
              </div>
            )}
            {books.map((book) => (
              <Card
                key={book.id}
                className="bg-card/80 rounded-3xl p-5 flex flex-col gap-4 shadow-lg border-none hover:scale-[1.03] transition-all cursor-pointer overflow-hidden relative"
                style={{
                  boxShadow:
                    "0 4px 32px 0 rgba(0,0,0,0.22), 0 1.5px 14px 0 rgba(60,60,60,0.18)",
                  borderRadius: "1.25rem",
                  background: "rgba(24,24,34,0.9)",
                }}
              >
                {/* Curved Avatar cover image */}
                <div className="flex flex-row gap-4 items-center">
                  <Avatar className="rounded-2xl w-16 h-20 bg-muted overflow-hidden border border-border">
                    <img
                      src={book.coverUrl}
                      alt={book.title}
                      className="object-cover w-full h-full rounded-2xl"
                      onError={(e) =>
                        (e.currentTarget.src =
                          "https://same-assets.com/placeholder/book-dark.svg")
                      }
                    />
                  </Avatar>
                  <div>
                    <div className="font-semibold text-lg leading-5 mb-1 truncate">
                      {book.title}
                    </div>
                    <div className="text-muted-foreground text-sm mb-2">
                      {book.author}
                    </div>
                  </div>
                </div>
                <div className="text-muted-foreground text-sm line-clamp-3 mt-1">
                  {book.description}
                </div>
              </Card>
            ))}
          </div>
        </main>
        <footer className="opacity-70 text-xs py-4 w-full text-center mt-auto">
          &copy; {new Date().getFullYear()} Book Recommender — Minimal, dark, Material-inspired UI
        </footer>
      </div>
    </>
  );
}

export default App;
