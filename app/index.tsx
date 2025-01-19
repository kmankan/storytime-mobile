import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Linking,
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
  download_count: number;
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

export default function DiscoverScreen() {
  const [popularBooks, setPopularBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  useEffect(() => {
    fetchPopularBooks();
  }, []);

  const fetchPopularBooks = async () => {
    try {
      const response = await fetch('https://gutendex.com/books/?sort=popular');
      const data = await response.json();
      setPopularBooks(data.results.slice(0, 20));
    } catch (error) {
      console.error('Error fetching popular books:', error);
    } finally {
      setLoading(false);
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
        <Text style={styles.label}>By: </Text>
        {item.authors.map(author => author.name).join(', ')}
      </Text>
      <Text style={styles.downloadCount}>
        <Text style={styles.label}>Downloads: </Text>
        {item.download_count.toLocaleString()}
      </Text>
      <Text style={styles.readLink}>Tap to read →</Text>
    </TouchableOpacity>
  );

  if (selectedBook) {
    return <ReadingView book={selectedBook} onClose={() => setSelectedBook(null)} />;
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>most popular books</Text>
      <FlatList
        data={popularBooks}
        renderItem={renderBookItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 16,
    color: '#333',
  },
  listContainer: {
    padding: 16,
  },
  bookCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'black',
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
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  authorText: {
    fontSize: 16,
    marginBottom: 4,
    color: '#444',
  },
  downloadCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  label: {
    fontWeight: '600',
    color: '#666',
  },
  readLink: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  readingContainer: {
    flex: 1,
    backgroundColor: '#fff',
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
});
