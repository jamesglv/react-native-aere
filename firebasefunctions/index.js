const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

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
