import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, RefreshControl, TouchableOpacity, Alert, Dimensions, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FIREBASE_DB, FIREBASE_AUTH } from '../../firebaseConfig';  // Import Firestore config
import { getDocs, collection, doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';  // Firestore functions
import { signOut } from 'firebase/auth';  // Firebase signOut
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');  // Get screen dimensions

const Home = () => {
  const [profiles, setProfiles] = useState([]);  // Store user profiles
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState(null);  // Store the user ID
  const [currentUserData, setCurrentUserData] = useState({ likedUsers: [], declinedUsers: [] });  // Track current user data

  useEffect(() => {
    // Check if the user is authenticated
    const user = FIREBASE_AUTH.currentUser;
    if (user) {
      setCurrentUserId(user.uid);  // Set the current user ID
    } else {
      handleLogout();  // Logout if no user is authenticated
    }
  }, []);

  // Fetch the current user's data (likedUsers, declinedUsers)
  const fetchCurrentUser = async () => {
    try {
      const userRef = doc(FIREBASE_DB, 'users', currentUserId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        // Ensure likedUsers and declinedUsers are arrays, initialize them if missing
        const userData = userSnap.data();
        setCurrentUserData({
          likedUsers: userData.likedUsers || [],  // Initialize to empty array if missing
          declinedUsers: userData.declinedUsers || []  // Initialize to empty array if missing
        });
      }
    } catch (error) {
      console.error('Error fetching current user data:', error);
    }
  };

  // Fetch profiles from Firestore
  const fetchProfiles = async () => {
    try {
      const profilesSnapshot = await getDocs(collection(FIREBASE_DB, 'users'));
      const profilesData = profilesSnapshot.docs.map(doc => {
        const data = doc.data();
        return { id: doc.id, ...data };
      }).filter(profile => {
        // Filter out the logged-in user's profile
        return profile.id !== currentUserId
          // Filter out profiles that the user has already liked or declined
          && !currentUserData.likedUsers.includes(profile.id)
          && !currentUserData.declinedUsers.includes(profile.id);
      });

      setProfiles(profilesData);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      Alert.alert('Error', 'Failed to load profiles');
    }
  };

  useEffect(() => {
    if (currentUserId) {
      fetchCurrentUser();  // Fetch current user's liked and declined users
    }
  }, [currentUserId]);

  useEffect(() => {
    if (currentUserId) {
      fetchProfiles();  // Fetch profiles after currentUserData updates
    }
  }, [currentUserId, currentUserData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfiles();
    setRefreshing(false);
  };

  // Function to handle a 'Like' action
  const handleLike = async (targetUserId) => {
    try {
      const currentUserRef = doc(FIREBASE_DB, 'users', currentUserId);
      const targetUserRef = doc(FIREBASE_DB, 'users', targetUserId);

      // Update the current user's list of liked users
      await updateDoc(currentUserRef, {
        likedUsers: arrayUnion(targetUserId)  // Add target user to likedUsers array
      });

      // Update the target user's list of received likes
      await updateDoc(targetUserRef, {
        receivedLikes: arrayUnion(currentUserId)  // Add current user to receivedLikes array
      });

      // Remove the liked user from the visible profile stack
      setProfiles(profiles.filter(profile => profile.id !== targetUserId));

      Alert.alert('Success', `You liked user: ${targetUserId}`);
    } catch (error) {
      console.error('Error liking user:', error);
      Alert.alert('Error', 'Failed to like user');
    }
  };

  // Function to handle a 'Decline' action
  const handleDecline = async (targetUserId) => {
    try {
      const currentUserRef = doc(FIREBASE_DB, 'users', currentUserId);
      const targetUserRef = doc(FIREBASE_DB, 'users', targetUserId);

      // Update the current user's list of declined users
      await updateDoc(currentUserRef, {
        declinedUsers: arrayUnion(targetUserId)  // Add target user to declinedUsers array
      });

      // Update the target user's list of received declines
      await updateDoc(targetUserRef, {
        receivedDeclines: arrayUnion(currentUserId)  // Add current user to receivedDeclines array
      });

      // Remove the declined user from the visible profile stack
      setProfiles(profiles.filter(profile => profile.id !== targetUserId));

      Alert.alert('Success', `You declined user: ${targetUserId}`);
    } catch (error) {
      console.error('Error declining user:', error);
      Alert.alert('Error', 'Failed to decline user');
    }
  };

  // Function to handle the logout
  const handleLogout = async () => {
    try {
      await signOut(FIREBASE_AUTH);
      Alert.alert('Success', 'You have logged out successfully.');
      router.replace('/sign-up');  // Navigate to sign-up screen after logout
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  // Render each profile card in the carousel
  const renderProfileCard = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.photos[0] }} style={styles.profileImage} />
      <View style={styles.textContainer}>
        <Text style={styles.name}>{item.name}, {item.age}</Text>
        <Text style={styles.bio}>{item.bio}</Text>

        {/* Like and Decline Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.likeButton} onPress={() => handleLike(item.id)}>
            <Text style={styles.likeButtonText}>Like</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.declineButton} onPress={() => handleDecline(item.id)}>
            <Text style={styles.declineButtonText}>Decline</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <>
      {/* Hide the status bar */}
      <StatusBar hidden={true} />

      {/* Main screen content */}
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        {/* Overlay Log Out button on top of the image */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {/* Profile Carousel */}
        <FlatList
          data={profiles}
          horizontal
          keyExtractor={(item) => item.id}
          renderItem={renderProfileCard}
          showsHorizontalScrollIndicator={false}
          pagingEnabled  // Enable snapping to each profile card
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.carousel}
        />
      </SafeAreaView>
    </>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1c1e',
  },
  // Style for the log-out button overlay
  logoutButton: {
    position: 'absolute',  // Overlay on top of the image
    top: 40,  // Adjust this based on your design, this example is for margin from the top of the screen
    left: 20,  // Adjust this to move the button left or right
    zIndex: 2,  // Ensure the log-out button is above other elements
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  logoutText: {
    color: '#1c1c1e',
    fontSize: 18,
    fontWeight: '600',
  },
  carousel: {
    alignItems: 'center',
  },
  card: {
    width: width,  // Full width of the screen
    height: height,  // Full height of the screen
    backgroundColor: '#fff',
    justifyContent: 'flex-start',  // Align content at the top of the white space
  },
  profileImage: {
    position: 'absolute',
    top: 0,  // Pin to the top of the screen
    width: '100%',  // Full width of the screen
    height: height * 0.5,  // Take 50% of the screen height
    resizeMode: 'cover',  // Ensure the image covers the space while maintaining aspect ratio
  },
  textContainer: {
    marginTop: height * 0.5,  // Start text container below the image
    paddingHorizontal: 20,  // Add some padding for the text
    paddingTop: 20,  // Extra padding to create spacing at the top
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginBottom: 10,  // Add some space below the name
  },
  bio: {
    fontSize: 16,
    color: '#1c1c1e',
    lineHeight: 22,  // Make the bio text easier to read
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  likeButton: {
    backgroundColor: 'green',
    padding: 15,
    borderRadius: 10,
  },
  declineButton: {
    backgroundColor: 'red',
    padding: 15,
    borderRadius: 10,
  },
  likeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  declineButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default Home;
