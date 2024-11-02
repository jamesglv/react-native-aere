// ProfileCard.jsx
import React, { useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, Modal, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faHeart } from '@fortawesome/free-solid-svg-icons/faHeart';

const { width, height } = Dimensions.get('window');

const ProfileCard = ({ profile, handleLike, handleDecline, handleRequestAccess, handleSharePrivateAlbum }) => {
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);

  // Placeholder images for the private album
  const placeholderImages = [
    require('../assets/images/placeholder-profile-1.png'),
    require('../assets/images/placeholder-profile-2.png'),
    require('../assets/images/placeholder-profile-3.png'),
  ];

  const privatePhotos = [
    ...(profile.privatePhotos || []).slice(0, 3),
    ...placeholderImages.slice((profile.privatePhotos || []).length),
  ];

  // Open the share modal when the user requests access
  const onRequestAccess = () => {
    handleRequestAccess(profile.id); // Handle initial request
    setIsShareModalVisible(true);    // Show confirmation modal
  };

  
  return (
    <View style={styles.card}>
      {/* Photo Carousel */}
      <View style={styles.photoCarouselContainer}>
        <FlatList
          data={profile.photos}
          pagingEnabled
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          keyExtractor={(photo, index) => index.toString()}
          renderItem={({ item: photo }) => (
            <Image source={{ uri: photo }} style={styles.profileImage} />
          )}
        />
      </View>

      {/* Profile Text */}
      <View style={styles.textContainer}>
        <Text style={styles.name}>{profile.name}, {profile.age}</Text>
        {Array.isArray(profile.livingWith) && profile.livingWith.length > 0 && (
          <Text style={styles.livingWith}>
            {profile.livingWith.join(', ')}
          </Text>
        )}
        <Text style={styles.bio}>{profile.bio}</Text>
        {/* Private Album */}
        <View style={styles.privateAlbumContainer}>
          <Text style={styles.albumTitle}>Private Album</Text>
          <View style={styles.blurredImagesContainer}>
            {privatePhotos.map((photo, index) => (
              <Image
                key={index}
                source={typeof photo === 'string' ? { uri: photo } : photo}
                style={styles.blurredImage}
                blurRadius={30}
              />
            ))}
          </View>
          <TouchableOpacity style={styles.requestAccessButton} onPress={onRequestAccess}>
            <Text style={styles.requestAccessText}>Like and Request Access</Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.likeButton} onPress={() => handleLike(profile.id)}>
            <FontAwesomeIcon icon={faHeart} size={30} color="black" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.declineButton} onPress={() => handleDecline(profile.id)}>
            <Ionicons name="close" size={30} color="black" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Share Confirmation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isShareModalVisible}
        onRequestClose={() => setIsShareModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>Would you like to share your private album with this user?</Text>

            {/* Share Private Album Button */}
            <TouchableOpacity
              style={styles.shareButton}
              onPress={() => {
                handleSharePrivateAlbum(profile.id);
                handleLike(profile.id);
                setIsShareModalVisible(false); // Close modal after sharing
              }}
            >
              <Text style={styles.shareButtonText}>Share your private album</Text>
            </TouchableOpacity>

            {/* Close Modal Button */}
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setIsShareModalVisible(false)}
            >
              <Text style={styles.closeModalText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Define styles for ProfileCard component
const styles = StyleSheet.create({
  card: { width: width, height: height, backgroundColor: '#fff', justifyContent: 'flex-start' },
  photoCarouselContainer: { height: height * 0.5 },
  profileImage: { width: '100%', height: height * 0.5, resizeMode: 'cover' },
  textContainer: { paddingHorizontal: 20, paddingTop: 20 },
  name: { fontSize: 28, fontWeight: 'bold', color: '#1c1c1e', marginBottom: 10 },
  bio: { fontSize: 16, color: '#1c1c1e', lineHeight: 22 },
  privateAlbumContainer: { marginTop: 20, padding: 15, backgroundColor: '#f9f9f9', borderRadius: 10 },
  albumTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  blurredImagesContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  blurredImage: { width: 70, height: 70, borderRadius: 10 },
  requestAccessButton: { backgroundColor: '#007bff', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  requestAccessText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  actionButtons: { position: 'absolute', right: 20, top: height / 2 - 600, alignItems: 'center', height: 130, justifyContent: 'space-between' },
  likeButton: { backgroundColor: '#fff', padding: 23, marginBottom: 25, borderRadius: 50, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 5 },
  declineButton: { backgroundColor: '#fff', padding: 15, borderRadius: 50, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 5 },
  livingWith: { fontSize: 18, paddingBottom: 10},

  // Modal styles
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '80%', padding: 20, backgroundColor: '#fff', borderRadius: 10, alignItems: 'center' },
  modalText: { fontSize: 18, marginBottom: 20, textAlign: 'center' },
  shareButton: { backgroundColor: '#007bff', padding: 10, borderRadius: 5, alignItems: 'center', marginVertical: 10 },
  shareButtonText: { color: '#fff', fontWeight: 'bold' },
  closeModalButton: { marginTop: 10 },
  closeModalText: { color: '#007bff', fontSize: 16 },
});

export default ProfileCard;
