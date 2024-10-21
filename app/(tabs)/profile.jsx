import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { FIREBASE_AUTH, FIREBASE_DB } from '../../firebaseConfig'; // Firestore and Firebase Auth config
import { updateDoc, doc, getDoc } from 'firebase/firestore'; // Firestore functions
import { signOut } from 'firebase/auth'; // Firebase sign-out function
import { LinearGradient } from 'expo-linear-gradient'; // Import LinearGradient from expo-linear-gradient
import { useRouter } from 'expo-router';  // Import useRouter from expo-router

const Profile = () => {
  const currentUser = FIREBASE_AUTH.currentUser; // Get the logged-in user's information
  const router = useRouter(); // Use router for navigation

  // State for user profile fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [bio, setBio] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Function to fetch user data from Firestore
  const fetchUserData = async () => {
    if (!currentUser) return;
    try {
      const userDocRef = doc(FIREBASE_DB, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        setName(userData.name || '');
        setBio(userData.bio || '');
        setPhotoURL(userData.photos[0] || 'https://placekitten.com/800/400'); // Fallback to placeholder if no photo
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert('Error', 'Failed to load user data.');
    }
  };

  // Fetch user data on component mount
  useEffect(() => {
    fetchUserData();
  }, []);

  // Function to update the user's profile information in Firestore
  const handleSaveProfile = async () => {
    setIsSaving(true);

    try {
      const userDocRef = doc(FIREBASE_DB, 'users', currentUser.uid);

      await updateDoc(userDocRef, {
        name,
        bio,
      });

      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again later.');
    } finally {
      setIsSaving(false);
    }
  };

  // Function to handle the logout
  const handleLogout = async () => {
    try {
      await signOut(FIREBASE_AUTH);
      router.replace('/sign-in');  // Navigate to sign-in screen after logout
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Profile Header with Photo, Gradient, and Name */}
      <View style={styles.header}>
        <Image source={{ uri: photoURL }} style={styles.profileImage} />
        <LinearGradient
          colors={['transparent', 'rgba(0, 0, 0, 0.8)']} // Gradient from transparent to black
          style={styles.gradient}
        />
        <Text style={styles.userName}>{name}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile Information</Text>

        <TextInput
          style={styles.input}
          placeholder="Name"
          value={name}
          onChangeText={setName}
        />

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          editable={false} // Disable email editing for now
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Tell us about yourself (Bio)"
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveProfile}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save Profile'}</Text>
        </TouchableOpacity>
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
    height: 250, // Set the height of the image area
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
    height: 150,  // Adjust the height of the gradient overlay
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
  input: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 15,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top', // For Android to start typing at the top
  },
  saveButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
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
});

export default Profile;
