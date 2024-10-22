import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Image, Alert } from 'react-native';
import { FIREBASE_DB, FIREBASE_AUTH } from '../../firebaseConfig';  // Firestore and Firebase Auth config
import { doc, getDoc, updateDoc, arrayRemove } from 'firebase/firestore';  // Firestore functions
import { useRouter, useFocusEffect } from 'expo-router';  // Use expo-router for navigation and focus effect
import { SwipeListView } from 'react-native-swipe-list-view';  // Import SwipeListView
import { Ionicons } from '@expo/vector-icons';  // Import Ionicons (or FontAwesome if you prefer)

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
              const messagePreview = matchData.messagePreview || '';  // Get messagePreview or empty string
              const lastMessage = matchData.lastMessage || 0;  // Get the last message timestamp
              const readStatus = matchData.read || {};  // Get the read status for both users
    
              console.log(readStatus);
              // Find the user in the match that is not the logged-in user
              const otherUserId = usersInMatch.find((id) => id !== currentUserId);
    
              if (otherUserId) {
                const otherUserDocRef = doc(FIREBASE_DB, 'users', otherUserId);
                const otherUserSnapshot = await getDoc(otherUserDocRef);
    
                if (otherUserSnapshot.exists()) {
                  return {
                    id: otherUserId,
                    matchId,
                    messagePreview,
                    lastMessage,  // Include the timestamp for sorting
                    readStatus,   // Include the read status map
                    ...otherUserSnapshot.data(),
                  };
                }
              }
            }
            return null;  // If no data found for the match or user
          })
        );
    
        // Sort the matchProfiles by lastMessage in descending order
        const sortedMatches = matchProfiles
          .filter((profile) => profile !== null)
          .sort((a, b) => b.lastMessage - a.lastMessage);  // Most recent first
    
        setMatches(sortedMatches);  // Update the matches state with sorted data
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

  // Function to handle deletion of a match
  const handleDeleteMatch = async (matchId) => {
    try {
      // Remove the match from the user's matches array
      const userDocRef = doc(FIREBASE_DB, 'users', currentUserId);
      await updateDoc(userDocRef, {
        matches: arrayRemove(matchId)
      });
      
      setMatches((prevMatches) => prevMatches.filter((match) => match.matchId !== matchId));  // Update UI
      Alert.alert('Match deleted');
    } catch (error) {
      console.error('Error deleting match:', error);
    }
  };

  // Render each match item
  const renderMatch = ({ item }) => {
    // Ensure the readStatus exists and includes the current user's ID, defaulting to true if not found
    const isUnread = item.readStatus && item.readStatus[currentUserId] === false;
  
    // Function to update read status for current user
    const updateReadStatus = async () => {
      try {
        const matchDocRef = doc(FIREBASE_DB, 'matches', item.matchId);
        await updateDoc(matchDocRef, {
          [`read.${currentUserId}`]: true,  // Set the current user's read status to true
        });
      } catch (error) {
        console.error('Error updating read status:', error);
      }
    };
  
    return (
      <TouchableOpacity
        style={styles.matchItem}
        activeOpacity={1}  // Prevent transparency effect when touched
        onPress={async () => {
          try {
            // Update read status first
            await updateReadStatus();
  
            // Then navigate to the chat screen
            if (item.matchId && item.name && item.photos && item.photos.length > 0) {
              const encodedPhotoUrl = encodeURIComponent(item.photos[0]);  // Ensure the URL is encoded
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
          } catch (error) {
            console.error('Error navigating to chat:', error);
          }
        }}
      >
        <Image
          source={{ uri: item.photos[0] }}  // Assuming the first photo is the profile photo
          style={styles.profileImage}
        />
        <View>
          <View style={styles.nameContainer}>
            <Text style={styles.matchName}>{item.name}</Text>
            {/* Conditionally render the blue dot */}
            {isUnread && <View style={styles.blueDot} />}
          </View>
          <Text style={styles.messagePreview}>
            {item.messagePreview && item.messagePreview.trim() !== '' ? item.messagePreview : 'Start a conversation'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };  
  
  // Function to render the hidden item
  const renderHiddenItem = (data) => (
    <View style={styles.hiddenItemContainer}>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteMatch(data.item.matchId)}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="trash-outline" size={24} color="#fff" />
        </View>
      </TouchableOpacity>
    </View>
);
   

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chats</Text>
      {matches.length > 0 ? (
        <SwipeListView
          data={matches}
          renderItem={renderMatch}
          renderHiddenItem={renderHiddenItem}  // Attach the hidden delete button
          leftOpenValue={0}
          rightOpenValue={-75}  // The distance to swipe before the delete button appears
          disableRightSwipe  // Disable the swipe to right
          contentContainerStyle={styles.listContent}
          keyExtractor={(item) => item.id}
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
  matchItem: {
    flexDirection: 'row',  // Align image and text side by side
    alignItems: 'center',  // Vertically center align the text and image
    width: '100%',  // Full width of the screen
    padding: 15,
    backgroundColor: '#fff',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    height: 80,  // Ensure fixed height for both match item and hidden item
  },
  profileImage: {
    width: 40,  // Set the width and height of the circular image
    height: 40,
    borderRadius: 20,  // Make the image circular
    marginRight: 15,  // Add space between image and text
  },
  nameContainer: {
    flexDirection: 'row',  // Align the name and the blue dot in a row
    alignItems: 'center',  // Vertically center the name and the blue dot
  },
  matchName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  blueDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'blue',
    marginLeft: 8,  // Add some space between the name and the blue dot
  },
  messagePreview: {
    color: '#999',
  },
  // The hidden container now matches the height of the match item
  hiddenItemContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    backgroundColor: 'red',
    paddingLeft: 20,
    height: 80,  // Set the same height as the match item
  },
  deleteButton: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',  // Full height of the container
    width: '100%',   // Full width of the screen
    flexDirection: 'row',  // Align the icon horizontally within the button
  },
  iconContainer: {
    flex: 1,  // Fill the available space
    flexDirection: 'row',  // Set horizontal layout
    justifyContent: 'flex-end',  // Align the icon to the right
    paddingRight: 25,  // Add some padding to the right for spacing
  },
  noMatchesText: {
    fontSize: 18,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default Chats;
