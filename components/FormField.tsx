import React from 'react';
import {
  TextInput,
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  TextInputProps,
} from 'react-native';

import { icons } from '../constants';

type FormFieldProps = TextInputProps & {
  title: string;
  value: string;
  placeholder: string;
  handleChangeText: (text: string) => void;
  showPassword?: boolean;
  setShowPassword?: (show: boolean) => void;
};

const FormField: React.FC<FormFieldProps> = ({
  title,
  value,
  placeholder,
  handleChangeText,
  showPassword,
  setShowPassword,
  ...props
}) => {
  return (
    <View style={styles.inputContainer}>
      <TextInput
        style={styles.textInput}
        value={value}
        placeholder={placeholder}
        placeholderTextColor="lightgray"
        onChangeText={handleChangeText}
        secureTextEntry={title === 'Password' && !showPassword}
        autoCorrect={false}
        autoCapitalize="none"
        {...props} // Allows all valid TextInput props
      />

      {title === 'Password' && setShowPassword && (
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Image
            source={!showPassword ? icons.eye : icons.eyehide}
            style={styles.icon}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    borderBottomWidth: 1,
    borderBottomColor: 'gray',
    width: '95%',
    height: 54,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 20,
  },
  textInput: {
    flex: 1,
    color: 'black',
    fontFamily: 'Optima',
    fontSize: 16,
  },
  icon: {
    height: 24,
    width: 24,
  },
});

export default FormField;
