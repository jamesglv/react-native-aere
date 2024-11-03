import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity, FlatList, Modal, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FIREBASE_AUTH } from '../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { fetchTargetUserData, handleRequestAccess } from '../firebaseActions'; // Import the fetchUserData and handleRequestAccess functions

const { width, height } = Dimensions.get('window');

import placeholder1 from '../assets/images/placeholder-profile-1.png';
import placeholder2 from '../assets/images/placeholder-profile-2.png';
import placeholder3 from '../assets/images/placeholder-profile-3.png';

const UserProfiles = () => {
  const { userId } = useLocalSearchParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);  // New state for request status
  const [isModalVisible, setModalVisible] = useState(false);
  const navigation = useNavigation();
  const currentUserId = FIREBASE_AUTH.currentUser?.uid;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  useEffect(() => {
    const checkAccessStatus = () => {
      if (user) {
        setHasRequested(user.privateRequests?.includes(currentUserId) || false);
        setHasAccess(user.privateAccepted?.includes(currentUserId) || false);
      }
    };
    checkAccessStatus();
  }, [user]);

  useEffect(() => {
    const fetchUser = async () => {
      if (!currentUserId) {
        Alert.alert('Error', 'User not authenticated. Please log in.');
        router.push('/login'); // Redirect to login page
        return;
      }
      try {
        const userData = await fetchTargetUserData(userId, ['privateAccepted', 'privateRequests', 'privatePhotos', 'photos', 'name', 'age', 'bio', 'livingWith']);
        setUser(userData);

        // Check if the current user has access to the private album
        if (userData.privateAccepted && userData.privateAccepted.includes(currentUserId)) {
          setHasAccess(true);
        }

        // Check if the current user has already requested access
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

  if (!user) {
    return <Text style={styles.errorText}>Loading user data...</Text>;
  }

  const privatePhotos = user.privatePhotos?.slice(0, 3) || [];
  const placeholders = [placeholder1, placeholder2, placeholder3];
  const displayPhotos = [...privatePhotos, ...placeholders].slice(0, 3);

  const openPhotoViewer = async () => {
    if (hasAccess) {
      setModalVisible(true);  // Open modal if access is granted
    } else if (!hasRequested) {
      try {
        await handleRequestAccess(currentUserId, userId);
        setHasRequested(true);
      } catch (error) {
        console.error("Error requesting access:", error);
        Alert.alert('Error', 'Failed to send request. Please try again later.');
      }
    }
  };

  const handleRequestAccessButton = async () => {
    if (hasRequested) return;

    try {
      await handleRequestAccess(currentUserId, userId);
      Alert.alert('Request Sent', 'Your access request has been sent.');
      setHasRequested(true);
    } catch (error) {
      console.error('Error requesting access:', error);
      Alert.alert('Error', 'Failed to send access request.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Photos Carousel */}
      <View style={styles.photoCarouselContainer}>
        <FlatList
          data={user.photos}
          keyExtractor={(photo, index) => index.toString()}
          renderItem={({ item: photo }) => (
            <Image source={{ uri: photo }} style={styles.profileImage} />
          )}
          pagingEnabled
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* User Information */}
      <View style={styles.infoContainer}>
        <Text style={styles.name} className='font-obold'>{user.name}, {user.age}</Text>
        {Array.isArray(user.livingWith) && user.livingWith.length > 0 && (
          <Text className='font-oregular' style={styles.livingWith}>
            {profile.livingWith.join(', ')}
          </Text>
        )}
        <Text style={styles.bio}>{user.bio}</Text>
        
        {/* Private Album Section */}
        <View style={styles.privateAlbumContainer}>
          <Text style={styles.privateAlbumTitle} className='font-oregular'>Private Album</Text>
          <View style={styles.privatePhotosContainer}>
            {displayPhotos.map((photo, index) => (
              <Image
                key={index}
                source={typeof photo === 'string' ? { uri: photo } : photo}
                style={styles.privatePhoto}
                blurRadius={hasAccess ? 0 : 15}
              />
            ))}
          </View>
          <TouchableOpacity
            style={styles.requestAccessButton}
            onPress={hasAccess ? openPhotoViewer : handleRequestAccessButton}
            disabled={hasRequested}
          >
            <Text style={styles.requestAccessButtonText}>
              {hasAccess ? 'View Album' : hasRequested ? 'Requested' : 'Request Access'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Full-screen Photo Viewer Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <FlatList
            data={user.privatePhotos}
            keyExtractor={(photo, index) => index.toString()}
            renderItem={({ item: photo }) => (
              <Image source={{ uri: photo }} style={styles.fullScreenImage} />
            )}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
          />
          <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
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
    marginTop: -20,
    // borderTopLeftRadius: 20,
    // borderTopRightRadius: 20,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  livingWith: { fontSize: 18, paddingBottom: 10},
  bio: {
    fontSize: 16,
    color: '#1c1c1e',
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
  errorText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: width,
    height: height,
    resizeMode: 'contain',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    padding: 10,
  },
});

export default UserProfiles;
