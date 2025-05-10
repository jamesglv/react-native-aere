import React from 'react';
import { View, Text, Image, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { MatchModalProps } from '../constants/types';

const MatchModal: React.FC<MatchModalProps> = ({ isVisible, onClose, goToMatches, backToLikes }) => {
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
          <Text style={styles.title}>It's a match!</Text>

          <TouchableOpacity style={styles.matchesButton} onPress={goToMatches}>
            <Text style={styles.matchesText}>View Matches</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.backToLikes} onPress={backToLikes}>
            <Text style={styles.backToLikesText}>Back to likes</Text>
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
    alignItems: 'center', // Ensures elements are centered
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
  matchesButton: {
    backgroundColor: 'black',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  matchesText: {
    color: '#fff',
    fontSize: 18,
  },
  backToLikes: {
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
  backToLikesText: {
    color: 'black',
    fontSize: 18,
    fontFamily: 'Optima',
  },
});

export default MatchModal;
