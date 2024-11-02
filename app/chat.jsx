import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, Image, StyleSheet, TextInput, TouchableOpacity, FlatList, Dimensions, Animated, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';  // Get params from route and router for navigation
import { FIREBASE_DB, FIREBASE_AUTH } from '../firebaseConfig';  // Firestore config
import { doc, updateDoc, onSnapshot, arrayUnion } from 'firebase/firestore';  // Firestore functions
import { Timestamp } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons'; // Icon for the back button
import { useNavigation } from '@react-navigation/native';  // Use navigation hook
import { sendMessage as sendMessageAction } from '../firebaseActions'; // Import as sendMessageAction

const { width } = Dimensions.get('window');  // Get screen width for layout

const Chat = () => {
  // Get matchId, user name, and photo from navigation parameters
  const { matchId, name, photo, id } = useLocalSearchParams();
  console.log('id is', id);
  const router = useRouter(); // Router for navigation
  const currentUserId = FIREBASE_AUTH.currentUser?.uid;  // Get the current logged-in user's ID
  const matchDocRef = doc(FIREBASE_DB, 'matches', matchId);  // Reference to the correct match document using matchId
  const [messageText, setMessageText] = useState('');  // State to hold the typed message
  const [messages, setMessages] = useState([]);  // State to hold messages from Firestore
  const [dragged, setDragged] = useState({});  // State to track drag animation for messages
  const navigation = useNavigation();  // Access navigation

  // Remove default header bar by setting options in useLayoutEffect
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,  // Hide the default header bar
    });
  }, [navigation]);

  // Listen to messages in real-time
  useEffect(() => {
    const unsubscribe = onSnapshot(matchDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const matchData = docSnapshot.data();
        setMessages(matchData.messages || []);  // Set messages if they exist
      }
    });

    return () => unsubscribe();  // Cleanup the listener when the component is unmounted
  }, [matchDocRef]);

  // Function to send a message
  const sendMessageHandler = async () => {
    if (!messageText.trim()) return;

    try {
      await sendMessageAction(matchId, messageText, currentUserId, matchId);  // Call the function
      setMessageText('');  // Clear the text input
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert("Error", "Failed to send message. Please try again.");
    }
  };

  // Function to handle the back navigation
  const handleBack = () => {
    router.back(); // Go back to the previous screen
  };

  // Function to animate the message when swiped to reveal the timestamp
  const handleDrag = (index) => {
    const newDragState = { ...dragged };
    newDragState[index] = !newDragState[index];
    setDragged(newDragState);
  };

  // Render each message based on whether it's sent by the current user or the other user
  const renderMessage = ({ item, index }) => {
    const isCurrentUserSender = item.senderID === currentUserId;

    return (
      <Animated.View
        style={[
          styles.messageContainer,
          isCurrentUserSender ? styles.messageRight : styles.messageLeft,  // Align right or left based on sender
        ]}
        onStartShouldSetResponder={() => true} // Trigger interaction
        onResponderRelease={() => handleDrag(index)} // Toggle visibility of timestamp on drag
      >
        <Text style={styles.messageText}>{item.message}</Text>
        {dragged[index] && (
          <Text style={styles.messageTime}>{new Date(item.datetime.seconds * 1000).toLocaleTimeString()}</Text>
        )}
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden={false} />
      {/* Header with back button, user photo and name */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="black" />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => router.push({
            pathname: '/userProfiles',
            params: {
            userId: id,  // Assuming matchId is the user ID
            },
          })}
          style={styles.userInfo}
        >
          <Image 
            source={photo ? { uri: photo } : require('../assets/default-profile.png')}  
            style={styles.profileImage}
            resizeMode="cover"
          />
          <Text style={styles.userName}>{name || 'User'}</Text>
        </TouchableOpacity>
      </View>

      {/* Messages area */}
      <FlatList
        data={messages}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesContainer}
      />

      {/* Text input for messages */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type your message..."
          value={messageText}
          onChangeText={setMessageText}
          placeholderTextColor="#888"
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessageHandler}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  backButton: {
    marginRight: 10,  // Space between the back button and profile photo
    padding: 5,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
    resizeMode: 'cover',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },  
  messagesContainer: {
    padding: 10,
    flexGrow: 1,
    justifyContent: 'flex-end',  // Keep messages at the bottom of the screen
  },
  messageContainer: {
    maxWidth: '70%',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginVertical: 5,
    overflow: 'hidden',
  },
  messageRight: {
    alignSelf: 'flex-end',
    backgroundColor: '#007bff',
  },
  messageLeft: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
  },
  messageText: {
    color: '#fff',
    fontSize: 20,
  },
  messageTime: {
    fontSize: 10,
    color: '#fff',
    marginTop: 5,
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    fontSize: 20,
  },
  sendButton: {
    marginLeft: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#007bff',
    borderRadius: 20,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
  },
});

export default Chat;
