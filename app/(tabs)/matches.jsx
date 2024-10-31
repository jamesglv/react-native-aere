import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Image, Alert, StatusBar } from 'react-native';
import { FIREBASE_DB, FIREBASE_AUTH } from '../../firebaseConfig';  // Firestore and Firebase Auth config
import { doc, getDoc, updateDoc, arrayRemove } from 'firebase/firestore';  // Firestore functions
import { useRouter, useFocusEffect } from 'expo-router';  // Use expo-router for navigation and focus effect
import { SwipeListView } from 'react-native-swipe-list-view';  // Import SwipeListView
import { Ionicons } from '@expo/vector-icons';  // Import Ionicons (or FontAwesome if you prefer)
import { fetchMatches, deleteMatch, updateReadStatus } from '../../firebaseActions'; // Import your fetchMatches function


const { width } = Dimensions.get('window');  // Get screen width for layout

const Chats = () => {
  const [matches, setMatches] = useState([]);  // Store the matched users' profiles
  const currentUserId = FIREBASE_AUTH.currentUser?.uid;  // Get the logged-in user's ID
  const router = useRouter();  // For navigation

  // Function to fetch matched users via Firebase Function
  const fetchAndSetMatches = async () => {
    try {
      const matchData = await fetchMatches();
      setMatches(matchData);
    } catch (error) {
      console.error("Error fetching matches:", error);
    }
  };

  // useFocusEffect to refetch the matches when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchAndSetMatches();  // Refetch data when screen is focused
    }, [])
  );

  const handleDeleteMatch = async (matchId) => {
    try {
      const result = await deleteMatch(matchId);
      if (result.success) {
        setMatches((prevMatches) => prevMatches.filter((match) => match.matchId !== matchId));
        Alert.alert('Match deleted successfully');
      } else {
        Alert.alert('Failed to delete match');
      }
    } catch (error) {
      console.error("Error deleting match:", error);
      Alert.alert("An error occurred while deleting the match.");
    }
  };

  const handleUpdateReadStatus = async (matchId) => {
    try {
      const result = await updateReadStatus(matchId);
      if (!result.success) {
        console.error("Failed to update read status");
      }
    } catch (error) {
      console.error("Error updating read status:", error);
    }
  };

  // Render each match item
  const renderMatch = ({ item }) => {
    // Ensure the readStatus exists and includes the current user's ID, defaulting to true if not found
    const isUnread = item.readStatus && item.readStatus[currentUserId] === false;
  
    return (
      <TouchableOpacity
        style={styles.matchItem}
        activeOpacity={1}
        onPress={async () => {
          try {
            await handleUpdateReadStatus(item.matchId);
            router.push({
              pathname: '/chat',
              params: {
                matchId: item.matchId,
                name: item.name,
                photo: encodeURIComponent(item.photos[0]),
                id: item.id,
              },
            });
          } catch (error) {
            console.error("Error navigating to chat:", error);
          }
        }}
      >
        <Image source={{ uri: item.photos[0] }} style={styles.profileImage} />
        <View>
          <View style={styles.nameContainer}>
            <Text style={styles.matchName}>{item.name}</Text>
            {isUnread && <View style={styles.blueDot} />}
          </View>
          <Text style={styles.messagePreview}>
            {item.messagePreview || "Start a conversation"}
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
      <StatusBar hidden={false} />
      <Text style={styles.title}>Matches</Text>
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
    paddingTop: 30,
  },
  matchItem: {
    flexDirection: 'row',  // Align image and text side by side
    alignItems: 'center',  // Vertically center align the text and image
    width: '100%',  // Full width of the screen
    padding: 15,
    backgroundColor: '#fff',
    //marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    height: 80,  // Ensure fixed height for both match item and hidden item
  },
  profileImage: {
    width: 60,  // Set the width and height of the circular image
    height: 60,
    borderRadius: 30,  // Make the image circular
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
