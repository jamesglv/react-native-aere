// firebaseActions.js
import { getFunctions, httpsCallable } from "firebase/functions";
import { FIREBASE_AUTH } from './firebaseConfig';
import { Alert } from 'react-native';

const functions = getFunctions();

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
