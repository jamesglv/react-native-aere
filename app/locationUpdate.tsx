import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, Alert, TouchableOpacity, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native'; 
import { FIREBASE_AUTH, FIREBASE_DB } from '../firebaseConfig';
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { fetchUserData, updateUserDocument } from '../firebaseActions'; // Import the fetchUserData function
import { Location, Region } from '../constants/types'; 

const LocationUpdate = () => {
  const navigation = useNavigation();
  const currentUser = FIREBASE_AUTH.currentUser;
  
  // State for user's location and map region
  const [location, setLocation] = useState<Location | null>(null);
  const [region, setRegion] = useState<Region | null>(null); // Set initial state as null

  // Fetch user location from Firestore on mount
  useEffect(() => {
    const fetchUserLocation = async () => {
      if (!currentUser) return;
      try {
        const userData = await fetchUserData(['location']);
        
        if (userData.location) {
          const { latitude, longitude } = userData.location;
          const initialRegion = {
            latitude,
            longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          };
          setLocation({ latitude, longitude });
          setRegion(initialRegion);  // Set initial region based on database
        }
      } catch (error) {
        console.error('Error fetching user location:', error);
        Alert.alert('Error', 'Failed to load location.');
      }
    };
    fetchUserLocation();
  }, [currentUser]);

  // Save location to Firestore
  const saveLocation = async () => {
    if (!location) return;
    try {
      await updateUserDocument({ location: location }); // Update Firestore using the cloud function
      console.log('Location updated:', location);  // Log updated location
      navigation.goBack();  // Go back to the previous screen
    } catch (error) {
      console.error('Error saving location:', error);
      Alert.alert('Error', 'Failed to save location.');
    }
  };

  // Set up back button with save action
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  if (!region) {
    // Render a loading indicator while fetching the region data
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Custom back button */}
      <TouchableOpacity style={styles.backButton} onPress={saveLocation}>
        <Ionicons name="chevron-back" size={24} color="#fff" />
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>

      {/* Map with draggable marker */}
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={(newRegion) => {
          setRegion(newRegion);
          setLocation({ latitude: newRegion.latitude, longitude: newRegion.longitude });
          console.log('Location changed:', newRegion);  // Log the region change
        }}
      >
        <Marker
          coordinate={{ latitude: region.latitude, longitude: region.longitude }}
          draggable
          onDragEnd={(e) => {
            const newCoordinate = e.nativeEvent.coordinate;
            setLocation(newCoordinate);
            console.log('Marker dragged to:', newCoordinate);  // Log marker drag event
          }}
        />
      </MapView>
    </View>
  );
};

// Styles for the map and back button
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 10,
    borderRadius: 25,
    zIndex: 10,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 5,
  },
  map: {
    flex: 1,
  },
});

export default LocationUpdate;
