import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { FIREBASE_AUTH, FIREBASE_DB } from '../../firebaseConfig'; // Import Firestore and Firebase Auth config
import { updateDoc, doc, getDoc } from 'firebase/firestore'; // Firestore functions
import { signOut } from 'firebase/auth'; // Firebase sign-out function
import { LinearGradient } from 'expo-linear-gradient'; // Import LinearGradient from expo-linear-gradient
import { useRouter } from 'expo-router';  // Import useRouter from expo-router
import { Switch } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { fetchUserData } from '../../firebaseActions'; // Import fetchUserProfileData function

const Profile = () => {
  const currentUser = FIREBASE_AUTH.currentUser; // Get the logged-in user's information
  const router = useRouter(); // Use router for navigation

  // State for user profile fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [bio, setBio] = useState('');
  const [photos, setPhotos] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isPaused, setIsPaused] = useState(false); // State for the toggle

  const fetchAndSetUserProfileData = async () => {
    try {
      // Specify only the fields needed for the Profile page
      const userData = await fetchUserData(['name', 'bio', 'photos', 'paused']);
      setName(userData.name || '');
      setBio(userData.bio || '');
      setPhotos(userData.photos || []);
      setIsPaused(userData.paused || false);
    } catch (error) {
      console.error("Error fetching user data:", error);
      Alert.alert("Error", "Failed to load user data.");
    }
  };

  // Fetch user data on component mount
  useFocusEffect(
    useCallback(() => {
      fetchAndSetUserProfileData();
    }, [])
  );

  // Function to handle the logout
  const handleLogout = async () => {
    try {
      await signOut(FIREBASE_AUTH);
      router.replace('/sign-in');  // Navigate to sign-in screen after logout
      Alert.alert('Success', 'You have logged out successfully.');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const togglePause = async () => {
    const newPausedState = !isPaused;
    setIsPaused(newPausedState); // Update the state locally
    try {
      const userDocRef = doc(FIREBASE_DB, 'users', currentUser.uid);
      await updateDoc(userDocRef, { paused: newPausedState }); // Update Firestore
    } catch (error) {
      console.error('Error updating pause state:', error);
      Alert.alert('Error', 'Failed to update pause state.');
    }
  };
  

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Profile Header with Photo, Gradient, and Name */}
      <View style={styles.header}>
        <Image 
          source={{ uri: photos[0] || 'https://placekitten.com/800/400' }}  // Display user's first photo or a placeholder
          style={styles.profileImage}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0, 0, 0, 0.8)']} // Gradient from transparent to black
          style={styles.gradient}
        />
        <Text style={styles.userName}>{name}</Text>
      </View>

      {/* Button to edit profile */}
      <TouchableOpacity
        style={styles.editProfileButton}
        onPress={() => router.push('/editProfile')}
      >
        <Text style={styles.editProfileButtonText}>Edit Profile</Text>
      </TouchableOpacity>

      {/* Button to manage private requests */}
      <TouchableOpacity
        style={styles.manageRequestsButton}
        onPress={() => router.push('/privateRequests')}
      >
        <Text style={styles.manageRequestsText}>Manage Private Requests</Text>
      </TouchableOpacity>

      {/* Pause toggle */}
      <View style={{ flexDirection: 'row', alignItems: 'center', margin: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginRight: 10 }}>Pause</Text>
        <Switch
          value={isPaused}
          onValueChange={togglePause} // Toggle the pause state
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Settings</Text>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f8f8f8',
    padding: 0,
  },
  header: {
    position: 'relative',
    width: '100%',
    height: 250, 
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,  
  },
  userName: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    zIndex: 10,
  },
  section: {
    marginBottom: 30,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  logoutButton: {
    backgroundColor: '#ff6347',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  editProfileButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 5,
    margin: 20,
    alignItems: 'center',
    width: '100%',  // Full width button
  },
  editProfileButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  manageRequestsButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 5,
    margin: 20,
    alignItems: 'center',
    width: '100%',  // Full width button
  },
  manageRequestsText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default Profile;
