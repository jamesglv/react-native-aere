import React, { useState, useRef, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Dimensions, TextInput, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { FIREBASE_DB, FIREBASE_AUTH, FIREBASE_STORAGE } from '../../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';  // Firestore functions
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';  // Firebase Storage
import * as ImagePicker from 'expo-image-picker';  // Image Picker
import MapView, { Marker } from 'react-native-maps';  // Google Maps
import * as Location from 'expo-location';  // Expo location services
import uuid from 'react-native-uuid';

const { width } = Dimensions.get('window');

// Onboarding pages data
const onboardingPages = [
  { id: '1', title: 'Enter Your Name' },
  { id: '2', title: 'Enter Your Birthdate' },
  { id: '3', title: 'Select Your Gender' },
  { id: '4', title: 'Interested In' },  // New page for selecting interested gender
  { id: '5', title: 'What are you living with?' },
  { id: '6', title: 'Enter Your Bio' },
  { id: '7', title: 'Upload Your Photos' },
  { id: '8', title: 'Set Your Location' },
];

const Onboarding = () => {
  const router = useRouter();
  const flatListRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(0);

  // Track form inputs
  const [name, setName] = useState('');
  const [day, setDay] = useState('1');  // Default to 1st day
  const [month, setMonth] = useState('1');  // Default to January
  const [year, setYear] = useState('2000');  // Default to the year 2000
  const [gender, setGender] = useState('');
  const [livingWith, setLivingWith] = useState([]);
  const [bio, setBio] = useState('');
  const [photos, setPhotos] = useState([]);  // Array to store selected photos (max 6)
  const [isUploading, setIsUploading] = useState(false);  // Track upload state
  const [location, setLocation] = useState(null);  // User's selected location (latitude, longitude)
  const [region, setRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });  // Default region for the map
  // New state to track "Interested In" selection
  const [interested, setInterested] = useState({
    male: false,
    female: false,
    nonBinary: false,
  });

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'We need access to your location.');
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      setRegion({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    })();
  }, []);

  // Helper function to calculate age from birthdate
  const calculateAge = (birthDay, birthMonth, birthYear) => {
    const today = new Date();
    const birthDate = new Date(birthYear, birthMonth - 1, birthDay); // Months are zero-indexed
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Function to handle scroll and track the current page
  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const newPage = Math.floor(scrollPosition / width);
    setCurrentPage(newPage);  // Update the current page state
  };

  const handleNext = async () => {
    // Check validation for each page
    if (currentPage === 0 && !name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    if (currentPage === 1 && (!day || !month || !year)) {
      Alert.alert('Error', 'Please enter your birthdate');
      return;
    }
    if (currentPage === 2 && !gender) {
      Alert.alert('Error', 'Please select your gender');
      return;
    }
    if (currentPage === 3 && !Object.values(interested).some(Boolean)) {
      Alert.alert('Error', 'Please select at least one option for who you are interested in');
      return;
    }
    if (currentPage === 4 && livingWith.length === 0) {
      Alert.alert('Error', 'Please select what you are living with');
      return;
    }
    if (currentPage === 5 && !bio.trim()) {
      Alert.alert('Error', 'Please enter your bio');
      return;
    }
    if (currentPage === 6 && photos.length === 0) {
      Alert.alert('Error', 'Please upload at least one photo');
      return;
    }
    if (currentPage === 7 && !location) {
      Alert.alert('Error', 'Please set your location');
      return;
    }
  
    // Proceed to next page if not on the last page
    if (currentPage < onboardingPages.length - 1) {
      setCurrentPage((prevPage) => {
        const nextPage = prevPage + 1;
        flatListRef.current.scrollToIndex({ index: nextPage, animated: true });
        return nextPage;
      });
    } else {
      await saveUserData();  // Final page, save user data
    }
  };  

  // Handler to toggle "Interested In" selections
  const toggleInterest = (gender) => {
    setInterested((prev) => ({ ...prev, [gender]: !prev[gender] }));
  };

  // Function to pick multiple photos (up to 6)
  const pickPhotos = async () => {
    console.log('Photo picker triggered');

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'We need access to your camera roll.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,  // Enable multiple selection
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      selectionLimit: 6 - photos.length,  // Limit to 6 total
    });

    if (!result.canceled && result.assets) {
      const newPhotos = result.assets.map(asset => ({ uri: asset.uri }));
      
      if (photos.length + newPhotos.length > 6) {
        Alert.alert('Limit exceeded', 'You can only upload a maximum of 6 photos.');
        return;
      }

      setPhotos(prevPhotos => [...prevPhotos, ...newPhotos]);  // Add new photos to the state
    }
  };

  // Delete photo from the selected list
  const deletePhoto = (index) => {
    const updatedPhotos = [...photos];
    updatedPhotos.splice(index, 1);  // Remove the photo at the given index
    setPhotos(updatedPhotos);
  };

  // Upload a single image to Firebase Storage and get the URL
  const uploadPhoto = async (uri, userId, index) => {
    try {
      console.log("Starting upload for URI:", uri);
  
      // Generate a unique, URL-safe filename using UUID
      const uniqueId = uuid.v4();  // Generate a UUID
      const fileName = `photo-${uniqueId}`;  // Use UUID to ensure uniqueness
  
      const response = await fetch(uri);
      const blob = await response.blob();  // Convert to blob
      console.log("Blob created successfully");
  
      // Prepare the Firebase Storage reference
      const photoRef = ref(FIREBASE_STORAGE, `users/${userId}/${fileName}`);
  
      // Upload the blob to Firebase Storage
      await uploadBytes(photoRef, blob);
  
      // Retrieve the download URL
      const downloadUrl = await getDownloadURL(photoRef);
      console.log("Download URL:", downloadUrl);
  
      return downloadUrl;  // Return the URL-safe download URL
    } catch (error) {
      console.error("Error uploading photo:", error);
      throw error;
    }
  };

  // Save user data to Firestore
  const saveUserData = async () => {
    const user = FIREBASE_AUTH.currentUser;
    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    const age = calculateAge(day, month, year);  // Calculate age

    const interestedGenders = Object.keys(interested).filter(gender => interested[gender]);

    try {
      // Upload all photos to Firebase Storage and get their URLs
      const photoUrls = [];
      for (let i = 0; i < photos.length; i++) {
        const photoUrl = await uploadPhoto(photos[i].uri, user.uid, i);
        photoUrls.push(photoUrl);
      }

      // Save user data to Firestore
      await setDoc(doc(FIREBASE_DB, 'users', user.uid), {
        name: name,
        birthdate: {
          day: day,
          month: month,
          year: year,
        },
        age: age,
        gender: gender,
        bio: bio,
        photos: photoUrls,  // Save photo URLs
        location: location,  // Save user location
        likedUsers: [],
        declinedUsers: [],
        receivedLikes: [],
        receivedDeclines: [],
        matches: [],
        interested: interestedGenders,
        privatePhotos: [],
        privateRequests: [],
        privateAccepted: [],
        onboardingCompleted: true,
        livingWith: livingWith,
        paused: false,
      }, { merge: true });  // Merge to avoid overwriting existing fields

      // Navigate to home after onboarding is complete
      router.replace('/home');
    } catch (error) {
      Alert.alert('Error saving user data', error.message);
    }
  };

  // Render the content for each page
  const renderPage = ({ item }) => {
    if (item.id === '1') {
      return (
        <View style={[styles.page, { width }]}>
          <Text style={styles.title}>{item.title}</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            value={name}
            onChangeText={setName}
          />
        </View>
      );
    } else if (item.id === '2') {
      return (
        <View style={[styles.page, { width }]}>
          <Text style={styles.title}>{item.title}</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={day}
              style={styles.picker}
              onValueChange={(itemValue) => setDay(itemValue)}
            >
              {[...Array(31).keys()].map((_, i) => (
                <Picker.Item key={i + 1} label={`${i + 1}`} value={`${i + 1}`} style={styles.pickerItemStyle} />
              ))}
            </Picker>
            <Picker
              selectedValue={month}
              style={styles.picker}
              onValueChange={(itemValue) => setMonth(itemValue)}
            >
              {[
                'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
              ].map((monthName, i) => (
                <Picker.Item key={i + 1} label={monthName} value={`${i + 1}`} style={styles.pickerItemStyle} />
              ))}
            </Picker>
            <Picker
              selectedValue={year}
              style={styles.picker}
              onValueChange={(itemValue) => setYear(itemValue)}
            >
              {[...Array(100).keys()].map((_, i) => (
                <Picker.Item key={i + 1923} label={`${i + 1923}`} value={`${i + 1923}`} style={styles.pickerItemStyle} />
              ))}
            </Picker>
          </View>
        </View>
      );
    } else if (item.id === '3') {
      return (
        <View style={[styles.page, { width }]}>
          <Text style={styles.title}>{item.title}</Text>
          <View style={styles.genderContainer}>
            <TouchableOpacity onPress={() => setGender('Male')}>
              <Text style={styles.genderOption}>{gender === 'Male' ? '✓ Male' : 'Male'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setGender('Female')}>
              <Text style={styles.genderOption}>{gender === 'Female' ? '✓ Female' : 'Female'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setGender('Non-binary')}>
              <Text style={styles.genderOption}>{gender === 'Non-binary' ? '✓ Non-binary' : 'Non-binary'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    } else if (item.id === '4') {
      return (
        <View style={[styles.page, { width }]}>
          <Text style={styles.title}>{item.title}</Text>
          <View style={styles.interestedContainer}>
            <TouchableOpacity onPress={() => toggleInterest('Male')}>
              <Text style={styles.checkboxOption}>
                {interested.male ? '✓ Male' : 'Male'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => toggleInterest('Female')}>
              <Text style={styles.checkboxOption}>
                {interested.female ? '✓ Female' : 'Female'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => toggleInterest('Non-Binary')}>
              <Text style={styles.checkboxOption}>
                {interested.nonBinary ? '✓ Non-Binary' : 'Non-Binary'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    } else if (item.id === '5') {
      return (
        <View style={[styles.page, { width }]}>
          <Text style={styles.title}>{item.title}</Text>
          <View style={styles.livingWithContainer}>
            <TouchableOpacity onPress={() => setLivingWith('HSV1-O')}>
              <Text style={styles.livingWithOption}>{livingWith === 'HSV1-O' ? '✓ HSV1-O' : 'HSV1-O'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setLivingWith('HSV1-G')}>
              <Text style={styles.livingWithOption}>{livingWith === 'HSV1-G' ? '✓ HSV1-G' : 'HSV1-G'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setLivingWith('HSV2-O')}>
              <Text style={styles.livingWithOption}>{livingWith === 'HSV2-O' ? '✓ HSV2-O' : 'HSV2-O'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    } else if (item.id === '6') {
      return (
        <View style={[styles.page, { width }]}>
          <Text style={styles.title}>{item.title}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell us about yourself"
            multiline
            numberOfLines={4}
            value={bio}
            onChangeText={setBio}
          />
        </View>
      );
    } else if (item.id === '7') {
      return (
        <View style={[styles.page, { width }]}>
          <Text style={styles.title}>{item.title}</Text>
          <TouchableOpacity style={styles.button} onPress={pickPhotos}>
            <Text style={styles.buttonText}>
              {photos.length < 6 ? 'Pick Photos (Max 6)' : 'Max photos selected'}
            </Text>
          </TouchableOpacity>

          {/* Carousel for selected photos */}
          <ScrollView horizontal style={styles.photoCarousel}>
            {photos.map((photo, index) => (
              <View key={index} style={styles.photoContainer}>
                <Image source={{ uri: photo.uri }} style={styles.photo} />
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deletePhoto(index)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      );
    } else if (item.id === '8') {
        return (
            <View style={[styles.page, { width }]}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>Drag the map to set your location</Text>
              <MapView
                style={{ width: '100%', height: 300 }} //styles.map
                region={region}
                onRegionChangeComplete={setRegion}
              >
                <Marker
                  coordinate={{ latitude: region.latitude, longitude: region.longitude }}
                  draggable
                  onDragEnd={(e) => setLocation(e.nativeEvent.coordinate)}
                />
              </MapView>
            </View>
          );
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={onboardingPages}
        renderItem={renderPage}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        ref={flatListRef}
        scrollEventThrottle={16}
        scrollEnabled={false}  // Disable swiping
      />

      {/* Pagination dots */}
      <View style={styles.pagination}>
        {onboardingPages.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              { backgroundColor: index === currentPage ? '#fff' : '#888' },
            ]}
          />
        ))}
      </View>

      {/* Next button */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity onPress={handleNext}>
          <Text style={styles.buttonText}>
            {currentPage === onboardingPages.length - 1 ? 'Finish' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1c1e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  page: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    width: '80%',
    marginTop: 10,
    fontSize: 18,
  },
  textArea: {
    height: 100,
  },
  pagination: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 70,
  },
  dot: {
    height: 10,
    width: 10,
    borderRadius: 5,
    marginHorizontal: 8,
    backgroundColor: '#888',
  },
  buttonsContainer: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
  },
  picker: {
    height: 50,
    width: 110,
    color: '#fff',  // Text color inside picker
  },
  pickerItemStyle: {
    color: '#fff',  // Text color for picker items
  },
  genderContainer: {
    flexDirection: 'column',  // Stack vertically
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    width: '80%',
    marginTop: 20,
  },
  genderOption: {
    fontSize: 18,
    color: '#fff',
    marginVertical: 10,  // Add spacing between gender options
  },
  livingWithContainer: {
    flexDirection: 'column',  // Stack vertically
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    width: '80%',
    marginTop: 20,
  },
  livingWithOption: {
    fontSize: 18,
    color: '#fff',
    marginVertical: 10,  // Add spacing between gender options
  },
  button: {
    backgroundColor: '#ff6347',
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  photoCarousel: {
    marginTop: 20,
    flexDirection: 'row',
  },
  photoContainer: {
    position: 'relative',
    marginRight: 10,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 5,
  },
  deleteButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#ff6347',
    padding: 5,
    borderRadius: 5,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  interestedContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: '80%',
    marginTop: 20,
  },
  checkboxOption: {
    fontSize: 18,
    color: '#fff',
    marginVertical: 10,
  },
});

export default Onboarding;
