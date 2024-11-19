import React from 'react';
import { View, Text, StyleSheet, Button, Image } from 'react-native';

export default function HomeScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Image
        source={{ uri: 'https://via.placeholder.com/150' }} // Replace with your logo or illustration
        style={styles.logo}
      />
      <Text style={styles.title}>Welcome to Aether</Text>
      <Text style={styles.subtitle}>Authenticate and Explore Art</Text>
      <View style={styles.buttonContainer}>
        <Button
          title="Scan Tag"
          onPress={() => navigation.navigate('Scan Tag')}
          color="#007AFF" // Soft blue
        />
        <Button
          title="Explore Artworks"
          onPress={() => navigation.navigate('Explore')}
          color="#D9534F" // Matte red
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EDEEEF', // Light gray
    padding: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8E8E93', // Dark gray
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 30,
  },
  buttonContainer: {
    width: '100%',
    marginTop: 20,
    gap: 10,
  },
});
