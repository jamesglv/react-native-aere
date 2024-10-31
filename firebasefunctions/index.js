const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

// FETCH USER DATA SELECTIVELY

exports.fetchUserData = functions.https.onCall(async (data, context) => {
    const { fields } = data;
  
    // Ensure the user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to fetch profile data.'
      );
    }
  
    const userId = context.auth.uid;
  
    try {
      const userDocRef = db.collection('users').doc(userId);
      const userDoc = await userDocRef.get();
  
      if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'User profile not found');
      }
  
      const userData = userDoc.data();
  
      // Ensure selectedData only contains requested fields
      const selectedData = fields.reduce((result, field) => {
        if (userData.hasOwnProperty(field)) {
          result[field] = userData[field];
        }
        return result;
      }, {});
  
      return { userData: selectedData };
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw new functions.https.HttpsError('internal', 'Failed to fetch user data');
    }
  });
  
/**
 * Fetches profiles securely from Firestore with server-side filtering.
 */
exports.fetchProfiles = functions.https.onCall(async (data, context) => {
    const { currentUserId, likedUsers, declinedUsers } = data;
  
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to fetch profiles.'
      );
    }
  
    try {
      const profilesRef = db.collection('users');
      const snapshot = await profilesRef.get();  // Fetch all profiles, removing paused filter for debugging
  
      // Initialize an array to store filtered profiles
      const profiles = [];
      snapshot.forEach(doc => {
        const profile = doc.data();
        const isNotPaused = profile.paused === false || profile.paused === undefined;
  
        console.log("Checking profile:", profile);
  
        // Apply filters to include only profiles that match criteria
        if (
          doc.id !== currentUserId &&
          !likedUsers.includes(doc.id) &&
          !declinedUsers.includes(doc.id) &&
          isNotPaused  // Ensure profile is not paused
        ) {
          profiles.push({ id: doc.id, ...profile });
        }
      });
  
      console.log("Total profiles matched:", profiles.length);
      return profiles;
    } catch (error) {
      console.error("Error fetching profiles:", error);
      throw new functions.https.HttpsError(
        'internal',
        'Unable to fetch profiles.'
      );
    }
  });
  

/**
 * Handles 'Like' action securely and updates the necessary Firestore fields.
 */
exports.handleLike = functions.https.onCall(async (data, context) => {
  const { currentUserId, targetUserId } = data;

  if (!context.auth || context.auth.uid !== currentUserId) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to like a profile.'
    );
  }

  try {
    const currentUserRef = db.collection('users').doc(currentUserId);
    const targetUserRef = db.collection('users').doc(targetUserId);

    await currentUserRef.update({
      likedUsers: admin.firestore.FieldValue.arrayUnion(targetUserId),
      hiddenProfiles: admin.firestore.FieldValue.arrayUnion(targetUserId),
    });

    await targetUserRef.update({
      receivedLikes: admin.firestore.FieldValue.arrayUnion(currentUserId),
    });

    return { success: true };
  } catch (error) {
    console.error("Error handling like:", error);
    throw new functions.https.HttpsError(
      'internal',
      'Unable to like user.'
    );
  }
});

/**
 * Handles 'Decline' action securely and updates the necessary Firestore fields.
 */
exports.handleDecline = functions.https.onCall(async (data, context) => {
  const { currentUserId, targetUserId } = data;

  if (!context.auth || context.auth.uid !== currentUserId) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to decline a profile.'
    );
  }

  try {
    const currentUserRef = db.collection('users').doc(currentUserId);
    const targetUserRef = db.collection('users').doc(targetUserId);

    await currentUserRef.update({
      declinedUsers: admin.firestore.FieldValue.arrayUnion(targetUserId),
      hiddenProfiles: admin.firestore.FieldValue.arrayUnion(targetUserId),
    });

    await targetUserRef.update({
      receivedDeclines: admin.firestore.FieldValue.arrayUnion(currentUserId),
    });

    return { success: true };
  } catch (error) {
    console.error("Error handling decline:", error);
    throw new functions.https.HttpsError(
      'internal',
      'Unable to decline user.'
    );
  }
});

/**
 * Handles the private album sharing securely.
 */
exports.handleSharePrivateAlbum = functions.https.onCall(async (data, context) => {
  const { currentUserId, targetUserId } = data;

  if (!context.auth || context.auth.uid !== currentUserId) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to share private album.'
    );
  }

  try {
    const currentUserRef = db.collection('users').doc(currentUserId);

    await currentUserRef.update({
      privateAccepted: admin.firestore.FieldValue.arrayUnion(targetUserId),
    });

    return { success: true };
  } catch (error) {
    console.error("Error sharing private album:", error);
    throw new functions.https.HttpsError(
      'internal',
      'Unable to share private album.'
    );
  }
});

/**
 * Handles access requests for private albums.
 */
exports.handleRequestAccess = functions.https.onCall(async (data, context) => {
  const { currentUserId, targetUserId } = data;

  if (!context.auth || context.auth.uid !== currentUserId) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to request access.'
    );
  }

  try {
    const targetUserRef = db.collection('users').doc(targetUserId);

    await targetUserRef.update({
      privateRequests: admin.firestore.FieldValue.arrayUnion(currentUserId),
    });

    return { success: true };
  } catch (error) {
    console.error("Error requesting access:", error);
    throw new functions.https.HttpsError(
      'internal',
      'Unable to request access.'
    );
  }
});


//
// MATCHES FUNCTIONS
//

exports.fetchMatches = functions.https.onCall(async (data, context) => {
    const { userId } = data;
  
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to fetch matches.'
      );
    }
  
    try {
      // Fetch the user's document and matches
      const userDocRef = db.collection('users').doc(userId);
      const userSnapshot = await userDocRef.get();
  
      if (!userSnapshot.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'User not found'
        );
      }
  
      const userData = userSnapshot.data();
      const matchIds = userData.matches || [];
  
      // Fetch match profiles in parallel
      const matchPromises = matchIds.map(async (matchId) => {
        const matchDocRef = db.collection('matches').doc(matchId);
        const matchDocSnapshot = await matchDocRef.get();
  
        if (matchDocSnapshot.exists) {
          const matchData = matchDocSnapshot.data();
          const usersInMatch = matchData.users || [];
          const messagePreview = matchData.messagePreview || '';
          const lastMessage = matchData.lastMessage || 0;
          const readStatus = matchData.read || {};
  
          const otherUserId = usersInMatch.find((id) => id !== userId);
          
          if (otherUserId) {
            const otherUserDocRef = db.collection('users').doc(otherUserId);
            const otherUserSnapshot = await otherUserDocRef.get();
            
            if (otherUserSnapshot.exists) {
              return {
                id: otherUserId,
                matchId,
                messagePreview,
                lastMessage,
                readStatus,
                ...otherUserSnapshot.data(),
              };
            }
          }
        }
        return null;
      });
  
      // Await all match profile fetches and sort
      const matchProfiles = await Promise.all(matchPromises);
      const sortedMatches = matchProfiles
        .filter(profile => profile !== null)
        .sort((a, b) => b.lastMessage - a.lastMessage);
  
      return { matches: sortedMatches };
    } catch (error) {
      console.error("Error fetching matches:", error);
      throw new functions.https.HttpsError("internal", "Error fetching matches");
    }
  });

  exports.deleteMatch = functions.https.onCall(async (data, context) => {
    const { userId, matchId } = data;
  
    // Ensure the user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to delete a match.'
      );
    }
  
    try {
      // Remove the match from the user's matches array
      const userDocRef = db.collection('users').doc(userId);
      await userDocRef.update({
        matches: admin.firestore.FieldValue.arrayRemove(matchId),
      });
  
      // Optional: Delete match document or perform further cleanup if necessary
      const matchDocRef = db.collection('matches').doc(matchId);
      await matchDocRef.delete();
  
      return { success: true, message: 'Match deleted successfully.' };
    } catch (error) {
      console.error('Error deleting match:', error);
      throw new functions.https.HttpsError('internal', 'Error deleting match');
    }
  });

  exports.updateReadStatus = functions.https.onCall(async (data, context) => {
    const { matchId, userId } = data;
  
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to update read status.'
      );
    }
  
    try {
      const matchDocRef = db.collection('matches').doc(matchId);
  
      // Update the read status for the current user
      await matchDocRef.update({
        [`read.${userId}`]: true,
      });
  
      return { success: true, message: 'Read status updated successfully.' };
    } catch (error) {
      console.error("Error updating read status:", error);
      throw new functions.https.HttpsError('internal', 'Error updating read status');
    }
  });


  //
  // LIKES FUNCTIONS
  //

  exports.fetchReceivedLikes = functions.https.onCall(async (data, context) => {
    const { userId } = data;
  
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to fetch received likes.'
      );
    }
  
    try {
      // Fetch the current user's document
      const userDocRef = db.collection('users').doc(userId);
      const userSnapshot = await userDocRef.get();
  
      if (!userSnapshot.exists) {
        throw new functions.https.HttpsError('not-found', 'User not found');
      }
  
      const userData = userSnapshot.data();
      const receivedLikesIds = userData.receivedLikes || [];
  
      // Fetch profiles of users who liked the current user
      const receivedLikesProfiles = await Promise.all(
        receivedLikesIds.map(async (likeUserId) => {
          const likeUserRef = db.collection('users').doc(likeUserId);
          const likeUserSnapshot = await likeUserRef.get();
          if (likeUserSnapshot.exists()) {
            return { id: likeUserId, ...likeUserSnapshot.data() };
          }
          return null;
        })
      );
  
      // Filter out any null values
      return { receivedLikes: receivedLikesProfiles.filter(profile => profile !== null) };
    } catch (error) {
      console.error("Error fetching received likes:", error);
      throw new functions.https.HttpsError('internal', 'Error fetching received likes');
    }
  });

  