import React from 'react';
import { View, Text, Image, TouchableOpacity, Modal, StyleSheet } from 'react-native';

const DeleteUserModal = ({ isVisible, onClose, goToMatches, backToLikes }) => {
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
          <Text style={styles.title}>You are about to delete your account. Are you sure?</Text>
          <TouchableOpacity style={styles.goBackButton} onPress={goToMatches}>
            <Text style={styles.goBackText}>Go Back</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={backToLikes} style={styles.backToLikes}>
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
  goBackButton: {
    backgroundColor: 'black',
    padding: 10,
    borderRadius: 25,
    paddingHorizontal: 20,
    marginTop: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goBackText: {
    color: '#fff',
    fontSize: 18,
    margin: 5,
  },
  backToLikes: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 25,
    paddingHorizontal: 20,
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backToLikesText: {
    color: 'black',
    fontSize: 18,
    fontFamily: 'Optima',
  },
});

export default DeleteUserModal;