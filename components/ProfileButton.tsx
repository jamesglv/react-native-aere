import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ProfileButton = ({ title, onPress }) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.buttonText} className="font-oregular">{title}</Text>
        <Ionicons name="chevron-forward-outline" style={styles.arrowIcon} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: '90%',
    paddingVertical: 15,
    borderTopWidth: 0,
    borderBottomWidth: 1,
    borderColor: '#ececec',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  buttonText: {
    fontSize: 18,
    color: '#333',
  },
  arrowIcon: {
    fontSize: 20,
    color: '#333',
  },
});

export default ProfileButton;