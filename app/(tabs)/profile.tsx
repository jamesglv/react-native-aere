import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { FIREBASE_AUTH, FIREBASE_DB } from '../../firebaseConfig'; // Import Firestore and Firebase Auth config
import { updateDoc, doc, getDoc } from 'firebase/firestore'; // Firestore functions
import { signOut } from 'firebase/auth'; // Firebase sign-out function
import { LinearGradient } from 'expo-linear-gradient'; // Import LinearGradient from expo-linear-gradient
import { useRouter } from 'expo-router';  // Import useRouter from expo-router
import { Switch } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { fetchUserData, updateUserDocument, deleteUserAccount } from '../../firebaseActions'; // Import fetchUserProfileData function
import ProfileButton from '../../components/ProfileButton';
import DeleteUserModal from '../../components/DeleteUserModal';
import Loading from '../../components/Loading';

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
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false); // State for delete modal visibility
  const [isLoading, setIsLoading] = useState(false); // State for loading spinner

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
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const togglePause = async () => {
    const newPausedState = !isPaused;
    setIsPaused(newPausedState); // Update the state locally
    try {
      await updateUserDocument({ paused: newPausedState }); // Update Firestore using the cloud function
    } catch (error) {
      console.error('Error updating pause state:', error);
      Alert.alert('Error', 'Failed to update pause state.');
    }
  };

  const handleDeleteAccount = async () => {
    setIsLoading(true);
    try {
      await deleteUserAccount();
      await signOut(FIREBASE_AUTH);
      router.replace('/sign-in');
    } catch (error) {
      console.error("Error deleting account:", error);
      Alert.alert("Error", "Failed to delete account.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading)  {
    return <Loading />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Profile Header with Photo, Gradient, and Name */}
      <View style={styles.header}>
        <Image 
        source={photos[0] ? { uri: photos[0] } : require('../../assets/images/placeholderAERE.png')}
        style={styles.profileImage}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0, 0, 0, 0.8)']} // Gradient from transparent to black
          style={styles.gradient}
        />
        <Text style={[styles.userName, {fontFamily: 'oregular'}]}>{name}</Text>
      </View>

      <View style={styles.profileTitleContainer}>
         <Text style={[styles.profileTitle, {fontFamily: 'oregular'}]}>Profile</Text>
      </View>
      {/* Button to edit profile */}
      <ProfileButton
        title="Edit Profile"
        onPress={() => router.push('/editProfile')}
      />
      <ProfileButton
        title="Manage Private Requests"
        onPress={() => router.push('/privateRequests')}
      />

      {/* Pause toggle */}
      <View style={styles.pauseToggleContainer}>
        <Text style={[styles.pauseTitle, {fontFamily: 'oregular'}]}>Pause</Text>
        <Switch
          value={isPaused}
          onValueChange={togglePause} // Toggle the pause state
          style={styles.pauseToggle}
        />
      </View>
      <View style={styles.pauseTextContainer}>
        <Text style={[styles.pauseText, {fontFamily: 'oregular'}]}>Pausing hides your profile from appearing in the explore feed. You can still view your likes and matches.</Text>

      </View>

      {/* Account Section */}
      <View style={styles.profileTitleContainer}>
         <Text style={[styles.profileTitle, {fontFamily: 'oregular'}]}>Account</Text>
      </View>
      <ProfileButton
        title="Notifications"
        onPress={() => router.push()}
      />
      {/* <ProfileButton
        title="Blocked List"
        onPress={() => router.push()}
      /> */}
      <ProfileButton
        title="Change Password"
        onPress={() => router.push()}
      />

      {/* Legal Section */}
      <View style={styles.profileTitleContainer}>
         <Text style={[styles.profileTitle, {fontFamily: 'oregular'}]}>Legal</Text>
      </View>
      <ProfileButton
        title="Privacy Policy"
        onPress={() => router.push()}
      />
      <ProfileButton
        title="Terms of Service"
        onPress={() => router.push()}
      />
      

      <View style={styles.section}>
        <View>
          
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={[styles.logoutButtonText, {fontFamily: 'oregular'}]}>Log Out</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutButton} onPress={() => setIsDeleteModalVisible(true)}>
          <Text style={[styles.logoutButtonText, {fontFamily: 'oregular'}]}>Delete Account</Text>
        </TouchableOpacity>
      </View>
      {/* Delete User Modal */}
      <DeleteUserModal
        isVisible={isDeleteModalVisible}
        onClose={() => setIsDeleteModalVisible(false)}
        goToMatches={() => {
          setIsDeleteModalVisible(false);
          //router.push('/matches');
        }}
        backToLikes={() => {
          setIsDeleteModalVisible(false);
          handleDeleteAccount();
          // Add your delete account logic here
        }}
      />
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
    fontSize: 32,
    zIndex: 10,
  },
  profileTitleContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#ececec',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 20,
    marginTop: 40,
    width: '95%',
  },
  profileTitle: {
    width: 200,
    fontSize: 24,
    color: '#333',
    marginBottom: 10,
  },
  pauseToggleContainer: {
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center', 
    marginLeft: 20,
    marginTop: 10,
  },
  pauseTitle: { 
    fontSize: 18, 
    marginRight: 10 
  },
  pauseToggle: {
    marginTop: 10,
    marginRight: 25,
  },
  pauseTextContainer: {
    marginLeft: 20,
    marginTop: 10,
    width: '90%',
    borderBottomWidth: 1,
    borderColor: '#ececec',
    paddingBottom: 20,
  },
  pauseText: {
    fontSize: 16,
    color: '#333',
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
    borderColor: '#ececec',
    borderWidth: 1,
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  logoutButtonText: {
    color: 'black',
    fontSize: 16,
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
