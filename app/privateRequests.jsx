import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, Image } from 'react-native';
import { FIREBASE_DB, FIREBASE_AUTH } from '../firebaseConfig'; // Firebase config
import { doc, getDoc, updateDoc, arrayRemove, arrayUnion } from 'firebase/firestore'; // Firestore functions
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';  // Use navigation hook
import { Ionicons } from '@expo/vector-icons';  // Icon library for back button
import { TransitionPresets } from '@react-navigation/stack'; // Import Transition Presets

const PrivateRequests = () => {
  const [requests, setRequests] = useState([]); // List of private access requests
  const [accepted, setAccepted] = useState([]); // List of accepted users
  const [isLoading, setIsLoading] = useState(true); // Loading state for fetching data
  const [userDetails, setUserDetails] = useState({}); // Store user names and photos for UIDs
  const currentUser = FIREBASE_AUTH.currentUser; // Get current user
  const router = useRouter(); // Navigation
  const navigation = useNavigation();  // Access navigation

  // Remove default header bar by setting options in useLayoutEffect
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,  // Hide the default header bar
      gestureDirection: 'horizontal-inverted', // Swipes from left to right
    });
  }, [navigation]);

  // Function to fetch private requests and accepted users
  const fetchPrivateRequests = async () => {
    if (!currentUser) return;

    try {
      setIsLoading(true); // Start loading

      const userDocRef = doc(FIREBASE_DB, 'users', currentUser.uid);
      const userSnapshot = await getDoc(userDocRef);

      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        const privateRequests = userData.privateRequests || [];
        const privateAccepted = userData.privateAccepted || [];

        await fetchUserNamesAndPhotos([...privateRequests, ...privateAccepted]);

        setRequests(privateRequests);
        setAccepted(privateAccepted);
      } else {
        Alert.alert('Error', 'User data not found.');
      }
    } catch (error) {
      console.error('Error fetching private requests:', error);
      Alert.alert('Error', 'Failed to load private requests.');
    } finally {
      setIsLoading(false); // Always stop loading
    }
  };

  // Function to fetch user names and photos from Firestore based on their UID
  const fetchUserNamesAndPhotos = async (uids) => {
    const userDetailsTemp = { ...userDetails };
    const uniqueUids = [...new Set(uids)];

    try {
      await Promise.all(
        uniqueUids.map(async (uid) => {
          if (!userDetailsTemp[uid]) {
            const userDocRef = doc(FIREBASE_DB, 'users', uid);
            const userSnapshot = await getDoc(userDocRef);

            if (userSnapshot.exists()) {
              const userData = userSnapshot.data();
              const photos = userData.photos[0] || 'https://placekitten.com/200/200'; // Fallback photo
              userDetailsTemp[uid] = {
                name: userData.name || 'Unknown User', 
                photos,  // Store the first photo in the user details
              };
            } else {
              console.warn(`No user document found for UID: ${uid}`);
            }
          }
        })
      );
    } catch (error) {
      console.error("Error fetching user names and photos:", error);
    }

    setUserDetails(userDetailsTemp);
  };

  useEffect(() => {
    fetchPrivateRequests(); // Fetch requests and accepted users on mount
  }, []);

  // Function to accept a request
  const handleAccept = async (userId) => {
    try {
      const userDocRef = doc(FIREBASE_DB, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        privateRequests: arrayRemove(userId), // Remove from requests
        privateAccepted: arrayUnion(userId),  // Add to accepted
      });

      setRequests((prevRequests) => prevRequests.filter((id) => id !== userId)); // Update UI
      setAccepted((prevAccepted) => [...prevAccepted, userId]);
    } catch (error) {
      console.error('Error accepting request:', error);
      Alert.alert('Error', 'Failed to accept the request.');
    }
  };

  // Function to delete a request
  const handleDelete = async (userId) => {
    try {
      const userDocRef = doc(FIREBASE_DB, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        privateRequests: arrayRemove(userId), // Remove from requests
      });

      setRequests((prevRequests) => prevRequests.filter((id) => id !== userId)); // Update UI
    } catch (error) {
      console.error('Error deleting request:', error);
      Alert.alert('Error', 'Failed to delete the request.');
    }
  };

  // Function to remove an accepted user
const handleRemove = async (userId) => {
  try {
    const userDocRef = doc(FIREBASE_DB, 'users', currentUser.uid);
    await updateDoc(userDocRef, {
      privateAccepted: arrayRemove(userId),  // Remove the user from accepted requests
    });

    setAccepted((prevAccepted) => prevAccepted.filter((id) => id !== userId));  // Update UI to remove the user
  } catch (error) {
    console.error('Error removing accepted user:', error);
    Alert.alert('Error', 'Failed to remove the accepted user.');
  }
};

  // Navigate to the 'userProfiles.jsx' screen
  const handleProfileClick = (userId) => {
    const user = userDetails[userId];
    if (user) {
      router.push({
        pathname: '/userProfiles',
        params: {
          userId,   // Pass the user ID
          name: user.name,
          photo: user.photos,
        },
      });
    }
  };

  // Render each request
  const renderRequest = (item) => (
    <TouchableOpacity 
      key={item} 
      style={styles.requestContainer} 
      onPress={() => handleProfileClick(item)}
    >
      <View style={styles.userInfo}>
        <Image source={{ uri: userDetails[item]?.photos }} style={styles.userPhoto} />
        <Text style={styles.userText}>{userDetails[item]?.name || 'Loading...'}</Text>
      </View>
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.acceptButton} onPress={() => handleAccept(item)}>
          <Text style={styles.acceptText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item)}>
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // Render each accepted request with the "Remove" button
const renderAccepted = (item) => (
  <View style={styles.acceptedContainer} key={item}>
    <View style={styles.userInfo}>
      <Image source={{ uri: userDetails[item]?.photos }} style={styles.userPhoto} />
      <Text style={styles.userText}>{userDetails[item]?.name || 'Loading...'}</Text>
    </View>
    <TouchableOpacity style={styles.removeButton} onPress={() => handleRemove(item)}>
      <Text style={styles.removeText}>Remove</Text>
    </TouchableOpacity>
  </View>
);

  return (
    <>
      {/* Custom back button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}  // Ensure this is `navigation.goBack()`
      >
        <Ionicons name="chevron-back" size={24} color="#fff" />
      </TouchableOpacity>


      {/* Main content */}
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Private Photo Requests</Text>

        {/* Display requests */}
        <Text style={styles.sectionTitle}>Requests</Text>
        {isLoading ? (
          <Text>Loading requests...</Text>
        ) : requests.length > 0 ? (
          requests.map(renderRequest)
        ) : (
          <Text style={styles.noRequestsText}>No requests available.</Text>
        )}

        {/* Display accepted requests */}
        <Text style={styles.sectionTitle}>Accepted Requests</Text>
        {accepted.length > 0 ? (
          accepted.map(renderAccepted)
        ) : (
          <Text style={styles.noRequestsText}>No accepted requests.</Text>
        )}
      </ScrollView>
    </>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    paddingTop: 50,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  noRequestsText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#999',
    marginBottom: 20,
  },
  requestContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  acceptedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, // Ensures the photo and name stay aligned together
  },
  userPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10, // Adjust spacing between photo and name
  },
  userText: {
    fontSize: 16,
    color: '#333',
  },
  actionsContainer: {
    flexDirection: 'row',
  },
  acceptButton: {
    backgroundColor: 'green',
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  acceptText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
  },
  deleteText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  backButton: {
    position: 'absolute',
    top: 65,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 25,
    padding: 10,
    zIndex: 10,
  },
  removeButton: {
    backgroundColor: 'orange',
    padding: 10,
    borderRadius: 5,
  },
  removeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  
});

export default PrivateRequests;
