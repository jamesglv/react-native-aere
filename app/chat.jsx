import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TextInput, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';  // Get params from route
import { FIREBASE_DB, FIREBASE_AUTH } from '../firebaseConfig';  // Firestore config
import { doc, updateDoc, onSnapshot, arrayUnion } from 'firebase/firestore';  // Firestore functions
import { Timestamp } from 'firebase/firestore';

const { width } = Dimensions.get('window');  // Get screen width for layout

const Chat = () => {
  // Get matchId, user name, and photo from navigation parameters
    const { matchId, name, photo } = useLocalSearchParams();
    const decodedPhotoUrl = decodeURIComponent(photo);  // Decode the URL back to its original form

    console.log('Received Photo URL:', photo);
    console.log('Decoded Photo URL:', decodedPhotoUrl);

  // Log parameters to check if they are received correctly
  console.log('Received params:', { matchId, name, photo });

  // Check if matchId is defined, if not, show an error
  if (!matchId) {
    console.error('matchId is missing!');
    return (
      <View style={styles.container}>
        <Text>Error: matchId is missing!</Text>
      </View>
    );
  }

  const currentUserId = FIREBASE_AUTH.currentUser?.uid;  // Get the current logged-in user's ID
  const matchDocRef = doc(FIREBASE_DB, 'matches', matchId);  // Reference to the correct match document using matchId

  const [messageText, setMessageText] = useState('');  // State to hold the typed message
  const [messages, setMessages] = useState([]);  // State to hold messages from Firestore

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
  const sendMessage = async () => {
    if (!messageText.trim()) return;

    const newMessage = {
      datetime: Timestamp.now(),
      message: messageText,
      senderID: currentUserId,
      receiverID: matchId,  // Assuming receiver is identified by matchId (adjust based on your schema)
    };

    try {
      await updateDoc(matchDocRef, {
        messages: arrayUnion(newMessage),  // Add the new message to the messages array
        messagePreview: messageText,
      });

      setMessageText('');  // Clear the text input
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Render each message based on whether it's sent by the current user or the other user
  const renderMessage = ({ item }) => {
    const isCurrentUserSender = item.senderID === currentUserId;

    return (
      <View
        style={[
          styles.messageContainer,
          isCurrentUserSender ? styles.messageRight : styles.messageLeft,  // Align right or left based on sender
        ]}
      >
        <Text style={styles.messageText}>{item.message}</Text>
        <Text style={styles.messageTime}>{new Date(item.datetime.seconds * 1000).toLocaleTimeString()}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with user photo and name */}
      <View style={styles.header}>
        
        <Image 
          source={photo ? { uri: photo } : require('../assets/default-profile.png')}  // Use encoded photo URL directly
          style={styles.profileImage}
          resizeMode="cover"
          onError={(e) => console.error('Image load error:', e.nativeEvent.error)}  // Log image load errors
        />
        <Text style={styles.userName}>{name || 'User'}</Text>
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
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
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
  messagesContainer: {
    padding: 10,
    flexGrow: 1,
    justifyContent: 'flex-end',  // Keep messages at the bottom of the screen
  },
  messageContainer: {
    maxWidth: '70%',
    padding: 10,
    borderRadius: 10,
    marginVertical: 5,
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
  },
  messageTime: {
    fontSize: 10,
    color: '#888',
    marginTop: 5,
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    height: 40,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
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
  },
});

export default Chat;
