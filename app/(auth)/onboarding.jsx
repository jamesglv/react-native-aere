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
import { saveUserProfile, uploadUserPhoto, calculateUserAge } from '../../firebaseActions';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Onboarding pages data
const onboardingPages = [
  { id: '1', title: "Let's start with your name." },
  { id: '2', title: 'Enter Your Birthdate' },
  { id: '3', title: 'Select Your Gender' },
  { id: '4', title: 'Who are you looking for?' },  // New page for selecting interested gender
  { id: '5', title: 'What are you living with?' },
  { id: '6', title: 'Share something about you' },
  { id: '7', title: 'Upload your public album' },
  { id: '8', title: "Finally, let's set your location" },
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
  const [interested, setInterested] = useState([]);

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

  //// Function to handle scroll and track the current page
  // const handleScroll = (event) => {
  //   const scrollPosition = event.nativeEvent.contentOffset.x;
  //   const newPage = Math.floor(scrollPosition / width);
  //   setCurrentPage(newPage);  // Update the current page state
  // };

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
    setInterested((prev) =>
      prev.includes(gender) ? prev.filter((item) => item !== gender) : [...prev, gender]
    );
  };

  const toggleLivingWith = (option) => {
    setLivingWith((prevState) => {
      if (prevState.includes(option)) {
        return prevState.filter((item) => item !== option);
      } else {
        return [...prevState, option];
      }
    });
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
  
    const interestedGenders = Object.keys(interested).filter(gender => interested[gender]);
    const age = calculateAge(day, month, year);
    try {
  
      // Upload photos and get URLs
      const photoUrls = [];
      for (let i = 0; i < photos.length; i++) {
        const uri = photos[i].uri;
        const base64Image = await convertImageToBase64(uri);
        const photoUrl = await uploadUserPhoto(base64Image, user.uid, false);
        photoUrls.push(photoUrl);
      }
  
      // Call Firebase function to save user data
      await saveUserProfile({
        name,
        birthdate: { day, month, year },
        age,
        gender,
        bio,
        photos: photoUrls,
        location,
        interested: interestedGenders,
        livingWith,
        onboardingCompleted: true,
        paused: false,
      });
  
      router.replace('/home');
    } catch (error) {
      Alert.alert('Error saving user data', error.message);
    }
  };
  
  // Helper to convert image to base64
  const convertImageToBase64 = async (uri) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]); // Get the base64 string
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const LivingWithCheckbox = ({ livingWith, toggleLivingWith, styles, title }) => (
    <View style={styles.checkboxContainer}>
      <TouchableOpacity
        key={livingWith}
        style={styles.checkbox}
        onPress={() => toggleLivingWith(title)}
      >
        <Ionicons
          name={livingWith.includes(title) ? 'checkmark-circle' : 'ellipse-outline'}
          size={24}
          color={livingWith.includes(title) ? 'white' : '#ddd'}
        />
        <Text style={styles.checkboxLabel} className='font-oregular'>{title}</Text>
      </TouchableOpacity>
    </View>
  );

  // Render the content for each page
  const renderPage = ({ item }) => {
    if (item.id === '1') {
      return (
        <View style={[styles.page, { width }]}>
          <Text style={styles.title}>{item.title}</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            placeholderTextColor={'#949494'}
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
              itemStyle={styles.pickerItemStyle} // Apply item style here
              onValueChange={(itemValue) => setDay(itemValue)}
            >
              {[...Array(31).keys()].map((_, i) => (
                <Picker.Item key={i + 1} label={`${i + 1}`} value={`${i + 1}`} style={styles.pickerItemStyle} />
              ))}
            </Picker>
            <Picker
              selectedValue={month}
              style={styles.picker}
              itemStyle={styles.pickerItemStyle} // Apply item style here
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
              itemStyle={styles.pickerItemStyle} // Apply item style here
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
            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                key={gender}
                style={styles.checkbox}
                onPress={() => setGender('Male')}
              >
                <Ionicons
                  name={gender.includes('Male') ? 'checkmark-circle' : 'ellipse-outline'}
                  size={24}
                  color={gender.includes('Male') ? 'white' : '#ddd'}
                />
                <Text style={styles.checkboxLabel} className='font-oregular'>Male</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                key={gender}
                style={styles.checkbox}
                onPress={() => setGender('Female')}
              >
                <Ionicons
                  name={gender.includes('Female') ? 'checkmark-circle' : 'ellipse-outline'}
                  size={24}
                  color={gender.includes('Female') ? 'white' : '#ddd'}
                />
                <Text style={styles.checkboxLabel} className='font-oregular'>Female</Text>
              </TouchableOpacity>
          </View>
          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              key={gender}
              style={styles.checkbox}
              onPress={() => setGender('Non-Binary')}
            >
              <Ionicons
                name={gender.includes('Non-Binary') ? 'checkmark-circle' : 'ellipse-outline'}
                size={24}
                color={gender.includes('Non-Binary') ? 'white' : '#ddd'}
              />
              <Text style={styles.checkboxLabel} className='font-oregular'>Non-Binary</Text>
            </TouchableOpacity>
          </View>
          </View>
        </View>
      );
    } else if (item.id === '4') {
      return (
        <View style={[styles.page, { width }]}>
          <Text style={styles.title}>{item.title}</Text>
          <View style={styles.interestedContainer}>
          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              key={interested}
              style={styles.checkbox}
              onPress={() => toggleInterest('Male')}
            >
              <Ionicons
                name={interested.includes('Male') ? 'checkmark-circle' : 'ellipse-outline'}
                size={24}
                color={interested.includes('Male') ? 'white' : '#ddd'}
              />
              <Text style={styles.checkboxLabel} className='font-oregular'>Men</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              key={interested}
              style={styles.checkbox}
              onPress={() => toggleInterest('Female')}
            >
              <Ionicons
                name={interested.includes('Female') ? 'checkmark-circle' : 'ellipse-outline'}
                size={24}
                color={interested.includes('Female') ? 'white' : '#ddd'}
              />
              <Text style={styles.checkboxLabel} className='font-oregular'>Women</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              key={interested}
              style={styles.checkbox}
              onPress={() => toggleInterest('Non-Binary')}
            >
              <Ionicons
                name={interested.includes('Non-Binary') ? 'checkmark-circle' : 'ellipse-outline'}
                size={24}
                color={interested.includes('Non-Binary') ? 'white' : '#ddd'}
              />
              <Text style={styles.checkboxLabel} className='font-oregular'>Non-Binary</Text>
            </TouchableOpacity>
          </View>
          </View>
        </View>
      );
    } else if (item.id === '5') {
      return (
        <View style={[styles.page, { width }]}>
          <Text style={styles.title}>{item.title}</Text>
          <View style={styles.livingWithContainer}>
            <LivingWithCheckbox
              livingWith={livingWith}
              toggleLivingWith={toggleLivingWith}
              styles={styles}
              title="HSV1-O"
            />
            <LivingWithCheckbox
              livingWith={livingWith}
              toggleLivingWith={toggleLivingWith}
              styles={styles}
              title="HSV1-G"
            />
            <LivingWithCheckbox
              livingWith={livingWith}
              toggleLivingWith={toggleLivingWith}
              styles={styles}
              title="HSV2-O"
            />
            <LivingWithCheckbox
              livingWith={livingWith}
              toggleLivingWith={toggleLivingWith}
              styles={styles}
              title="HSV2-G"
            />
            <LivingWithCheckbox
              livingWith={livingWith}
              toggleLivingWith={toggleLivingWith}
              styles={styles}
              title="HPV"
            />
            <LivingWithCheckbox
              livingWith={livingWith}
              toggleLivingWith={toggleLivingWith}
              styles={styles}
              title="HIV"
            />
            <LivingWithCheckbox
              livingWith={livingWith}
              toggleLivingWith={toggleLivingWith}
              styles={styles}
              title="Hepatitis B"
            />
            <LivingWithCheckbox
              livingWith={livingWith}
              toggleLivingWith={toggleLivingWith}
              styles={styles}
              title="Hepatitis C"
            />
            <LivingWithCheckbox
              livingWith={livingWith}
              toggleLivingWith={toggleLivingWith}
              styles={styles}
              title="Other"
            />
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
            placeholderTextColor={'#949494'}
            multiline
            numberOfLines={4}
            value={bio}
            onChangeText={setBio}
          />
        </View>
      );
    } else if (item.id === '7') {
      return (
        <View style={[styles.page, { width }, {marginTop: '60%'}]}>
          <Text style={styles.title}>{item.title}</Text>
          <TouchableOpacity style={styles.selectPhotosButton} onPress={pickPhotos}>
            <Text style={styles.photosButtonText}>
              {photos.length < 6 ? 'Select Images' : 'Max photos selected'}
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
                    <Ionicons name="close-outline" style={styles.deleteIcon} size={18}/>
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
      {/* Next button */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity onPress={handleNext}>
          <Text style={styles.buttonText}>
            {currentPage === onboardingPages.length - 1 ? 'Finish' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>

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
    color: '#fff',
    marginBottom: 10,
    fontFamily: 'Optima',
  },
  input: {
    borderRadius: 1,
    borderBottomColor: 'white',
    borderBottomWidth: 1,
    borderColor: 'white',
    padding: 10,
    width: '80%',
    marginTop: 10,
    fontSize: 18,
    color: 'white',
    placeholderTextColor: 'red',
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
    bottom: 100,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontFamily: 'Optima',
    color: 'white',
    marginHorizontal: 20,
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
    color: 'white',  // Text color inside picker
  },
  pickerItemStyle: {
    color: 'white',  // Text color for picker items
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
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 25,
    marginTop: 20,
  },
  photoCarousel: {
    padding: 40,
    marginTop: 20,
    flexDirection: 'row',
  },
  photoContainer: {
    position: 'relative',
    marginRight: 15,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 5,
  },
  deleteButton: {
    position: 'absolute',
    top: -15,
    right: -15,
    backgroundColor: 'black',
    padding: 5,
    borderRadius: 15,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  deleteIcon: {
    color: '#fff',
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: 'white',
    borderWidth: 1,
    borderRadius: 25,
    width: '100%',
    padding: 10,
    marginVertical: 10,
  },
  checkbox: {
    flexDirection: 'row',
  },
  checkboxLabel: {
    marginLeft: 10,
    fontSize: 18,
    color: '#fff',
  },
  selectPhotosButton: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 25,
    marginTop: 40,
  },
  photosButtonText: {
    fontSize: 18,
    color: 'black',
    fontFamily: 'Optima',
    paddingHorizontal: 10,
  },
});

export default Onboarding;
