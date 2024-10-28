import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, Button, Alert, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FIREBASE_DB, FIREBASE_AUTH } from '../firebaseConfig';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, setDoc } from 'firebase/firestore';
import uuid from 'react-native-uuid';  // Use react-native-uuid for generating UUIDs
import { Ionicons } from '@expo/vector-icons';
import { Timestamp } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';

import placeholder1 from '../assets/images/placeholder-profile-1.png';
import placeholder2 from '../assets/images/placeholder-profile-2.png';
import placeholder3 from '../assets/images/placeholder-profile-3.png';

const { width, height } = Dimensions.get('window');

const likeProfiles = () => {
  const { userId } = useLocalSearchParams();  // Get the userId from the route parameters
  const router = useRouter();  // Router to navigate
  const currentUserId = FIREBASE_AUTH.currentUser.uid;  // Get the logged-in user's ID
  const [user, setUser] = useState(null);
  const navigation = useNavigation();
  const [hasAccess, setHasAccess] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);


  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
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

  useEffect(() => {
    const checkAccessStatus = () => {
      if (user) {
        setHasRequested(user.privateRequests?.includes(currentUserId) || false);
        setHasAccess(user.privateAccepted?.includes(currentUserId) || false);
      }
    };
    checkAccessStatus();
  }, [user]);

  const handleMatch = async () => {
    try {
      const matchId = uuid.v4();  // Generate a unique match ID using react-native-uuid
  
      // References to both the current user and liked user documents
      const currentUserDocRef = doc(FIREBASE_DB, 'users', currentUserId);
      const likedUserDocRef = doc(FIREBASE_DB, 'users', userId);
  
      await updateDoc(currentUserDocRef, {
        matches: arrayUnion(matchId),          // Add match ID to current user's matches
        receivedLikes: arrayRemove(userId),    // Remove liked user from receivedLikes
        hiddenProfiles: arrayUnion(userId),    // Add target user to hiddenProfiles array
      });
  
      await updateDoc(likedUserDocRef, {
        matches: arrayUnion(matchId),  // Add match ID to liked user's matches
      });
  
      // Create a document in the 'matches' collection with the match info
      const matchDocRef = doc(FIREBASE_DB, 'matches', matchId);
      await setDoc(matchDocRef, {
        matchId: matchId,
        users: [currentUserId, userId],
        createdAt: Timestamp.now(),  // Store the timestamp
        lastMessage: Timestamp.now(),
        messagePreview: '',
        messages: [],
        privateRequests: [],
        read: { [currentUserId]: false, [userId]: false },
      });
  
      // Navigate back to the likes page
      router.back();
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };  

  const handleDecline = async () => {
    try {
      const currentUserDocRef = doc(FIREBASE_DB, 'users', currentUserId);
  
      // Remove the liked user from the current user's receivedLikes field
      await updateDoc(currentUserDocRef, {
        receivedLikes: arrayRemove(userId),     // Remove liked user from receivedLikes
        hiddenProfiles: arrayUnion(userId),     // Add target user to hiddenProfiles array
      });
  
      // Navigate back to the likes page
      router.back();
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };  

  const handleRequestAccess = async () => {
    if (hasRequested) return;
  
    try {
      await updateDoc(doc(FIREBASE_DB, 'users', userId), {
        privateRequests: arrayUnion(currentUserId),
      });
  
      Alert.alert('Request Sent', 'Your access request has been sent.');
      setHasRequested(true);
    } catch (error) {
      console.error('Error updating privateRequests:', error);
      Alert.alert('Error', 'Failed to send access request.');
    }
  };  

  if (!user) {
    return <Text style={styles.errorText}>Loading user data...</Text>;
  }

  // Merging privatePhotos with placeholders if fewer than 3
  const privatePhotos = (user.privatePhotos || []).slice(0, 3);
  const placeholders = [placeholder1, placeholder2, placeholder3];
  const displayPhotos = [...privatePhotos, ...placeholders].slice(0, 3); // Ensure exactly 3 photos

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Photos Carousel */}
      <View style={styles.photoCarouselContainer}>
        <FlatList
          data={user.photos}
          keyExtractor={(photo, index) => index.toString()}
          renderItem={({ item: photo }) => (
            <Image source={{ uri: photo }} style={styles.profileImage} />
          )}
          pagingEnabled
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* User Information */}
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{user.name}, {user.age}</Text>
        <Text style={styles.bio}>{user.bio}</Text>

        <View style={styles.privateAlbumContainer}>
          <Text style={styles.privateAlbumTitle}>Private Album</Text>
          <View style={styles.privatePhotosContainer}>
            {displayPhotos.map((photo, index) => (
              <Image
                key={index}
                source={typeof photo === 'string' ? { uri: photo } : photo} // Use URI or local asset
                style={styles.privatePhoto}
                blurRadius={hasAccess ? 0 : 20} // Remove blur if access is granted
              />
            ))}
          </View>
            <TouchableOpacity
              style={styles.requestAccessButton}
              onPress={() => {
                if (!hasAccess && !hasRequested) {
                  handleRequestAccess();
                  handleMatch();
                } else if (hasAccess) {
                  openPhotoViewer();
                }
              }}
              disabled={hasRequested}
            >
              <Text style={styles.requestAccessButtonText}>
                {hasAccess ? 'View Album' : hasRequested ? 'Requested' : 'Match and Request Access'}
            </Text>
          </TouchableOpacity>
        </View>


        {/* Match and Decline Buttons */}
        <View style={styles.buttonsContainer}>
          <Button title="Match" onPress={handleMatch} color="green" />
          <Button title="Decline" onPress={handleDecline} color="red" />
        </View>
      </View>
    </View>
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
    top: 40,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 20,
    zIndex: 10,
  },
  photoCarouselContainer: {
    height: height * 0.5,  // Fixed height for the carousel
    width: '100%',
  },
  profileImage: {
    width: width,
    height: height * 0.5,  // Adjust image to fit within container height
    resizeMode: 'cover',
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
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
  privateAlbumContainer: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  privateAlbumTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  privatePhotosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 10,
  },
  privatePhoto: {
    width: 60,
    height: 60,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  requestAccessButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  requestAccessButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  
});

export default likeProfiles;
