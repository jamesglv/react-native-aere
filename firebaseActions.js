// firebaseActions.js
import { getFunctions, httpsCallable } from "firebase/functions";
import { FIREBASE_AUTH } from './firebaseConfig';
import { Alert } from 'react-native';

const functions = getFunctions();

//
// SIGN UP
//

export const createUserDocument = async (userId, email) => {
  const createUserDocFunc = httpsCallable(functions, 'createUserDocument');
  try {
    const response = await createUserDocFunc({
      userId,
      email,
      createdAt: new Date().toISOString(),
      // Add other fields if necessary
    });
    if (!response.data.success) {
      throw new Error('Failed to create user document');
    }
  } catch (error) {
    console.error("Error creating user document:", error);
    throw error;
  }
};

//
// ONBOARDING FUNCTIONS
//

export const saveUserProfile = async (userData) => {
  const saveUserProfileFunc = httpsCallable(functions, 'saveUserProfile');
  try {
    const response = await saveUserProfileFunc(userData);
    if (response.data.success) {
      console.log("User data saved successfully");
    } else {
      throw new Error("Failed to save user data");
    }
  } catch (error) {
    console.error("Error saving user data:", error);
    throw error;
  }
};

export const uploadUserPhoto = async (base64Image, userId, isPrivate) => {
  const uploadUserPhotoFunc = httpsCallable(functions, 'uploadUserPhoto');
  try {
      const response = await uploadUserPhotoFunc({ base64Image, userId, isPrivate });
      return response.data.downloadUrl; // Return the download URL
  } catch (error) {
      console.error('Error in uploadUserPhoto:', error);
      throw error;
  }
};

// FETCH USER DATA

export const fetchUserData = async (fields) => {
    const currentUserId = FIREBASE_AUTH.currentUser?.uid;
    if (!currentUserId) throw new Error("User not logged in");
  
    const fetchUserDataFunction = httpsCallable(functions, 'fetchUserData');
    const response = await fetchUserDataFunction({ fields });
  
    return response.data.userData;  // Access 'userData' from response
  };

  export const fetchProfiles = async (currentUserId, likedUsers, declinedUsers, setProfiles, limit = 20, lastVisibleProfile = null) => {
    const fetchProfilesFunc = httpsCallable(functions, 'fetchProfiles');
    try {
      const response = await fetchProfilesFunc({
        currentUserId,
        likedUsers,
        declinedUsers,
        limit,
        lastVisibleProfile,
      });
  
      if (response.data && response.data.length > 0) {
        setProfiles((prevProfiles) => {
          // Use a Map to filter out duplicate profile IDs
          const profilesMap = new Map(prevProfiles.map(profile => [profile.id, profile]));
          response.data.forEach(profile => {
            if (!profilesMap.has(profile.id)) {
              profilesMap.set(profile.id, profile);
            }
          });
          return Array.from(profilesMap.values());
        });
      } else {
        console.log("No more profiles found.");
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
export const updateGenderPreferences = async (currentUserId, updatedGenders) => {
  try {
    const updateGenderPreferencesFunc = httpsCallable(functions, 'updateGenderPreferences');
    const response = await updateGenderPreferencesFunc({ currentUserId, updatedGenders });

    if (response.data.success) {
      console.log("Gender preferences updated successfully.");
    } else {
      console.log("Failed to update gender preferences.");
      Alert.alert("Error", "Failed to update gender preferences.");
    }
  } catch (error) {
    console.error("Error updating gender preferences:", error);
    Alert.alert("Error", "Failed to update gender preferences.");
  }
};

//
// MATCHES FUNCTIONS
//

export const fetchMatches = async () => {
    const currentUserId = FIREBASE_AUTH.currentUser?.uid;
    if (!currentUserId) throw new Error("User not logged in");
  
    const fetchMatchesFunction = httpsCallable(functions, 'fetchMatches');
    const response = await fetchMatchesFunction({ userId: currentUserId });
    
    return response.data.matches;
  };

  export const deleteMatch = async (matchId) => {
    const currentUserId = FIREBASE_AUTH.currentUser?.uid;
    if (!currentUserId) throw new Error("User not logged in");
  
    const deleteMatchFunction = httpsCallable(functions, 'deleteMatch');
    const response = await deleteMatchFunction({ userId: currentUserId, matchId });
    
    return response.data;
  };

  export const updateReadStatus = async (matchId) => {
    const currentUserId = FIREBASE_AUTH.currentUser?.uid;
    if (!currentUserId) throw new Error("User not logged in");
  
    const updateReadStatusFunction = httpsCallable(functions, 'updateReadStatus');
    const response = await updateReadStatusFunction({ userId: currentUserId, matchId });
  
    return response.data;
  };


  //
  // LIKES FUNCTIONS
  //

  export const fetchReceivedLikes = async () => {
    const currentUserId = FIREBASE_AUTH.currentUser?.uid;
    if (!currentUserId) throw new Error("User not logged in");
  
    const fetchReceivedLikesFunction = httpsCallable(functions, 'fetchReceivedLikes');
    const response = await fetchReceivedLikesFunction({ userId: currentUserId });
  
    return response.data.receivedLikes;
  };

  //
  // PROFILE FUNCTIONS
  //

  // Cloud Function for updating user document
export const updateUserDocument = async (updatedData) => {
  const updateUserDocFunc = httpsCallable(functions, 'updateUserDocument');
  try {
    const response = await updateUserDocFunc({ updatedData });
    if (response.data.success) {
      console.log("User document updated successfully");
    } else {
      throw new Error("Failed to update document");
    }
  } catch (error) {
    console.error("Error updating user document:", error);
    Alert.alert("Error", "Failed to update profile.");
  }
};

export const uploadPhoto = async (base64Image, userId, isPrivate = false) => {
  const functions = getFunctions();
  const uploadPhotoFunc = httpsCallable(functions, 'uploadPhoto');

  try {
    const response = await uploadPhotoFunc({ base64Image, userId, isPrivate });
    return response.data.downloadUrl; // Return the photo's public URL
  } catch (error) {
    console.error('Error in uploadPhoto:', error);
    throw error;
  }
};

export const deletePhoto = async (userId, photoUrl, isPrivate) => {
  const deletePhotoFunc = httpsCallable(functions, 'deletePhoto');
  
  try {
    // Extract the path and ensure it's relative to the bucket
    const url = new URL(photoUrl);
    const bucketName = 'aere-react-native.appspot.com';
    let path = decodeURIComponent(url.pathname.replace(/^\/+/, '')); // Remove any leading slashes

    // Remove the bucket name from the path if present
    if (path.startsWith(`${bucketName}/`)) {
      path = path.replace(`${bucketName}/`, '');
    }

    console.log('Final cleaned photo path:', path);  // Debugging log to verify path format

    // Call the Firebase Function with the cleaned path
    const response = await deletePhotoFunc({ userId, photoPath: path, isPrivate });
    return response.data;
  } catch (error) {
    console.error('Error in deletePhoto:', error);
    throw error;
  }
};

//
// CHAT FUNCTIONS
//

export const sendMessage = async (matchId, messageText, senderID, receiverID) => {
  const sendMessageFunc = httpsCallable(functions, 'sendMessage');
  try {
    const response = await sendMessageFunc({
      matchId,
      messageText,
      senderID,
      receiverID,
    });
    if (!response.data.success) {
      throw new Error('Failed to send message');
    }
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};