import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

export default function FavouritesScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>My Favourites</Text>
      <View style={styles.content}>
        <Text style={styles.message}>
          Your favourite books will appear here.
        </Text>
        <Text style={styles.submessage}>
          Save books while browsing to access them quickly later.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 16,
    color: '#333',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  message: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  submessage: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
}); 