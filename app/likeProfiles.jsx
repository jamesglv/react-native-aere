import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, Alert, FlatList, ScrollView, Modal, Button } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FIREBASE_DB, FIREBASE_AUTH } from '../firebaseConfig';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, setDoc } from 'firebase/firestore';
import uuid from 'react-native-uuid';  // Use react-native-uuid for generating UUIDs
import { Ionicons } from '@expo/vector-icons';
import { Timestamp } from 'firebase/firestore';
import MatchModal from '../components/MatchModal';

import { useNavigation } from '@react-navigation/native';
import { fetchTargetUserData, handleRequestAccess as handleRequestAccessAction, handleMatch as handleMatchAction, declineUser as declineUserAction, handleSharePrivateAlbum } from '../firebaseActions'; // Import the fetchUserData and handleRequestAccess functions
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faHeart } from '@fortawesome/free-solid-svg-icons';
import ProfileCard from '../components/ProfileCard';
import Loading from '../components/Loading';


import placeholder1 from '../assets/images/placeholder-profile-1.png';
import placeholder2 from '../assets/images/placeholder-profile-2.png';
import placeholder3 from '../assets/images/placeholder-profile-3.png';

const { width, height } = Dimensions.get('window');

const likeProfiles = () => {
  const { userId } = useLocalSearchParams();  // Get the userId from the route parameters
  const router = useRouter();  // Router to navigate
  const currentUserId = FIREBASE_AUTH.currentUser.uid;  // Get the logged-in user's ID
  const [user, setUser] = useState(null);
  const navigation = useNavigation();
  const [hasAccess, setHasAccess] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null); // Add this line
  const [showModal, setShowModal] = useState(false); // Add this line
  const [isMatchModalVisible, setIsMatchModalVisible] = useState(false);

  console.log(isMatchModalVisible);
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  useEffect(() => {
    const fetchUser = async () => {
      if (!currentUserId) {
        Alert.alert('Error', 'User not authenticated. Please log in.');
        router.push('/login');
        return;
      }
      try {
        const userData = await fetchTargetUserData(userId, ['privateAccepted', 'privateRequests', 'privatePhotos', 'photos', 'name', 'age', 'bio', 'livingWith']);
        setUser(userData);

        if (userData.privateAccepted && userData.privateAccepted.includes(currentUserId)) {
          setHasAccess(true);
        }

        if (userData.privateRequests && userData.privateRequests.includes(currentUserId)) {
          setHasRequested(true);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        Alert.alert('Error', 'Failed to load user data.');
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId, currentUserId]);

  const handleMatch = async () => {
    try {
      setIsMatchModalVisible(true);
      await handleMatchAction(currentUserId, userId);
      //router.back();
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const handleDecline = async () => {
    try {
      await declineUserAction(currentUserId, userId);
      router.back();
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const goToMatches = () => {
    setIsMatchModalVisible(false);
    router.back();
    router.push('/matches'); // Adjust the route based on your routing setup
  };

  const backToLikes = async () => {
    setIsMatchModalVisible(false);
    router.back();
  };

  const handleRequestAccess = async () => {
    if (hasRequested) return;
  
    try {
      await handleRequestAccessAction(currentUserId, userId);
      Alert.alert('Request Sent', 'Your access request has been sent.');
      setHasRequested(true);
      setSelectedProfile(userId); // Set the selected profile
      setShowModal(true); // Show the modal
    } catch (error) {
      console.error('Error requesting access:', error);
      Alert.alert('Error', 'Failed to send access request.');
    }
  };

  if (!user) {
    return <Loading />;
  }

  const privatePhotos = (user.privatePhotos || []).slice(0, 3);
  const placeholders = [placeholder1, placeholder2, placeholder3];
  const displayPhotos = [...privatePhotos, ...placeholders].slice(0, 3);

  const targetUserId = userId; // Get the target user ID
  return (
    <>
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <MatchModal
            isVisible={isMatchModalVisible}
            onClose={() => setIsMatchModalVisible(false)}
            goToMatches={goToMatches}
            backToLikes={backToLikes}
        />
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
          <FlatList
            data={[user]}
            horizontal
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ProfileCard
                profile={item}
                handleLike={handleMatch}
                handleDecline={handleDecline}
                handleRequestAccess={() => handleRequestAccess(currentUserId, userId, setSelectedProfile, setShowModal)}
                handleSharePrivateAlbum={() => handleSharePrivateAlbum(currentUserId, userId, setShowModal)}
              />
            )}
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            //refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            contentContainerStyle={styles.profilesCarousel}
            bounces={false}
          />
        
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 25,
    zIndex: 10,
  },
  photoCarouselContainer: {
    height: height * 0.5,
    width: '100%',
  },
  profileImage: {
    width: width,
    height: height * 0.5,
    resizeMode: 'cover',
  },
  infoContainer: {
    padding: 20,
    backgroundColor: '#fff',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  livingWith: { fontSize: 18, paddingBottom: 10 },
  bio: {
    fontSize: 16,
    color: '#1c1c1e',
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
  privateAlbumContainer: { 
    marginTop: 20, 
    padding: 15, 
    backgroundColor: '#f9f9f9', 
    borderRadius: 10 
  },
  privateAlbumTitle: {
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#333', 
    marginBottom: 15,
  },
  privatePhotosContainer: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 10
  },
  privatePhoto: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  requestAccessButton: {
    backgroundColor: '#6a6a6a', 
    paddingVertical: 15, 
    borderRadius: 8, 
    alignItems: 'center'
  },
  requestAccessButtonText: {
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 16
  },
  actionButtons: { 
    position: 'absolute', 
    right: 20, 
    top: height / 2 - 600, 
    alignItems: 'center', 
    height: 130, 
    justifyContent: 'space-between' 
  },
  likeButton: { 
    backgroundColor: '#fff', 
    padding: 23, 
    marginBottom: 25, 
    borderRadius: 50, 
    alignItems: 'center', 
    justifyContent: 'center', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.2, 
    shadowRadius: 2, 
    elevation: 5 
  },
  declineButton: { 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 50, 
    alignItems: 'center', 
    justifyContent: 'center', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.2, 
    shadowRadius: 2, 
    elevation: 5 
  },
});

export default likeProfiles;
