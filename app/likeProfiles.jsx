import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, Button, Alert, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FIREBASE_DB, FIREBASE_AUTH } from '../firebaseConfig';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, setDoc } from 'firebase/firestore';
import uuid from 'react-native-uuid';  // Use react-native-uuid for generating UUIDs
import { Ionicons } from '@expo/vector-icons';
import { Timestamp } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const likeProfiles = () => {
  const { userId } = useLocalSearchParams();  // Get the userId from the route parameters
  const router = useRouter();  // Router to navigate
  const currentUserId = FIREBASE_AUTH.currentUser.uid;  // Get the logged-in user's ID
  const [user, setUser] = useState(null);
  const navigation = useNavigation();

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

  // Handle Match Logic
  const handleMatch = async () => {
    try {
      const matchId = uuid.v4();  // Generate a unique match ID using react-native-uuid

      // Update the matches field in both users' documents
      const currentUserDocRef = doc(FIREBASE_DB, 'users', currentUserId);
      const likedUserDocRef = doc(FIREBASE_DB, 'users', userId);

      await updateDoc(currentUserDocRef, {
        matches: arrayUnion(matchId),  // Add match ID to current user's matches
        receivedLikes: arrayRemove(userId),  // Remove liked user from receivedLikes
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
        read: {currentUserId: false, userId: false},
      });

      // Navigate back to the likes page
      router.back();

    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  // Handle Decline Logic
  const handleDecline = async () => {
    try {
      // Remove the liked user from the current user's receivedLikes field
      const currentUserDocRef = doc(FIREBASE_DB, 'users', currentUserId);
      await updateDoc(currentUserDocRef, {
        receivedLikes: arrayRemove(userId),  // Remove liked user from receivedLikes
      });

      // Navigate back to the likes page
      router.back();
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  if (!user) {
    return <Text style={styles.errorText}>Loading user data...</Text>;
  }

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
});

export default likeProfiles;
