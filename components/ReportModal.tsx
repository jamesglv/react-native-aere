import React from 'react';
import { View, Text, Image, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { reportUser } from '../firebaseActions';
import { ReportModalProps } from '../constants/types';

const handleReport = async (reportedUserId: string, goToMatches: () => void, matchId?: string) => {
  try {
    await reportUser({ reportedUserId, matchId });
    goToMatches();
  } catch (error) {
    console.error("Error reporting user:", error);
    // Handle error (e.g., show an alert)
  }
};

const ReportModal: React.FC<ReportModalProps> = ({ isVisible, onClose, report, close, reportedUserId, matchId }) => {
  return (
    <Modal
      visible={isVisible}
      transparent
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

          <TouchableOpacity style={styles.closeButton} onPress={close}>
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
    alignItems: 'center',
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
    marginBottom: 20,
  },
  reportButton: {
    backgroundColor: 'black',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  reportText: {
    color: '#fff',
    fontSize: 18,
  },
  closeButton: {
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: 'black',
  },
  closeText: {
    color: 'black',
    fontSize: 18,
    fontFamily: 'Optima',
  },
});

export default ReportModal;
