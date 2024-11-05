// FILE: Loading.jsx
import React, {} from 'react';
import { View, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { MaterialIndicator } from 'react-native-indicators';  // Import ActivityIndicator

const Loading = () => {

    return (
        <View style={styles.container}>
              <MaterialIndicator size={30} color="black" />
              </View>
    );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
});

export default Loading;