"use client";

import { useState } from "react";

interface Author {
  name: string;
  birth_year?: number;
  death_year?: number;
}

interface BookFormats {
  "text/html"?: string;
  "application/pdf"?: string;
  [key: string]: string | undefined;
}

interface Book {
  id: number;
  title: string;
  authors: Author[];
  subjects: string[];
  formats: BookFormats;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);

  const searchBooks = async () => {
    setLoading(true);
    try {
      // Search for books using the Gutendex API
      const response = await fetch(`https://gutendex.com/books/?search=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        setBooks(data.results.slice(0, 10));
      } else {
        setBooks([]);
      }
    } catch (error) {
      console.error("Error searching books:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 text-center">find a story...</h1>

      <div className="flex gap-2 mb-8">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="something funny and light hearted"
          className="flex-1 p-2 border rounded"
          onKeyDown={(e) => e.key === "Enter" && searchBooks()}
        />
        <button
          onClick={searchBooks}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      <div className="space-y-4">
        {!loading && query && (
          books.length > 0
            ? books.map((book) => (
              <div key={book.id} className="border rounded p-4">
                <h2 className="text-2xl font-bold mb-2">{book.title}</h2>
                <p className="mb-2">
                  <span className="font-semibold">Author:</span>{" "}
                  {book.authors.map((author) => author.name).join(", ")}
                </p>
                {book.subjects && (
                  <p className="mb-2">
                    <span className="font-semibold">Subjects:</span>{" "}
                    {book.subjects.join(", ")}
                  </p>
                )}
                <a
                  href={book.formats["text/html"] || book.formats["application/pdf"]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  Read Book
                </a>
              </div>
            ))
            : <p className="text-center text-gray-500">No books found</p>
        )}
      </div>
    </main>
  );
}
