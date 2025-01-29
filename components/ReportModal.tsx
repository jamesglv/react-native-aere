import React from 'react';
import { View, Text, Image, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { reportUser, blockUser } from '../firebaseActions';
import { FIREBASE_AUTH } from '../firebaseConfig';

const handleReport = async ( reportedUserId, goToMatches, matchId = "") => {
    try {
      await reportUser({ reportedUserId, matchId });
      goToMatches();
    } catch (error) {
      console.error("Error reporting user:", error);
      // Handle error (e.g., show an alert)
    }
  };

const ReportModal = ({ isVisible, onClose, report, close, reportedUserId, matchId }) => {
  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Image source={require('../assets/images/rose.jpg')} style={styles.image} />
          <Text style={styles.title}>Do you want to report this user?</Text>
          <TouchableOpacity style={styles.reportButton} onPress={() => handleReport(reportedUserId, report, matchId)}>
            <Text style={styles.reportText}>Report and Block</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={close} style={styles.close}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  image: {
    width: 100,
    height: 100,
    alignSelf: 'center',
  },
  title: {
    fontSize: 20,
    textAlign: 'center',
    fontFamily: 'Optima',
  },
  reportButton: {
    backgroundColor: 'black',
    padding: 10,
    borderRadius: 25,
    paddingHorizontal: 20,
    marginTop: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportText: {
    color: '#fff',
    fontSize: 18,
    margin: 5,
  },
  close: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 25,
    paddingHorizontal: 20,
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: 'black',
    fontSize: 18,
    fontFamily: 'Optima',
  },
});

export default ReportModal;