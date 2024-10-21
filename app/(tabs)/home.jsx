import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, RefreshControl, TouchableOpacity, Alert, Dimensions, StyleSheet, StatusBar, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FIREBASE_DB, FIREBASE_AUTH } from '../../firebaseConfig';  // Import Firestore config
import { getDocs, collection, doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';  // Firestore functions
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';  // Icon library for settings button
import { LinearGradient } from 'expo-linear-gradient';
import RangeSlider from 'react-native-range-slider-expo';  // Import the range slider
import Slider from '@react-native-community/slider'; 
import haversine from 'haversine-distance';  // Import haversine formula function

const { width, height } = Dimensions.get('window');  // Get screen dimensions

const Home = () => {
  const [profiles, setProfiles] = useState([]);  // Store user profiles
  const [refreshing, setRefreshing] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false); // State to control the filter modal visibility
  const [minAge, setMinAge] = useState(18);  // Minimum age
  const [maxAge, setMaxAge] = useState(60);  // Maximum age
  const [maxDistance, setMaxDistance] = useState(50);  // Maximum distance (in km)
  const [selectedGenders, setSelectedGenders] = useState([]);  // Store selected gender filters
  const [currentUserLocation, setCurrentUserLocation] = useState(null);  // Store the current user's location
  const [filteredProfiles, setFilteredProfiles] = useState([]);  // Store filtered profiles
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

  // Function to handle the logout
  const handleLogout = async () => {
    try {
      await signOut(FIREBASE_AUTH);
      router.replace('/sign-in');  // Navigate to sign-in screen after logout
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const toggleFilterModal = () => {
    setFilterModalVisible(!filterModalVisible); // Toggle the visibility of the filter modal
  };

  // Fetch profiles from Firestore
  const fetchProfiles = async () => {
    try {
      const profilesSnapshot = await getDocs(collection(FIREBASE_DB, 'users'));
      const profilesData = profilesSnapshot.docs.map(doc => {
        const data = doc.data();
        return { id: doc.id, ...data };
      }).filter(profile => {
        return profile.id !== currentUserId
          && !currentUserData.likedUsers.includes(profile.id)
          && !currentUserData.declinedUsers.includes(profile.id);
      });

      setProfiles(profilesData);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      Alert.alert('Error', 'Failed to load profiles');
    }
  };

  // Filter profiles based on age, distance, and gender
  const filterProfiles = () => {
    const filtered = profiles.filter(profile => {
      // Filter by age
      const isWithinAgeRange = profile.age >= minAge && profile.age <= maxAge;

      // Filter by distance (use haversine formula)
      let isWithinDistance = true;
      if (currentUserLocation && profile.location) {
        const distance = haversine(currentUserLocation, profile.location) / 1000; // Convert meters to km
        isWithinDistance = distance <= maxDistance;
      }

      // Filter by gender
      const isGenderSelected = selectedGenders.length === 0 || selectedGenders.includes(profile.gender);

      return isWithinAgeRange && isWithinDistance && isGenderSelected;
    });

    setFilteredProfiles(filtered);
  };

  useEffect(() => {
    if (currentUserId) {
      fetchProfiles();  // Fetch profiles after currentUserData updates
    }
  }, [currentUserId, currentUserData]);

  // Update filter profiles when sliders or gender filters change
  useEffect(() => {
    if (profiles.length > 0) {
      filterProfiles();
    }
  }, [minAge, maxAge, maxDistance, selectedGenders, profiles]);

  useEffect(() => {
    // Fetch current user location (this would be retrieved from the user's profile data)
    // Assuming we have latitude and longitude stored in the user profile
    const fetchUserLocation = async () => {
      const userDoc = await getDoc(doc(FIREBASE_DB, 'users', currentUserId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setCurrentUserLocation(userData.location); // Assuming location is stored as { latitude, longitude }
      }
    };

    fetchUserLocation();
  }, [currentUserId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfiles();
    setRefreshing(false);
  };

  const toggleGender = (gender) => {
    if (selectedGenders.includes(gender)) {
      // Prevent deselecting if it's the last selected gender
      if (selectedGenders.length === 1) {
        //Alert.alert('Error', 'At least one gender must be selected.');
      } else {
        // Remove gender if already selected
        setSelectedGenders(selectedGenders.filter((g) => g !== gender));
      }
    } else {
      // Add gender to selected list
      setSelectedGenders([...selectedGenders, gender]);
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

        {/* If there are no profiles, show this view */}
        {filteredProfiles.length === 0 ? (
          <View style={styles.noProfilesContainer}>
            <Text style={styles.noProfilesText}>There are no profiles available. Adjust the filters to find more matches.</Text>
            <TouchableOpacity style={styles.adjustFiltersButton} onPress={toggleFilterModal}>
              <Text style={styles.adjustFiltersButtonText}>Adjust Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
        // Profile Carousel
        <FlatList
          data={filteredProfiles}
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
        )}

        {/* Settings Button */}
        <TouchableOpacity style={styles.settingsButton} onPress={toggleFilterModal}>
          <Ionicons name="settings-outline" size={30} color="#fff" />
        </TouchableOpacity>

        {/* Filter Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={filterModalVisible}
          onRequestClose={toggleFilterModal}
        >
          <View style={styles.modalOverlay}>
            <LinearGradient
              colors={['transparent','rgba(0,0,0,1)', 'rgba(0,0,0,1)']}  // Gradient from black to transparent
              style={StyleSheet.absoluteFillObject}  // Fill the overlay completely
            />
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Filter by Age</Text>

              {/* Age Range Slider */}
              <RangeSlider
                min={18}
                max={60}
                fromValueOnChange={setMinAge}
                toValueOnChange={setMaxAge}
                initialFromValue={minAge}
                initialToValue={maxAge}
                styleSize="medium"
                fromKnobColor="#007bff"
                toKnobColor="#007bff"
                inRangeBarColor="#007bff"
                outOfRangeBarColor="#ddd"
              />
              <View style={styles.ageLabelContainer}>
                <Text style={styles.ageLabel}>Min Age: {minAge}</Text>
                <Text style={styles.ageLabel}>Max Age: {maxAge}</Text>
              </View>

              {/* Distance Slider */}
              <Slider
                style={{ width: '90%', height: 60 }}  // Set the width and height of the slider
                minimumValue={1}
                maximumValue={500}
                value={maxDistance}
                onValueChange={setMaxDistance}
                minimumTrackTintColor="#007bff"
                maximumTrackTintColor="#ddd"
                thumbTintColor="#007bff"
              />
              <View style={styles.ageLabelContainer}>
                <Text style={styles.ageLabel}>Max Distance: {Math.round(maxDistance)} km</Text>
              </View>

              {/* Gender Checkboxes */}
              <Text style={styles.modalTitle}>Filter by Gender</Text>
              <View style={styles.checkboxContainer}>
                <TouchableOpacity style={styles.checkbox} onPress={() => toggleGender('Male')}>
                  <Ionicons
                    name={selectedGenders.includes('Male') ? 'checkbox' : 'square-outline'}
                    size={24}
                    color={selectedGenders.includes('Male') ? '#007bff' : '#ddd'}
                  />
                  <Text style={styles.checkboxLabel}>Male</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.checkbox} onPress={() => toggleGender('Female')}>
                  <Ionicons
                    name={selectedGenders.includes('Female') ? 'checkbox' : 'square-outline'}
                    size={24}
                    color={selectedGenders.includes('Female') ? '#007bff' : '#ddd'}
                  />
                  <Text style={styles.checkboxLabel}>Female</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.checkbox} onPress={() => toggleGender('Non-Binary')}>
                  <Ionicons
                    name={selectedGenders.includes('Non-Binary') ? 'checkbox' : 'square-outline'}
                    size={24}
                    color={selectedGenders.includes('Non-Binary') ? '#007bff' : '#ddd'}
                  />
                  <Text style={styles.checkboxLabel}>Non-Binary</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={toggleFilterModal}>
                <Text style={styles.closeModalText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  noProfilesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',  // White background for no profiles state
  },
  noProfilesText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#333',
    marginBottom: 20,
  },
  adjustFiltersButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 20,
    paddingHorizontal: 20,
  },
  adjustFiltersButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  carousel: {
    alignItems: 'center',
  },
  card: {
    width: width,
    height: height,
    backgroundColor: '#fff',
    justifyContent: 'flex-start',
  },
  profileImage: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: height * 0.5,
    resizeMode: 'cover',
  },
  textContainer: {
    marginTop: height * 0.5,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginBottom: 10,
  },
  bio: {
    fontSize: 16,
    color: '#1c1c1e',
    lineHeight: 22,
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
  settingsButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 10,
    borderRadius: 30,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',  // Align to the bottom of the screen
  },
  modalContent: {
    width: '100%',
    height: '60%',  // Adjust percentage as needed
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  closeModalText: {
    color: '#007bff',
    fontSize: 18,
    marginTop: 20,
  },
  ageLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  ageLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkboxLabel: {
    marginLeft: 10,
    fontSize: 18,
    color: '#333',
  },
});

export default Home;
