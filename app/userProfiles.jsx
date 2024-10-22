import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FIREBASE_DB, FIREBASE_AUTH } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';  // Import icons
import { useNavigation } from '@react-navigation/native';  // Use navigation hook


const { width, height } = Dimensions.get('window');

const UserProfiles = () => {
  const { userId } = useLocalSearchParams();  // Get the userId from the route parameters
  const router = useRouter();  // Router to navigate back
  const currentUserId = FIREBASE_AUTH.currentUser.uid;  // Get the logged-in user's ID
  const [user, setUser] = useState(null);
  const navigation = useNavigation();  // Access navigation


  // Remove default header bar by setting options in useLayoutEffect
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,  // Hide the default header bar
    });
  }, [navigation]);

  // Fetch the profile data of the liked user
  useEffect(() => {
    const fetchUser = async () => {
      const userDocRef = doc(FIREBASE_DB, 'users', userId);
      const userSnapshot = await getDoc(userDocRef);
      if (userSnapshot.exists()) {
        setUser(userSnapshot.data());
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId]);

  if (!user) {
    return <Text style={styles.errorText}>Loading user data...</Text>;
  }

  return (
    <ScrollView style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Photos Carousel */}
      <ScrollView horizontal pagingEnabled style={styles.photosContainer}>
        {user.photos && user.photos.length > 0 ? (
          user.photos.map((photo, index) => (
            <Image key={index} source={{ uri: photo }} style={styles.photo} />
          ))
        ) : (
          <View style={styles.noPhotosContainer}>
            <Text style={styles.noPhotosText}>No Photos Available</Text>
          </View>
        )}
      </ScrollView>

      {/* User Information */}
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{user.name}, {user.age}</Text>
        <Text style={styles.bio}>{user.bio}</Text>
      </View>
    </ScrollView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  backButton: {
    position: 'absolute',
    top: 40,  // Adjust based on where you want the button to appear
    left: 20, // Adjust based on your design
    backgroundColor: 'rgba(0, 0, 0, 0.5)',  // Semi-transparent background
    padding: 10,
    borderRadius: 20,  // Circular button
    zIndex: 10,  // Ensure the button is above all other content
  },
  photosContainer: {
    width: width,
    height: height * 0.5,  // 50% of the screen height for the photo carousel
  },
  photo: {
    width: width,
    height: '100%',  // Full height of the container
    resizeMode: 'cover',  // Maintain aspect ratio and cover the area
  },
  noPhotosContainer: {
    width: width,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noPhotosText: {
    fontSize: 18,
    color: '#aaa',
  },
  infoContainer: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: -20,  // Slight overlap with the photos
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  bio: {
    fontSize: 16,
    color: '#1c1c1e',
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default UserProfiles;
