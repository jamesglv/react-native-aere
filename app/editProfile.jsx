import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { FIREBASE_AUTH, FIREBASE_DB, FIREBASE_STORAGE } from '../firebaseConfig'; // Firestore and Firebase Auth config
import { updateDoc, doc, getDoc } from 'firebase/firestore'; // Firestore functions
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'expo-router';  // Use router for navigation
import { useNavigation } from '@react-navigation/native';  // Use navigation hook
import * as ImagePicker from 'expo-image-picker'; // Import ImagePicker to allow selecting images
import { MaterialIndicator } from 'react-native-indicators';  // Import ActivityIndicator
import { CheckBox } from 'react-native-elements';  // Import CheckBox from react-native-elements
import { Ionicons } from '@expo/vector-icons';  // Icon library for back button
import MapView, { Marker } from 'react-native-maps'; // Import MapView and Marker
import { fetchUserData } from '../firebaseActions';  // Import the function to fetch data selectively

const EditProfile = () => {
  const currentUser = FIREBASE_AUTH.currentUser; // Get the logged-in user's information
  const router = useRouter(); // Use router for navigation
  const navigation = useNavigation();  // Access navigation


  // State for user profile fields
  const [name, setName] = useState('');  // State for user name
  const [bio, setBio] = useState('');
  const [photos, setPhotos] = useState([]);
  const [privatePhotos, setPrivatePhotos] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingRegularIndex, setUploadingRegularIndex] = useState(null);
  const [uploadingPrivateIndex, setUploadingPrivateIndex] = useState(null);

  const [gender, setGender] = useState('');
  const [livingWith, setLivingWith] = useState([]);

  // Remove default header bar by setting options in useLayoutEffect
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,  // Hide the default header bar
      gestureDirection: 'horizontal-inverted', // Swipes from left to right
    });
  }, [navigation]);

  // Fetch user data
  const fetchProfileData = async () => {
    try {
      const userData = await fetchUserData([
        'name', 'bio', 'photos', 'privatePhotos', 'gender', 'livingWith'
      ]);

      // Ensure userData exists and set fields if present
      if (userData) {
        setName(userData.name || '');
        setBio(userData.bio || '');
        setPhotos(userData.photos || []);
        setPrivatePhotos(userData.privatePhotos || []);
        setGender(userData.gender || '');
        setLivingWith(userData.livingWith || []);
      } else {
        console.warn("No user data returned from Firebase");
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert('Error', 'Failed to load user data.');
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  // Function to update the user document in Firestore
  const updateUserDoc = async (updatedData) => {
    try {
      const userDocRef = doc(FIREBASE_DB, 'users', currentUser.uid);
      await updateDoc(userDocRef, updatedData);
    } catch (error) {
      console.error('Error updating user document:', error);
      Alert.alert('Error', 'Failed to update the user data.');
    }
  };

  // Handle photo upload (generalized for both public and private photos)
  const handleUploadPhoto = async (index, isPrivate = false) => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Permission to access camera roll is required!");
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: false,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (!pickerResult.canceled) {
        // Set the uploading index based on whether it's a regular or private photo
        if (isPrivate) {
          setUploadingPrivateIndex(index);
        } else {
          setUploadingRegularIndex(index);
        }

        const response = await fetch(pickerResult.assets[0].uri);
        const blob = await response.blob();

        const photoRef = ref(FIREBASE_STORAGE, `users/${currentUser.uid}/photo-${Date.now()}`);
        await uploadBytes(photoRef, blob);
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
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert('Error', 'Failed to upload photo. Please try again later.');
    } finally {
      // Reset the uploading index after the photo is uploaded
      setUploadingPrivateIndex(null);
      setUploadingRegularIndex(null);
    }
  };

  // Function to handle deleting a photo
  const handleDeletePhoto = async (index, isPrivate = false) => {
    const updatedPhotos = isPrivate ? [...privatePhotos] : [...photos];
    updatedPhotos.splice(index, 1);  // Remove the photo at the specified index

    if (isPrivate) {
      setPrivatePhotos(updatedPhotos);
      await updateDoc(doc(FIREBASE_DB, 'users', currentUser.uid), { privatePhotos: updatedPhotos });
    } else {
      setPhotos(updatedPhotos);
      await updateDoc(doc(FIREBASE_DB, 'users', currentUser.uid), { photos: updatedPhotos });
    }
  };

  // Ensure at least one gender option is always selected
  const handleGenderChange = (selectedGender) => {
    setGender(selectedGender);
    updateUserDoc({ gender: selectedGender }); // Update Firestore
  };

  // Handle Living With selection change
  const handleLivingWithChange = (condition) => {
    const updatedLivingWith = { ...livingWith, [condition]: !livingWith[condition] };
    setLivingWith(updatedLivingWith);
    updateUserDoc({ livingWith: updatedLivingWith }); // Update Firestore
  };

  // Save profile
    const handleSaveProfile = async () => {
        setIsSaving(true);
        try {
        const userDocRef = doc(FIREBASE_DB, 'users', currentUser.uid);
        await updateDoc(userDocRef, {
            name,
            bio,
            photos,
            privatePhotos,
        });
        } catch (error) {
        console.error('Error updating profile:', error);
        Alert.alert('Error', 'Failed to update profile.');
        } finally {
        setIsSaving(false);
        }
    };
  

  // Photo upload grid (same as previous version)
  const renderPhotoGrid = () => {
    return (
      <View style={styles.photoGrid}>
        {Array.from({ length: 6 }).map((_, index) => (
          <View key={index} style={styles.photoBox}>
            {uploadingRegularIndex === index ? (
              <MaterialIndicator size={30} color="black" />
            ) : photos[index] ? (
              <>
                <Image source={{ uri: photos[index] }} style={styles.photo} />
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
        {/* Custom back button */}
        <TouchableOpacity
            style={styles.backButton}
            onPress={async () => {
                await handleSaveProfile(); // Save the profile data before navigating back
                navigation.goBack(); // Navigate back after saving
            }}
            >
            <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
      <Text style={styles.header}>Edit Profile</Text>

      {/* Name input */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          value={name}
          onChangeText={setName}
        />
      </View>

      {/* Photo upload grid */}
      {renderPhotoGrid()}

      {/* Private photo grid */}
      <Text style={styles.sectionTitle}>Private Photos</Text>
      <View style={styles.photoGrid}>
        {Array.from({ length: 6 }).map((_, index) => (
          <View key={index} style={styles.photoBox}>
            {uploadingPrivateIndex === index ? (
              <MaterialIndicator size={40} color="black" />
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

      {/* Bio section */}
      <View style={styles.section}>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Tell us about yourself (Bio)"
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={4}
        />
      </View>

      {/* Gender Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gender</Text>

        <CheckBox
          title="Male"
          checked={gender === 'Male'}
          onPress={() => handleGenderChange('Male')}
        />
        <CheckBox
          title="Female"
          checked={gender === 'Female'}
          onPress={() => handleGenderChange('Female')}
        />
        <CheckBox
          title="Non-Binary"
          checked={gender === 'Non-Binary'}
          onPress={() => handleGenderChange('Non-Binary')}
        />
      </View>

      {/* Living With Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Living With</Text>
        {['HSV1O', 'HSV1G', 'HSV2O'].map((condition) => (
          <CheckBox
            key={condition}
            title={condition}
            checked={livingWith[condition]}
            onPress={() => handleLivingWithChange(condition)}
          />
        ))}
      </View>
        <TouchableOpacity
        style={styles.updateLocationButton}
        onPress={() => router.push('/locationUpdate')}
        >
        <Text style={styles.updateLocationButtonText}>Update Location</Text>
        </TouchableOpacity>

    </ScrollView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f8f8f8',
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    paddingTop: 50,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
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
    backgroundColor: '#fff',
    padding: 10,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 5,
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
  updateLocationButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20,  // Spacing below the button
    width: '100%',  // Full width button
  },
  updateLocationButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default EditProfile;
