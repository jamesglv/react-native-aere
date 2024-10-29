// firebaseActions.js
import { getFunctions, httpsCallable } from "firebase/functions";
import { Alert } from 'react-native';

const functions = getFunctions();

// Function to fetch current user data from Firebase Functions
export const fetchCurrentUserData = async (uid, setCurrentUserData, setCurrentUserLocation) => {
    const fetchCurrentUserDataFunc = httpsCallable(functions, 'fetchCurrentUserData');
  
    try {
      const response = await fetchCurrentUserDataFunc({ uid });
  
      if (response.data) {
        const userData = response.data;
        setCurrentUserData({
          likedUsers: userData.likedUsers || [],
          declinedUsers: userData.declinedUsers || [],
          hiddenProfiles: userData.hiddenProfiles || []
        });
        setCurrentUserLocation(userData.location);
      } else {
        console.log("No user data found.");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      throw error;  // Throw the error for client handling
    }
  };

export const fetchProfiles = async (currentUserId, likedUsers, declinedUsers, setProfiles) => {
    const functions = getFunctions();  // Initialize Firebase Functions instance
    const fetchProfilesFunc = httpsCallable(functions, 'fetchProfiles');
  
    try {
      const response = await fetchProfilesFunc({
        currentUserId,
        likedUsers,
        declinedUsers,
      });
  
      if (response.data && response.data.length > 0) {
        setProfiles(response.data);  // Set the profiles state with the response data
      } else {
        console.log("No profiles found.");
      }
    } catch (error) {
      console.error("Error fetching profiles:", error);
      Alert.alert("Error", "Failed to load profiles.");
    }
  };

export const handleLike = async (currentUserId, targetUserId, setProfiles, profiles) => {
  try {
    const handleLikeFunc = httpsCallable(functions, 'handleLike');
    const response = await handleLikeFunc({ currentUserId, targetUserId });

    if (response.data.success) {
      setProfiles(profiles.filter(profile => profile.id !== targetUserId));
    } else {
      console.log("Failed to like profile.");
      Alert.alert("Error", "Failed to like the profile.");
    }
  } catch (error) {
    console.error("Error liking user:", error);
    Alert.alert("Error", "Failed to like user");
  }
};

export const handleDecline = async (currentUserId, targetUserId, setProfiles, profiles) => {
  try {
    const handleDeclineFunc = httpsCallable(functions, 'handleDecline');
    const response = await handleDeclineFunc({ currentUserId, targetUserId });

    if (response.data.success) {
      setProfiles(profiles.filter(profile => profile.id !== targetUserId));
    } else {
      console.log("Failed to decline profile.");
      Alert.alert("Error", "Failed to decline the profile.");
    }
  } catch (error) {
    console.error("Error declining user:", error);
    Alert.alert("Error", "Failed to decline user");
  }
};

export const handleRequestAccess = async (currentUserId, targetUserId, setSelectedProfile, setShowModal) => {
  try {
    const handleRequestAccessFunc = httpsCallable(functions, 'handleRequestAccess');
    const response = await handleRequestAccessFunc({ currentUserId, targetUserId });

    if (response.data.success) {
      setSelectedProfile(targetUserId);
      setShowModal(true);
    } else {
      console.log("Failed to send access request.");
      Alert.alert("Error", "Failed to send access request.");
    }
  } catch (error) {
    console.error("Error requesting access:", error);
    Alert.alert("Error", "Failed to send access request");
  }
};

export const handleSharePrivateAlbum = async (currentUserId, targetUserId, setShowModal) => {
  try {
    const handleSharePrivateAlbumFunc = httpsCallable(functions, 'handleSharePrivateAlbum');
    const response = await handleSharePrivateAlbumFunc({ currentUserId, targetUserId });

    if (response.data.success) {
      setShowModal(false);
    } else {
      console.log("Failed to share private album.");
      Alert.alert("Error", "Failed to share private album.");
    }
  } catch (error) {
    console.error("Error sharing private album:", error);
    Alert.alert("Error", "Failed to share private album");
  }
};
