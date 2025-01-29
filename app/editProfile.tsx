import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { FIREBASE_AUTH, FIREBASE_DB, FIREBASE_STORAGE } from '../firebaseConfig'; // Firestore and Firebase Auth config
import { updateDoc, doc, getDoc } from 'firebase/firestore'; // Firestore functions
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import uuid from 'react-native-uuid';
import { useRouter } from 'expo-router';  // Use router for navigation
import { useNavigation } from '@react-navigation/native';  // Use navigation hook
import * as ImagePicker from 'expo-image-picker'; // Import ImagePicker to allow selecting images
import { MaterialIndicator } from 'react-native-indicators';  // Import ActivityIndicator
import { CheckBox } from 'react-native-elements';  // Import CheckBox from react-native-elements
import { Ionicons } from '@expo/vector-icons';  // Icon library for back button
import MapView, { Marker } from 'react-native-maps'; // Import MapView and Marker
import { fetchUserData, updateUserDocument, uploadPhoto, deletePhoto } from '../firebaseActions';  // Import the function to fetch data selectively
import ProfileButton from '../components/ProfileButton';
import Loading from'../components/Loading';

const EditProfile = () => {
  const currentUser = FIREBASE_AUTH.currentUser; // Get the logged-in user's information
  const router = useRouter(); // Use router for navigation
  const navigation = useNavigation();  // Access navigation


  // State for user profile fields
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState('');  // State for user name
  const [bio, setBio] = useState('');
  const [photos, setPhotos] = useState([]);
  const [privatePhotos, setPrivatePhotos] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingRegularIndex, setUploadingRegularIndex] = useState(null);
  const [uploadingPrivateIndex, setUploadingPrivateIndex] = useState(null);
  const [uploadingIndex, setUploadingIndex] = useState(false);

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
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

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
        setUploadingIndex(index); // Set the uploading index

        const uri = pickerResult.assets[0].uri;
  
        // Convert image to base64
        const response = await fetch(uri);
        const blob = await response.blob();
        const base64Image = await blobToBase64(blob);
  
        // Upload via Firebase Function
        const downloadUrl = await uploadPhoto(base64Image, currentUser.uid, isPrivate);
  
        // Update state and Firestore with the download URL
        if (isPrivate) {
          const updatedPrivatePhotos = [...privatePhotos];
          updatedPrivatePhotos[index] = downloadUrl;
          setPrivatePhotos(updatedPrivatePhotos);
          await updateUserDocument({ privatePhotos: updatedPrivatePhotos });
        } else {
          const updatedPhotos = [...photos];
          updatedPhotos[index] = downloadUrl;
          setPhotos(updatedPhotos);
          await updateUserDocument({ photos: updatedPhotos });
        }
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert('Error', 'Failed to upload photo. Please try again later.');
    } finally {
      setUploadingIndex(null); // Reset the uploading index
    }
  };
  
  // Helper to convert Blob to Base64
  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]); // Get only the base64 string
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Function to handle deleting a photo
  const handleDeletePhoto = async (index, isPrivate = false) => {
    try {
      const photoUrl = isPrivate ? privatePhotos[index] : photos[index];
      const updatedPhotos = isPrivate ? [...privatePhotos] : [...photos];
  
      console.log('photo URL is', photoUrl);
      // Call the deletePhoto function via Firebase Functions
      await deletePhoto(currentUser.uid, photoUrl, isPrivate);
  
      // Update local state after successful deletion
      updatedPhotos.splice(index, 1);
      if (isPrivate) {
        setPrivatePhotos(updatedPhotos);
      } else {
        setPhotos(updatedPhotos);
      }
      } catch (error) {
      console.error('Error deleting photo:', error);
      Alert.alert('Error', 'Failed to delete photo.');
    }
  };

  // Ensure at least one gender option is always selected
  const handleGenderChange = (selectedGender) => {
    setGender(selectedGender);
    updateUserDocument({ gender: selectedGender }); // Update Firestore
  };

  // Handle Living With selection change
  const handleLivingWithChange = (condition) => {
    const updatedLivingWith = livingWith.includes(condition)
      ? livingWith.filter(item => item !== condition)
      : [...livingWith, condition];
    setLivingWith(updatedLivingWith);
    updateUserDocument({ livingWith: updatedLivingWith }); // Update Firestore
  };

  // Save profile
    const handleSaveProfile = async () => {
        setIsSaving(true);
        try {
        //const userDocRef = doc(FIREBASE_DB, 'users', currentUser.uid);
        await updateUserDocument({
            name,
            bio,
            photos,
            privatePhotos,
            gender,
            livingWith,
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
            {uploadingIndex === index ? (
              <MaterialIndicator size={30} color="black" />
            ) : photos[index] ? (
              <>
                <Image source={{ uri: photos[index] }} style={styles.photo} />
                {photos.length > 1 && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeletePhoto(index)}
                  >
                  <Ionicons name="close-outline" style={styles.deleteIcon} size={18}/>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => handleUploadPhoto(index)}
              >
                <Ionicons name="add-outline" style={styles.addIcon} size={30}/>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>
    );
  };

  if (isLoading) {
    return <Loading />;
  }

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
            <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
      <Text style={styles.header} className='font-oregular'>Edit Profile</Text>

      {/* Name input */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle} className='font-oregular'>Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          value={name}
          onChangeText={setName}
          className='font-oregular'
        />
      </View>

      {/* Photo upload grid */}
      <Text style={styles.sectionTitle} className='font-oregular'>Photos</Text>
      {renderPhotoGrid()}

      {/* Private photo grid */}
      <Text style={styles.sectionTitle} className='font-oregular'>Private Album</Text>
      <View style={styles.photoGrid}>
        {Array.from({ length: 6 }).map((_, index) => (
          <View key={index} style={styles.photoBox}>
            {uploadingPrivateIndex === index ? (
              <MaterialIndicator size={40} color="black" />
            ) : privatePhotos[index] ? (
              <>
                <Image source={{ uri: privatePhotos[index] }} style={styles.photo} />
                  <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeletePhoto(index, true)}>
                    <Ionicons name="close-outline" style={styles.deleteIcon} size={18}/>
                  </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={styles.addButton} onPress={() => handleUploadPhoto(index, true)}>
                <Ionicons name="add-outline" style={styles.addIcon} size={30}/>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      {/* Bio section */}
      <View style={styles.section}>
      <Text style={styles.sectionTitle} className='font-oregular'>About Me</Text>

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Tell us about yourself"
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={4}
          className='font-oregular'
        />
      </View>

      {/* Gender Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle} className='font-oregular'>Gender</Text>

        <CheckBox
          title="Male"
          checked={gender === 'Male'}
          onPress={() => handleGenderChange('Male')}
          containerStyle={styles.checkBoxContainer}
          textStyle={styles.fontOregular}
          checkedIcon={<Ionicons name="checkmark-circle" size={24} color="black" />}
          uncheckedIcon={<Ionicons name="ellipse-outline" size={24} color="#ddd" />}
        />
        <CheckBox
          title="Female"
          checked={gender === 'Female'}
          onPress={() => handleGenderChange('Female')}
          containerStyle={styles.checkBoxContainer} 
          textStyle={styles.fontOregular}
          checkedIcon={<Ionicons name="checkmark-circle" size={24} color="black" />}
          uncheckedIcon={<Ionicons name="ellipse-outline" size={24} color="#ddd" />}
        />
        <CheckBox
          title="Non-Binary"
          checked={gender === 'Non-Binary'}
          onPress={() => handleGenderChange('Non-Binary')}
          containerStyle={styles.checkBoxContainer} 
          textStyle={styles.fontOregular}
          checkedIcon={<Ionicons name="checkmark-circle" size={24} color="black" />}
          uncheckedIcon={<Ionicons name="ellipse-outline" size={24} color="#ddd" />}
        />
      </View>

      {/* Living With Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle} className='font-oregular'>Living With</Text>
        {['HSV1-O', 'HSV1-G', 'HSV2-O', 'HSV2-G', 'HPV', 'HIV', 'Hepatitis B', 'Hepatitis C', 'Other'].map((condition) => (
          <CheckBox
            key={condition}
            title={condition}
            checked={livingWith.includes(condition)}
            onPress={() => handleLivingWithChange(condition)}
            containerStyle={styles.checkBoxContainer}
            textStyle={styles.fontOregular}
            checkedIcon={<Ionicons name="checkmark-circle" size={24} color="black" />}
          uncheckedIcon={<Ionicons name="ellipse-outline" size={24} color="#ddd" />}
          />
        ))}
      </View>
      <Text style={styles.sectionTitle} className='font-oregular'>Location</Text>

        <ProfileButton
          title="Update Location"
          onPress={() => router.push('/locationUpdate')}
        />
        <View style={{marginBottom: 80}}></View>

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
    textAlign: 'center',
    marginBottom: 30,
    paddingTop: 50,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: 10,
    marginTop: 20,
  },
  backButton: {
    position: 'absolute',
    top: 65,
    left: 20,
    borderRadius: 25,
    padding: 10,
    zIndex: 10,
  },
  input: {
    //backgroundColor: '#fff',
    fontSize: 16,
    padding: 10,
    borderColor: '#ddd',
    borderBottomWidth: 1,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    padding: 10,
    borderColor: '#ddd',
    bottomBorderWidth: 1,
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
    top: -10,
    right: -10,
    backgroundColor: 'black',
    borderRadius: 12,
    padding: 2,
  },
  deleteIcon: {
    color: '#fff',
  },
  checkBoxContainer: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderColor: '#f0f0f0',
    borderWidth: 2,
    borderRadius: 25,
    marginBottom: 8,
  },
  fontOregular: {
    fontFamily: 'Optima-Regular',
    fontSize: 16,
    fontWeight: 'light'
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
