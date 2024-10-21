import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { FIREBASE_AUTH, FIREBASE_DB, FIREBASE_STORAGE } from '../../firebaseConfig'; // Import Firestore and Firebase Auth config
import { updateDoc, doc, getDoc } from 'firebase/firestore'; // Firestore functions
import { signOut } from 'firebase/auth'; // Firebase sign-out function
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // Firebase storage functions
import { LinearGradient } from 'expo-linear-gradient'; // Import LinearGradient from expo-linear-gradient
import { useRouter } from 'expo-router';  // Import useRouter from expo-router
import * as ImagePicker from 'expo-image-picker'; // Import ImagePicker to allow selecting images
import { MaterialIndicator } from 'react-native-indicators';  // Import ActivityIndicator


const Profile = () => {
  const currentUser = FIREBASE_AUTH.currentUser; // Get the logged-in user's information
  const router = useRouter(); // Use router for navigation

  // State for user profile fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [bio, setBio] = useState('');
  const [photos, setPhotos] = useState([]);
  const [privatePhotos, setPrivatePhotos] = useState([]); 
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingRegularIndex, setUploadingRegularIndex] = useState(null);  // For regular photos loading indicator
  const [uploadingPrivateIndex, setUploadingPrivateIndex] = useState(null);  // For private photos loading indicator
 

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
        setPhotos(userData.photos || []); // Set photos from Firestore
        setPrivatePhotos(userData.privatePhotos || []);  // Load private photos

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
        photos,  // Save the updated photos array
      });

      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again later.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadPhoto = async (index, isPrivate = false) => {
    // Request permission to access media library
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
  
    if (!permissionResult.granted) {
      Alert.alert("Permission to access camera roll is required!");
      return;
    }
  
    // Let the user pick an image from the gallery
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: false,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
  
    console.log('picker result', pickerResult);
  
    // Check if the pickerResult contains assets and is not cancelled
    if (!pickerResult.cancelled && pickerResult.assets && pickerResult.assets.length > 0) {
      const selectedImage = pickerResult.assets[0].uri;
      console.log('picker:', selectedImage);
  
      try {
        if (isPrivate) {
          setUploadingPrivateIndex(index);
        } else {
          setUploadingRegularIndex(index);
        }
        console.log('fetching');
        const response = await fetch(selectedImage);
        const blob = await response.blob(); // Convert the image to a blob for upload
  
        // Prepare Firebase storage reference with a timestamped file name
        const photoRef = ref(FIREBASE_STORAGE, `users/${currentUser.uid}/photo-${Date.now()}`);
  
        // Upload the image to Firebase storage
        await uploadBytes(photoRef, blob);
  
        // Get the download URL of the uploaded image
        const downloadUrl = await getDownloadURL(photoRef);
  
        if (isPrivate) {
          const updatedPrivatePhotos = [...privatePhotos];
          updatedPrivatePhotos[index] = downloadUrl;
          setPrivatePhotos(updatedPrivatePhotos);

          // Save to Firestore
          await updateDoc(doc(FIREBASE_DB, 'users', currentUser.uid), {
            privatePhotos: updatedPrivatePhotos,
          });
        } else {
          const updatedPhotos = [...photos];
          updatedPhotos[index] = downloadUrl;
          setPhotos(updatedPhotos);

          // Save to Firestore
          await updateDoc(doc(FIREBASE_DB, 'users', currentUser.uid), {
            photos: updatedPhotos,
          });
        }
  
      } catch (error) {
        console.error('Error uploading photo:', error);
        Alert.alert('Error', 'Failed to upload photo. Please try again later.');
      } finally {
        // Reset the uploading index after the photo is uploaded
        setUploadingPrivateIndex(null);
        setUploadingRegularIndex(null);  // Reset the uploading state after upload is finished
      }
    } else {
      console.log('Image picker was cancelled or no assets selected');
    }
  };

  // Function to delete a photo
  const handleDeletePhoto = async (index, isPrivate = false) => {
    const updatedPhotos = isPrivate ? [...privatePhotos] : [...photos];
    updatedPhotos.splice(index, 1);  // Remove the selected photo
    if (isPrivate) {
      setPrivatePhotos(updatedPhotos);
      await updateDoc(doc(FIREBASE_DB, 'users', currentUser.uid), { privatePhotos: updatedPhotos });
    } else {
      setPhotos(updatedPhotos);
      await updateDoc(doc(FIREBASE_DB, 'users', currentUser.uid), { photos: updatedPhotos });
    }
  };

  // Render the photo grid with upload and delete buttons
  const renderPhotoGrid = () => {
    return (
      <View style={styles.photoGrid}>
        {Array.from({ length: 6 }).map((_, index) => (
          <View key={index} style={styles.photoBox}>
            {uploadingRegularIndex === index ? (
              <MaterialIndicator size={30} color="black" />  // Show the spinner while uploading
            ) : photos[index] ? (
              <>
                <Image source={{ uri: photos[index] }} style={styles.photo} />
                {/* Only show the delete button if more than one photo exists */}
                {photos.length > 1 && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeletePhoto(index)}
                  >
                    <Text style={styles.deleteText}>X</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => handleUploadPhoto(index)}
              >
                <Text style={styles.addText}>+</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>
    );
  };

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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Profile Header with Photo, Gradient, and Name */}
      <View style={styles.header}>
        <Image source={{ uri: photos[0] || 'https://placekitten.com/800/400' }} style={styles.profileImage} />
        <LinearGradient
          colors={['transparent', 'rgba(0, 0, 0, 0.8)']} // Gradient from transparent to black
          style={styles.gradient}
        />
        <Text style={styles.userName}>{name}</Text>
      </View>

      {/* Photo upload grid */}
      {renderPhotoGrid()}

      {/* Private photo grid */}
      <Text style={styles.sectionTitle}>Private Photos</Text>
      <View style={styles.photoGrid}>
        {Array.from({ length: 6 }).map((_, index) => (
          <View key={index} style={styles.photoBox}>
            {uploadingPrivateIndex === index ? (
              <MaterialIndicator size={40} color="#black" />
            ) : privatePhotos[index] ? (
              <>
                <Image source={{ uri: privatePhotos[index] }} style={styles.photo} />
                {privatePhotos.length > 1 && (
                  <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeletePhoto(index, true)}>
                    <Text style={styles.deleteText}>X</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <TouchableOpacity style={styles.addButton} onPress={() => handleUploadPhoto(index, true)}>
                <Text style={styles.addText}>+</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      {/* Button to navigate to the private requests screen */}
      <TouchableOpacity
        style={styles.manageRequestsButton}
        onPress={() => router.push('/privateRequests')}
      >
        <Text style={styles.manageRequestsText}>Manage Private Requests</Text>
      </TouchableOpacity>

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
    textAlignVertical: 'top',
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
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginVertical: 10,
    paddingHorizontal: 20,
  },
  photoBox: {
    width: '30%',
    height: 100,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  addButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  addText: {
    fontSize: 36,
    color: '#007bff',
  },
  deleteButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'red',
    borderRadius: 10,
    padding: 2,
  },
  deleteText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  manageRequestsButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 5,
    margin: 20,
    alignItems: 'center',
  },
  manageRequestsText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default Profile;
