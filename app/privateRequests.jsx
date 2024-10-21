import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { FIREBASE_DB, FIREBASE_AUTH } from '../firebaseConfig'; // Firebase config
import { doc, getDoc, updateDoc, arrayRemove, arrayUnion } from 'firebase/firestore'; // Firestore functions
import { useRouter } from 'expo-router';

const PrivateRequests = () => {
  const [requests, setRequests] = useState([]); // List of private access requests
  const [accepted, setAccepted] = useState([]); // List of accepted users
  const [isLoading, setIsLoading] = useState(true); // Loading state for fetching data
  const currentUser = FIREBASE_AUTH.currentUser; // Get current user
  const router = useRouter(); // Navigation

  // Function to fetch private requests and accepted users
  const fetchPrivateRequests = async () => {
    if (!currentUser) return;

    try {
      const userDocRef = doc(FIREBASE_DB, 'users', currentUser.uid);
      const userSnapshot = await getDoc(userDocRef);

      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        setRequests(userData.privateRequests || []);
        setAccepted(userData.privateAccepted || []);
      }
    } catch (error) {
      console.error('Error fetching private requests:', error);
      Alert.alert('Error', 'Failed to load private requests.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchPrivateRequests();
  }, []);

  // Function to accept a request
  const handleAccept = async (userId) => {
    try {
      const userDocRef = doc(FIREBASE_DB, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        privateRequests: arrayRemove(userId), // Remove from requests
        privateAccepted: arrayUnion(userId),  // Add to accepted
      });
      setRequests(requests.filter((id) => id !== userId)); // Update UI
      setAccepted([...accepted, userId]);
    } catch (error) {
      console.error('Error accepting request:', error);
      Alert.alert('Error', 'Failed to accept the request.');
    }
  };

  // Function to delete a request
  const handleDelete = async (userId) => {
    try {
      const userDocRef = doc(FIREBASE_DB, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        privateRequests: arrayRemove(userId), // Remove from requests
      });
      setRequests(requests.filter((id) => id !== userId)); // Update UI
    } catch (error) {
      console.error('Error deleting request:', error);
      Alert.alert('Error', 'Failed to delete the request.');
    }
  };

  // Render each request
  const renderRequest = ({ item }) => (
    <View style={styles.requestContainer}>
      <Text style={styles.userText}>User ID: {item}</Text>
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.acceptButton} onPress={() => handleAccept(item)}>
          <Text style={styles.acceptText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item)}>
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render each accepted request
  const renderAccepted = ({ item }) => (
    <View style={styles.acceptedContainer}>
      <Text style={styles.userText}>User ID: {item}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Private Photo Requests</Text>

      {/* Display requests */}
      <Text style={styles.sectionTitle}>Requests</Text>
      {isLoading ? (
        <Text>Loading requests...</Text>
      ) : requests.length > 0 ? (
        <FlatList
          data={requests}
          renderItem={renderRequest}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <Text style={styles.noRequestsText}>No requests available.</Text>
      )}

      {/* Display accepted requests */}
      <Text style={styles.sectionTitle}>Accepted Requests</Text>
      {accepted.length > 0 ? (
        <FlatList
          data={accepted}
          renderItem={renderAccepted}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <Text style={styles.noRequestsText}>No accepted requests.</Text>
      )}
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  listContainer: {
    paddingBottom: 20,
  },
  noRequestsText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#999',
    marginBottom: 20,
  },
  requestContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  acceptedContainer: {
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  userText: {
    fontSize: 16,
    color: '#333',
  },
  actionsContainer: {
    flexDirection: 'row',
  },
  acceptButton: {
    backgroundColor: 'green',
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  acceptText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
  },
  deleteText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default PrivateRequests;
