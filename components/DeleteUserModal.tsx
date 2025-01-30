import React from 'react';
import { View, Text, Image, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { DeleteUserModalProps } from '../constants/types';

const DeleteUserModal: React.FC<DeleteUserModalProps> = ({ isVisible, onClose, goToMatches, backToLikes }) => {
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
          <Text style={styles.title}>
            You are about to delete your account. Are you sure?
          </Text>

          <TouchableOpacity style={styles.goBackButton} onPress={goToMatches}>
            <Text style={styles.goBackText}>Go Back</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.backToLikes} onPress={backToLikes}>
            <Text style={styles.backToLikesText}>Delete</Text>
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
    marginVertical: 15,
  },
  goBackButton: {
    backgroundColor: 'black',
    paddingVertical: 10,
    borderRadius: 25,
    paddingHorizontal: 20,
    marginTop: 30,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  goBackText: {
    color: '#fff',
    fontSize: 18,
  },
  backToLikes: {
    backgroundColor: 'white',
    paddingVertical: 10,
    borderRadius: 25,
    paddingHorizontal: 20,
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

export default DeleteUserModal;
