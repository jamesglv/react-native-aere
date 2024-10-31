import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity, Alert, Dimensions, StyleSheet, StatusBar, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FIREBASE_DB, FIREBASE_AUTH } from '../../firebaseConfig';
import { getDoc, doc } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import haversine from 'haversine-distance';
import ProfileCard from '../../components/ProfileCard';
import FilterModal from '../../components/FilterModal';
import { fetchUserData, fetchProfiles, handleLike, handleDecline, handleRequestAccess, handleSharePrivateAlbum } from '../../firebaseActions';

const { width, height } = Dimensions.get('window');

const Home = () => {
  const [profiles, setProfiles] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [minAge, setMinAge] = useState(18);
  const [maxAge, setMaxAge] = useState(60);
  const [maxDistance, setMaxDistance] = useState(50);
  const [selectedGenders, setSelectedGenders] = useState([]);
  const [currentUserLocation, setCurrentUserLocation] = useState(null);
  const [filteredProfiles, setFilteredProfiles] = useState([]);
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserData, setCurrentUserData] = useState({ likedUsers: [], declinedUsers: [] });
  const [showModal, setShowModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);

  useEffect(() => {
    const user = FIREBASE_AUTH.currentUser;
    if (user) {
      setCurrentUserId(user.uid);
      fetchUserDetails(user.uid);
    } else {
      handleLogout();
    }
  }, []);

  // Fetch user data selectively
  const fetchUserDetails = async (uid) => {
    try {
      const userData = await fetchUserData(['likedUsers', 'declinedUsers', 'hiddenProfiles', 'location']);
      setCurrentUserData({
        likedUsers: userData.likedUsers || [],
        declinedUsers: userData.declinedUsers || [],
        hiddenProfiles: userData.hiddenProfiles || [],
      });
      setCurrentUserLocation(userData.location || null);
    } catch (error) {
      console.error("Error fetching user data:", error);
      Alert.alert("Error", "Failed to load user data. Please ensure you're signed in.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(FIREBASE_AUTH);
      router.replace('/sign-in');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const toggleFilterModal = () => {
    setFilterModalVisible(!filterModalVisible);
  };

  const loadProfiles = async () => {
    await fetchProfiles(currentUserId, currentUserData.likedUsers, currentUserData.declinedUsers, setProfiles);
  };

  const filterProfiles = () => {
    const filtered = profiles.filter(profile => {
      const isNotPaused = profile.paused === undefined || profile.paused === false;
      const isWithinAgeRange = profile.age >= minAge && profile.age <= maxAge;

      let isWithinDistance = true;
      if (currentUserLocation && profile.location) {
        const distance = haversine(currentUserLocation, profile.location) / 1000;
        isWithinDistance = distance <= maxDistance;
      }

      const isGenderSelected = selectedGenders.length === 0 || selectedGenders.includes(profile.gender);
      const isNotHidden = !currentUserData.hiddenProfiles?.includes(profile.id);

      return isNotPaused && isWithinAgeRange && isWithinDistance && isGenderSelected && isNotHidden;
    });

    setFilteredProfiles(filtered);
  };

  useEffect(() => {
    if (currentUserId) {
      loadProfiles();
    }
  }, [currentUserId, currentUserData]);

  useEffect(() => {
    if (profiles.length > 0) {
      filterProfiles();
    }
  }, [minAge, maxAge, maxDistance, selectedGenders, profiles]);

  useEffect(() => {
    const fetchUserLocation = async () => {
      const userDoc = await getDoc(doc(FIREBASE_DB, 'users', currentUserId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setCurrentUserLocation(userData.location);
      }
    };

    fetchUserLocation();
  }, [currentUserId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfiles();
    setRefreshing(false);
  };

  const toggleGender = (gender) => {
    if (selectedGenders.includes(gender)) {
      if (selectedGenders.length > 1) {
        setSelectedGenders(selectedGenders.filter((g) => g !== gender));
      }
    } else {
      setSelectedGenders([...selectedGenders, gender]);
    }
  };

  return (
    <>
      <StatusBar hidden={false} />
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <Modal animationType="slide" transparent={true} visible={showModal} onRequestClose={() => setShowModal(false)}>
          {/* Modal content for sharing private album */}
        </Modal>

        <FilterModal
          filterModalVisible={filterModalVisible}
          toggleFilterModal={toggleFilterModal}
          minAge={minAge}
          maxAge={maxAge}
          setMinAge={setMinAge}
          setMaxAge={setMaxAge}
          maxDistance={maxDistance}
          setMaxDistance={setMaxDistance}
          selectedGenders={selectedGenders}
          toggleGender={toggleGender}
        />

        {filteredProfiles.length === 0 ? (
          <View style={styles.noProfilesContainer}>
            <Text style={styles.noProfilesText}>No profiles available. Adjust filters to find matches.</Text>
            <TouchableOpacity style={styles.adjustFiltersButton} onPress={toggleFilterModal}>
              <Text style={styles.adjustFiltersButtonText}>Adjust Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredProfiles}
            horizontal
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ProfileCard
                profile={item}
                handleLike={(targetUserId) => handleLike(currentUserId, targetUserId, setProfiles, profiles)}
                handleDecline={(targetUserId) => handleDecline(currentUserId, targetUserId, setProfiles, profiles)}
                handleRequestAccess={(targetUserId) => handleRequestAccess(currentUserId, targetUserId, setSelectedProfile, setShowModal)}
                handleSharePrivateAlbum={(targetUserId) => handleSharePrivateAlbum(currentUserId, targetUserId, setShowModal)}
              />
            )}
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            contentContainerStyle={styles.profilesCarousel}
            bounces={false}
          />

        )}

        <TouchableOpacity style={styles.settingsButton} onPress={toggleFilterModal}>
          <Ionicons name="settings-outline" size={30} color="#fff" />
        </TouchableOpacity>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1c1c1e' },
  noProfilesContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  noProfilesText: { fontSize: 18, textAlign: 'center', color: '#333', marginBottom: 20 },
  adjustFiltersButton: { backgroundColor: '#007bff', padding: 10, borderRadius: 20, paddingHorizontal: 20 },
  adjustFiltersButtonText: { color: '#fff', fontSize: 16 },
  profilesCarousel: { alignItems: 'top' },
  settingsButton: { position: 'absolute', top: 40, right: 20, zIndex: 2, backgroundColor: 'rgba(0, 0, 0, 0.6)', padding: 10, borderRadius: 30 },
});

export default Home;
