const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch');
admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();

//
// ONBOARDING FUNCTIONS
//

// Function to save user profile data
exports.saveUserProfile = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to save profile data.');
  }
  const userId = context.auth.uid;
  const { name, birthdate, age, gender, bio, photos, location, interested, livingWith, paused } = data;

  try {
    await db.collection('users').doc(userId).set({
      name,
      birthdate,
      age,
      gender,
      bio,
      photos,
      location,
      interested,
      livingWith,
      paused,
      onboardingCompleted: true
    }, { merge: true });
    return { success: true };
  } catch (error) {
    console.error("Error saving user data:", error);
    throw new functions.https.HttpsError('internal', 'Failed to save user data');
  }
});

// Function to upload user photo
exports.uploadUserPhoto = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to upload photos.');
  }
  const { base64Photo, userId, isPrivate } = data;

  try {
    const uniqueId = uuid.v4();
    const folder = isPrivate ? 'private' : 'public';
    const filePath = `users/${userId}/${folder}/photo-${uniqueId}.jpg`;

    // Convert the base64 string back to binary and upload
    const buffer = Buffer.from(base64Photo, 'base64');
    const file = storage.file(filePath);
    await file.save(buffer, { contentType: 'image/jpeg' });

    const downloadUrl = await file.getSignedUrl({ action: 'read', expires: '03-17-2025' });
    return { downloadUrl: downloadUrl[0] };
  } catch (error) {
    console.error("Error uploading photo:", error);
    throw new functions.https.HttpsError('internal', 'Failed to upload photo');
  }
});

// Function to calculate age based on birthdate
exports.calculateUserAge = functions.https.onCall(async (data, context) => {
  const { birthDay, birthMonth, birthYear } = data;

  try {
    const today = new Date();
    const birthDate = new Date(birthYear, birthMonth - 1, birthDay);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return { age };
  } catch (error) {
    console.error("Error calculating age:", error);
    throw new functions.https.HttpsError('internal', 'Failed to calculate age');
  }
});

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
exports.updateGenderPreferences = functions.https.onCall(async (data, context) => {
  const { currentUserId, updatedGenders } = data;

  if (!context.auth || context.auth.uid !== currentUserId) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to update gender preferences.'
    );
  }

  try {
    const userDocRef = db.collection('users').doc(currentUserId);
    await userDocRef.update({ interested: updatedGenders });

    return { success: true };
  } catch (error) {
    console.error("Error updating gender preferences:", error);
    throw new functions.https.HttpsError(
      'internal',
      'Unable to update gender preferences.'
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

  //
  // PROFILE FUNCTIONS
  //

  exports.updateUserDocument = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to update profile data.'
      );
    }
  
    const userId = context.auth.uid;
    const { updatedData } = data;
  
    try {
      const userDocRef = db.collection('users').doc(userId);
      await userDocRef.update(updatedData);
      return { success: true };
    } catch (error) {
      console.error("Error updating user document:", error);
      throw new functions.https.HttpsError('internal', 'Failed to update user data');
    }
  });

  exports.uploadPhoto = functions.https.onCall(async (data, context) => {
    // Ensure user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to upload photos.');
    }
  
    const { base64Image, userId, isPrivate } = data;
  
    if (!base64Image || !userId) {
      throw new functions.https.HttpsError('invalid-argument', 'Image data and user ID are required.');
    }
  
    const bucket = admin.storage().bucket();  // Get the default storage bucket
    const filename = `users/${userId}/${isPrivate ? 'private' : 'public'}/photo-${uuidv4()}.jpg`;
    const file = bucket.file(filename);
  
    try {
      // Decode the base64 image
      const buffer = Buffer.from(base64Image, 'base64');
  
      // Upload the image to Firebase Storage
      await file.save(buffer, {
        metadata: { contentType: 'image/jpeg' },
      });
  
      // Make the image publicly accessible
      await file.makePublic();
  
      // Return the public URL of the uploaded image
      return { downloadUrl: file.publicUrl() };
    } catch (error) {
      console.error('Error uploading photo:', error);
      throw new functions.https.HttpsError('internal', 'Error uploading photo.');
    }
  });

exports.deletePhoto = functions.https.onCall(async (data, context) => {
  const { userId, photoPath, isPrivate } = data;

  if (!context.auth || context.auth.uid !== userId) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to delete a photo.'
    );
  }

  try {
    // Decode the path and remove any leading or bucket references
    const decodedPath = decodeURIComponent(photoPath)
      .replace(/^gs:\/\/[^\/]+\//, '') // Remove "gs://bucket-name/" if included
      .replace(/^https:\/\/[^\/]+\/[^\/]+\//, ''); // Remove "https://bucket-name/" if included

    // Step 1: Remove the photo URL from Firestore
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User document not found.');
    }

    // Determine whether it's a public or private photo and remove the URL from Firestore
    const photosField = isPrivate ? 'privatePhotos' : 'photos';
    const updatedPhotos = userDoc.data()[photosField].filter((url) => !url.includes(decodedPath));
    await userRef.update({ [photosField]: updatedPhotos });

    // Step 2: Delete the file from Firebase Storage
    const bucket = storage.bucket();
    await bucket.file(decodedPath).delete();

    return { success: true, message: 'Photo deleted successfully from Firestore and Storage' };
  } catch (error) {
    console.error('Error deleting photo:', error);
    throw new functions.https.HttpsError('internal', 'Failed to delete photo.');
  }
});