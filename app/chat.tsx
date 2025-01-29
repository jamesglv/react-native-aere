import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, TextInput, TouchableOpacity, FlatList, Dimensions, Animated, StatusBar,KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';  // Get params from route and router for navigation
import { FIREBASE_DB, FIREBASE_AUTH } from '../firebaseConfig';  // Firestore config
import { doc, updateDoc, onSnapshot, arrayUnion } from 'firebase/firestore';  // Firestore functions
import { Timestamp } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons'; // Icon for the back button
import { useNavigation } from '@react-navigation/native';  // Use navigation hook
import { sendMessage as sendMessageAction, reportUser } from '../firebaseActions'; // Import as sendMessageAction
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faArrowUp } from '@fortawesome/free-solid-svg-icons/faArrowUp';
import ReportModal from '../components/ReportModal';

const { width } = Dimensions.get('window');  // Get screen width for layout

const Chat = () => {
  const { matchId, name, photo, id } = useLocalSearchParams();
  const router = useRouter();
  const currentUserId = FIREBASE_AUTH.currentUser?.uid;
  const matchDocRef = doc(FIREBASE_DB, 'matches', matchId);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState([]);
  const [dragged, setDragged] = useState({});
  const navigation = useNavigation();
  const [inputHeight, setInputHeight] = useState(50); // Initialize inputHeight state
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);


  // Ref for the FlatList to control scrolling
  const flatListRef = useRef(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  // Listen to messages in real-time
  useEffect(() => {
    const unsubscribe = onSnapshot(matchDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const matchData = docSnapshot.data();
        setMessages(matchData.messages || []);
      }
    });

    return () => unsubscribe();
  }, [matchDocRef]);

  const sendMessageHandler = async () => {
    if (!messageText.trim()) return;

    try {
      await sendMessageAction(matchId, messageText, currentUserId, matchId);
      setMessageText(''); // Clear the text input
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert("Error", "Failed to send message. Please try again.");
    }
  };

  const formatMessageTime = (timestamp) => {
    const messageDate = new Date(timestamp.seconds * 1000);
    const today = new Date();

    const isToday = messageDate.toDateString() === today.toDateString();
    if (isToday) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } else {
      return messageDate.toLocaleDateString([], { day: '2-digit', month: 'short' });
    }
  };

  const handleReport = () => {
    setIsReportModalVisible(false);
    navigation.goBack();
  };

  const renderMessage = ({ item, index }) => {
    const isCurrentUserSender = item.senderID === currentUserId;

    return (
      <Animated.View
        style={[
          styles.messageContainer,
          isCurrentUserSender ? styles.messageRight : styles.messageLeft,
        ]}
        onStartShouldSetResponder={() => true}
        onResponderRelease={() => handleDrag(index)}
      >
        <Text style={styles.messageText}>{item.message}</Text>
        {dragged[index] && (
          <Text style={styles.messageTime}>{formatMessageTime(item.datetime)}</Text>
        )}
      </Animated.View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"} // Adjust behavior based on platform
      keyboardVerticalOffset={0} // Offset to account for header and status bar
    >
      <StatusBar hidden={false} />
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={router.back} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="black" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/userProfiles', params: { userId: id } })}
            style={styles.userInfo}
          >
            <Image
              source={photo ? { uri: photo } : require('../assets/default-profile.png')}
              style={styles.profileImage}
              resizeMode="cover"
            />
            <Text style={styles.userName} className='font-oregular'>{name || 'User'}</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity onPress={() => setIsReportModalVisible(true)} style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={28} color="black" />
        </TouchableOpacity>
      </View>

      {/* Messages area */}
      <FlatList
        ref={flatListRef}
        data={[...messages].reverse()}  // Reverse the messages array
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesContainer}
        inverted  // Inverts the FlatList to load from the bottom
      />

      {/* Text input for messages */}
      <View style={[styles.inputContainer, { height: Math.max(inputHeight, 50) + 20 }]}>
        <TextInput
          style={[styles.input, { height: inputHeight, minHeight: 40 }]} // Set minHeight for TextInput
          placeholder="Type your message..."
          value={messageText}
          onChangeText={setMessageText}
          placeholderTextColor="#888"
          multiline={true} // Enable multiline support
          onContentSizeChange={(event) =>
            setInputHeight(Math.min(event.nativeEvent.contentSize.height, 150)) // Adjust max height as needed
          }
        />
        {messageText.trim() !== '' && (
          <TouchableOpacity style={styles.sendButton} onPress={sendMessageHandler}>
            <FontAwesomeIcon icon={faArrowUp} size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Report Modal */}
      <ReportModal
        isVisible={isReportModalVisible}
        onClose={() => setIsReportModalVisible(false)}
        report={handleReport}
        close={() => setIsReportModalVisible(false)}
        reportedUserId={id}
        matchId={matchId}
      />
    </KeyboardAvoidingView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerLeft: {
    flexDirection: 'row',
  },
  moreButton: {
    paddingRight: 10,
  },
  backButton: {
    marginRight: 10,
    padding: 5,
    marginTop: 5,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 20,
    resizeMode: 'cover',
  },
  userName: {
    fontSize: 25,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messagesContainer: {
    padding: 10,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  messageContainer: {
    maxWidth: '70%',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginVertical: 1,
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
    paddingLeft: 20,
    paddingRight: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    fontSize: 20,
    marginRight: 5,
    marginTop: 5,
    marginBottom: 10,
  },
  sendButton: {
    marginLeft: 10,
    marginRight: 5,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#007bff',
    borderRadius: 25,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default Chat;
