import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, Image, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { FIREBASE_DB, FIREBASE_AUTH } from '../../firebaseConfig';  // Firestore and Firebase Auth config
import { doc, getDoc } from 'firebase/firestore';  // Firestore functions
import { useRouter, useFocusEffect } from 'expo-router';  // Expo Router for navigation and focus effect
import { fetchReceivedLikes } from '../../firebaseActions'; // Import the fetchReceivedLikes function
import { height } from '@fortawesome/free-solid-svg-icons/faHeart';

const { width } = Dimensions.get('window');  // Get screen width for layout

const Likes = () => {
  const [receivedLikes, setReceivedLikes] = useState([]);  // Store the profiles that liked the current user
  const currentUserId = FIREBASE_AUTH.currentUser?.uid;  // Get the logged-in user's ID
  const router = useRouter();  // Use router from Expo Router

  // Function to fetch received likes via Firebase Function
  const fetchAndSetReceivedLikes = async () => {
    try {
      const likesData = await fetchReceivedLikes();
      setReceivedLikes(likesData);
    } catch (error) {
      console.error("Error fetching received likes:", error.message, error.code, error.details);
    }
  };

  // useFocusEffect to refetch the likes when the screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchAndSetReceivedLikes();  // Refetch data when screen is focused
    }, [])
  );

  // Render each received like as a square with the user's photo and name
  const renderLike = ({ item }) => (
    <TouchableOpacity 
      style={styles.likeContainer}
      onPress={() => router.push({ pathname: '/likeProfiles', params: { userId: item.id } })}  // Navigate to Profile screen with userId
    >
      <Image source={{ uri: item.photos[0] }} style={styles.likeImage} />
      <View style={styles.overlay}>
        <Text style={styles.likeName}>{item.name}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title} className='font-oregular'>Likes</Text>
      {receivedLikes.length === 0 ? (  // Check if there are no likes
        <View style={styles.noLikesContainer}>
          <Image source={require('../../assets/images/rose.jpg')} style={{ width: width * 0.6, height: width * 0.6, opacity: 0.5 }} />
          <Text style={styles.noLikesText}>No likes yet.</Text>
          <Text style={styles.noLikesText}>Don't worry! They'll show up soon.</Text>

        </View>
      ) : (
        <FlatList
          data={receivedLikes}
          keyExtractor={(item) => item.id}
          numColumns={2}  // Set two columns for grid layout
          renderItem={renderLike}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  title: {
    fontSize: 28,
    textAlign: 'center',
    marginVertical: 20,
    paddingTop: 35,
  },
  listContent: {
    justifyContent: 'space-between',
  },
  likeContainer: {
    width: width * 0.4,  // Approximately 40% of the screen width
    margin: width * 0.025,  // Add some margin for spacing between squares
    aspectRatio: 1,  // Make the container a square
    borderRadius: 10,
    overflow: 'hidden',  // Ensure the image and overlay stay within the square
  },
  likeImage: {
    width: '100%',
    height: '100%',  // Take up the full square
    resizeMode: 'cover',  // Ensure the image covers the container
  },
  overlay: {
    position: 'absolute',
    bottom: 0,  // Position the overlay at the bottom of the image
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',  // Semi-transparent background
    paddingVertical: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  likeName: {
    color: '#fff',  // White text to stand out on the dark overlay
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  noLikesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noLikesText: {
    fontSize: 18,
    color: '#999',
    textAlign: 'center',
  },
});

export default Likes;
