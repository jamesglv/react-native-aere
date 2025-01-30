import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import React from 'react'
import { CustomButtonProps } from '../constants/types';

const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  isLoading = false,
  containerStyles,
  textStyles,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.button,
        containerStyles,
        isLoading && styles.disabledButton,
      ]}
      disabled={isLoading}
    >
      <Text style={[styles.text, textStyles]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'black',
    borderRadius: 12, // Equivalent to rounded-xl
    minHeight: 62,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5, // Equivalent to opacity-50
  },
  text: {
    color: 'white',
    fontFamily: 'oregular',
    fontSize: 18, // Equivalent to text-lg
  },
});

export default CustomButton;