import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Dimensions, Image } from 'react-native';
import { FIREBASE_DB, FIREBASE_AUTH } from '../../firebaseConfig';  // Firestore and Firebase Auth config
import { doc, getDoc } from 'firebase/firestore';  // Firestore functions
import { useRouter, useFocusEffect } from 'expo-router';  // Use expo-router for navigation and focus effect

const { width } = Dimensions.get('window');  // Get screen width for layout

const Chats = () => {
  const [matches, setMatches] = useState([]);  // Store the matched users' profiles
  const currentUserId = FIREBASE_AUTH.currentUser?.uid;  // Get the logged-in user's ID
  const router = useRouter();  // For navigation

  // Function to fetch matched users
  const fetchMatches = async () => {
    try {
      const userDocRef = doc(FIREBASE_DB, 'users', currentUserId);
      const userSnapshot = await getDoc(userDocRef);
  
      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        const matchIds = userData.matches || [];  // Get the matches array or empty if none
  
        const matchProfiles = await Promise.all(
          matchIds.map(async (matchId) => {
            const matchDocRef = doc(FIREBASE_DB, 'matches', matchId);
            const matchDocSnapshot = await getDoc(matchDocRef);
  
            if (matchDocSnapshot.exists()) {
              const matchData = matchDocSnapshot.data();
              const usersInMatch = matchData.users || [];
  
              // Find the user in the match that is not the logged-in user
              const otherUserId = usersInMatch.find((id) => id !== currentUserId);
  
              if (otherUserId) {
                const otherUserDocRef = doc(FIREBASE_DB, 'users', otherUserId);
                const otherUserSnapshot = await getDoc(otherUserDocRef);
  
                if (otherUserSnapshot.exists()) {
                  // Return the other user's profile with the matchId
                  return { id: otherUserId, matchId, ...otherUserSnapshot.data() };
                }
              }
            }
            return null;  // If no data found for the match or user
          })
        );
  
        setMatches(matchProfiles.filter((profile) => profile !== null));
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
    }
  };

  // useFocusEffect to refetch the matches when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchMatches();  // Refetch data when screen is focused
    }, [])
  );

  // Render each match item with a profile picture, name, and message preview
const renderMatch = ({ item }) => (
  <TouchableOpacity
    style={styles.matchItem}
    onPress={() => {
      if (item.matchId && item.name && item.photos && item.photos.length > 0) {

        const encodedPhotoUrl = encodeURIComponent(item.photos[0]);  // Ensure the URL is encoded

        console.log('Encoded Photo URL:', encodedPhotoUrl); 

        router.push({
          pathname: '/chat',
          params: {
            matchId: item.matchId,  // Now matchId should be correctly passed
            name: item.name,
            photo: encodedPhotoUrl,  // Pass the URL-encoded photo
          },
        });

      } else {
        console.error('Missing parameters:', { matchId: item.matchId, name: item.name, photos: item.photos });
      }
    }}
  >
    <Image
      source={{ uri: item.photos[0] }}  // Assuming the first photo is the profile photo
      style={styles.profileImage}
    />
    <View>
      <Text style={styles.matchName}>{item.name}</Text>
      {/* Display messagePreview or "Start a conversation" */}
      <Text style={styles.messagePreview}>
        {item.messagePreview && item.messagePreview.trim() !== '' ? item.messagePreview : 'Start a conversation'}
      </Text>
    </View>
  </TouchableOpacity>
);  

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chats</Text>
      {matches.length > 0 ? (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.id}
          renderItem={renderMatch}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <Text style={styles.noMatchesText}>No matches found.</Text>
      )}
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  },
  listContent: {
    justifyContent: 'space-between',
  },
  matchItem: {
    flexDirection: 'row',  // Align image and text side by side
    alignItems: 'center',  // Vertically center align the text and image
    width: '100%',  // Full width of the screen
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  profileImage: {
    width: 40,  // Set the width and height of the circular image
    height: 40,
    borderRadius: 20,  // Make the image circular
    marginRight: 15,  // Add space between image and text
  },
  matchName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  noMatchesText: {
    fontSize: 18,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default Chats;
