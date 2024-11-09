import React, { useState } from 'react';
import { Text, View, TextInput, TouchableOpacity, Image, StyleSheet } from 'react-native';

import { icons } from '../constants'

const FormField = ({ title, value, placeholder, handleChangeText, showPassword, setShowPassword, onFocus, onBlur, ...props }) => {
    return (
        <>
            
            <View style={styles.inputContainer}>
                <TextInput 
                    style={styles.textInput}
                    value={value}
                    placeholder={placeholder}
                    placeholderTextColor='lightgray'
                    onChangeText={handleChangeText}
                    secureTextEntry={title === 'Password' && !showPassword}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    autoCorrect={false}          // Disable auto-correction
                    autoCapitalize='none' 
                    {...props}
                />

                {title === 'Password' && (
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        <Image 
                            source={ !showPassword ? icons.eye : icons.eyehide }
                            style={styles.icon}
                        />
                    </TouchableOpacity>
                )}
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    textBase: {
        fontSize: 16,
        color: 'black',
        fontFamily: 'Optima',
    },
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