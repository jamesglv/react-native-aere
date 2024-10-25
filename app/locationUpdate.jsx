import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, Alert, TouchableOpacity, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native'; 
import { FIREBASE_AUTH, FIREBASE_DB } from '../firebaseConfig';
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

const LocationUpdate = () => {
  const navigation = useNavigation();
  const currentUser = FIREBASE_AUTH.currentUser;
  
  // State for user's location and map region
  const [location, setLocation] = useState(null);
  const [region, setRegion] = useState(null); // Set initial state as null

  // Fetch user location from Firestore on mount
  useEffect(() => {
    const fetchUserLocation = async () => {
      if (!currentUser) return;
      try {
        const userDocRef = doc(FIREBASE_DB, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
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
      await updateDoc(doc(FIREBASE_DB, 'users', currentUser.uid), {
        location: location,
      });
      console.log('Location updated:', location);  // Log updated location
      //Alert.alert('Location updated successfully!');
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
