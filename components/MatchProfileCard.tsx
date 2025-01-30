import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MatchProfileCardProps } from '../constants/types';

const { width, height } = Dimensions.get('window');

const MatchProfileCard: React.FC<MatchProfileCardProps> = ({
  profile,
  handleRequestAccess,
  handleSharePrivateAlbum,
  hasAccess,
  hasRequested,
}) => {
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  const [isPhotoViewerVisible, setIsPhotoViewerVisible] = useState(false);

  // Placeholder images for private album
  const placeholderImages: (string | number)[] = [
    require('../assets/images/placeholder-profile-1.png'),
    require('../assets/images/placeholder-profile-2.png'),
    require('../assets/images/placeholder-profile-3.png'),
  ];

  // Merge actual private photos with placeholders
  const privatePhotos: (string | number)[] = [
    ...(profile.privatePhotos || []).slice(0, 3),
    ...placeholderImages.slice((profile.privatePhotos || []).length),
  ];

  const onRequestAccess = () => {
    handleRequestAccess(profile.id);
    setIsShareModalVisible(true);
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

      {/* Profile Info */}
      <View style={styles.textContainer}>
        <Text style={[styles.name, { letterSpacing: 1.5 }]}>{profile.name}, {profile.age}</Text>
        {profile.livingWith && profile.livingWith.length > 0 && (
          <Text style={styles.livingWith}>{profile.livingWith.join(', ')}</Text>
        )}
        <Text style={styles.bio}>{profile.bio}</Text>

        {/* Private Album */}
        {profile.privatePhotos && profile.privatePhotos.length > 0 && (
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
            <TouchableOpacity
              style={styles.requestAccessButton}
              onPress={hasAccess ? () => setIsPhotoViewerVisible(true) : onRequestAccess}
              disabled={hasRequested && !hasAccess}
            >
              <Text style={styles.requestAccessText}>
                {hasAccess ? 'View Album' : hasRequested ? 'Requested' : 'Request Access'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Share Confirmation Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={isShareModalVisible}
        onRequestClose={() => setIsShareModalVisible(false)}
      >
        <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)']} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>Would you like to share your private album with this user?</Text>

            <TouchableOpacity
              style={styles.shareButton}
              onPress={() => {
                handleSharePrivateAlbum(profile.id);
                setIsShareModalVisible(false);
              }}
            >
              <Text style={styles.shareButtonText}>Share your private album</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeModalButton} onPress={() => setIsShareModalVisible(false)}>
              <Ionicons name="close" size={25} color="black" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Modal>

      {/* Photo Viewer Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={isPhotoViewerVisible}
        onRequestClose={() => setIsPhotoViewerVisible(false)}
      >
        <View style={styles.photoViewerOverlay}>
          <FlatList
            data={profile.privatePhotos}
            horizontal
            pagingEnabled
            keyExtractor={(photo, index) => index.toString()}
            renderItem={({ item: photo }) => (
              <Image source={{ uri: photo }} style={styles.fullScreenImage} />
            )}
          />
          <TouchableOpacity style={styles.closePhotoViewerButton} onPress={() => setIsPhotoViewerVisible(false)}>
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>
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
  albumTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  blurredImagesContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  blurredImage: { width: 100, height: 100, borderRadius: 10 },
  requestAccessButton: { backgroundColor: '#6a6a6a', paddingVertical: 15, borderRadius: 8, alignItems: 'center' },
  requestAccessText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  livingWith: { fontSize: 18, paddingBottom: 10},

  // Modal styles
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', padding: 20, backgroundColor: '#fff', borderRadius: 10, alignItems: 'center' },
  modalText: { fontSize: 18, marginBottom: 20, textAlign: 'center' },
  shareButton: { backgroundColor: '#6a6a6a', padding: 15, borderRadius: 5, alignItems: 'center', marginVertical: 10 },
  shareButtonText: { color: '#fff', fontSize: 16 },
  closeModalButton: { marginTop: 10 },
  closeModalText: { color: '#007bff', fontSize: 16 },

    // Photo Viewer styles
    photoViewerOverlay: { flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' },
    fullScreenImage: { width: width, height: height, resizeMode: 'contain' },
    closePhotoViewerButton: { position: 'absolute', top: 40, right: 20 },
});

export default MatchProfileCard;
