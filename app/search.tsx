import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Linking,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
} from 'react-native';

interface Author {
  name: string;
  birth_year?: number;
  death_year?: number;
}

interface BookFormats {
  "text/html"?: string;
  "application/pdf"?: string;
  "text/plain; charset=utf-8"?: string;
  "text/plain; charset=us-ascii"?: string;
  [key: string]: string | undefined;
}

interface Book {
  id: number;
  title: string;
  authors: Author[];
  subjects: string[];
  formats: BookFormats;
}

interface ReadingViewProps {
  book: Book;
  onClose: () => void;
}

const CHARS_PER_PAGE = 5000;

function ReadingView({ book, onClose }: ReadingViewProps) {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const scrollViewRef = React.useRef<ScrollView>(null);

  React.useEffect(() => {
    const fetchContent = async () => {
      try {
        const textUrl = book.formats["text/plain; charset=utf-8"] || book.formats["text/plain; charset=us-ascii"];
        if (!textUrl) {
          throw new Error("No plain text format available");
        }

        const response = await fetch(textUrl);
        const text = await response.text();
        setContent(text);
        setTotalPages(Math.ceil(text.length / CHARS_PER_PAGE));
      } catch (error) {
        console.error("Error fetching book content:", error);
        setContent("Error loading book content. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [book]);

  const getCurrentPageContent = () => {
    const start = currentPage * CHARS_PER_PAGE;
    return content.slice(start, start + CHARS_PER_PAGE);
  };

  const changePage = (newPage: number) => {
    setCurrentPage(newPage);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleBack = () => {
    // Reset all states before closing
    setContent("");
    setCurrentPage(0);
    setTotalPages(0);
    onClose();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.readingContainer}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.readingContainer}>
      <View style={styles.readingHeader}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.pageInfo}>Page {currentPage + 1} of {totalPages}</Text>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.contentContainer}
      >
        <Text style={styles.bookContent}>{getCurrentPageContent()}</Text>
      </ScrollView>

      <View style={styles.navigationButtons}>
        <TouchableOpacity
          style={[styles.navButton, currentPage === 0 && styles.navButtonDisabled]}
          onPress={() => changePage(Math.max(0, currentPage - 1))}
          disabled={currentPage === 0}
        >
          <Text style={styles.navButtonText}>Previous</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, currentPage === totalPages - 1 && styles.navButtonDisabled]}
          onPress={() => changePage(Math.min(totalPages - 1, currentPage + 1))}
          disabled={currentPage === totalPages - 1}
        >
          <Text style={styles.navButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchClicked, setSearchClicked] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  const searchBooks = async () => {
    setLoading(true);
    try {
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
      setSearchClicked(true);
    }
  };

  const renderBookItem = ({ item }: { item: Book }) => (
    <TouchableOpacity
      style={styles.bookCard}
      onPress={() => {
        const textUrl = item.formats["text/plain; charset=utf-8"] || item.formats["text/plain; charset=us-ascii"];
        if (textUrl) {
          setSelectedBook(item);
        } else {
          const readUrl = item.formats["text/html"] || item.formats["application/pdf"];
          if (readUrl) {
            Linking.openURL(readUrl);
          }
        }
      }}
    >
      <Text style={styles.bookTitle}>{item.title}</Text>
      <Text style={styles.authorText}>
        <Text style={styles.label}>Author: </Text>
        {item.authors.map(author => author.name).join(", ")}
      </Text>
      {item.subjects && (
        <Text style={styles.subjectsText} numberOfLines={2}>
          <Text style={styles.label}>Subjects: </Text>
          {item.subjects.join(", ")}
        </Text>
      )}
      <Text style={styles.readLink}>Tap to read →</Text>
    </TouchableOpacity>
  );

  if (selectedBook) {
    return <ReadingView book={selectedBook} onClose={() => setSelectedBook(null)} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        onPress={() => {
          setQuery("");
          setBooks([]);
          setSearchClicked(false);
        }}
      >
        <Text style={[styles.title, styles.clickableTitle]}>storytime...</Text>
      </TouchableOpacity>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="what would you like to read?"
          placeholderTextColor="#666"
          onSubmitEditing={searchBooks}
        />
        <TouchableOpacity
          style={[styles.searchButton, loading && styles.searchButtonDisabled]}
          onPress={searchBooks}
          disabled={loading}
        >
          <Text style={styles.searchButtonText}>
            {loading ? "Searching..." : "Search"}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
      ) : (
        <FlatList
          data={books}
          renderItem={renderBookItem}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={
            query && searchClicked ? (
              <Text style={styles.noResults}>No results found</Text>
            ) : null
          }
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e6f3ff',
    padding: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    marginTop: 12,
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    marginHorizontal: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  searchButtonDisabled: {
    opacity: 0.5,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    flexGrow: 1,
  },
  bookCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  label: {
    fontWeight: '600',
    color: '#666',
  },
  authorText: {
    fontSize: 16,
    marginBottom: 4,
    color: '#444',
  },
  subjectsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  readLink: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  loader: {
    marginTop: 20,
  },
  noResults: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 20,
  },
  clickableTitle: {
    textDecorationLine: 'none',
  },
  readingContainer: {
    flex: 1,
    backgroundColor: '#e6f3ff',
  },
  readingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingTop: 48,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  pageInfo: {
    fontSize: 14,
    color: '#666',
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  bookContent: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  navButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    width: 100,
    alignItems: 'center',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e6f3ff',
  },
}); 