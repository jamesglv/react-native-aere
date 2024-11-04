import { View, Text, ScrollView, Image, Alert, StyleSheet, StatusBar } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import FormField from '../../components/FormField';
import { Link, useRouter } from 'expo-router';
import { Video } from 'expo-av';

import { images } from '../../constants';
import CustomButton from '../../components/CustomButton';
// Firebase imports
import { signInWithEmailAndPassword } from 'firebase/auth';
import { FIREBASE_AUTH } from '../../firebaseConfig';  

const SignIn = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    if (!form.email || !form.password) {
      Alert.alert("Error", "Please make sure all fields are complete.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Use Firebase sign-in method
      await signInWithEmailAndPassword(FIREBASE_AUTH, form.email, form.password);

      // Navigate to home screen after successful sign-in
      router.replace('/home');
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="bg-white h-full">
      <StatusBar translucent backgroundColor="transparent" />
      <Video
          source={require('../../assets/images/splash.mp4')}
          style={styles.video}
          resizeMode="cover"
          isLooping
          shouldPlay
          isMuted
        />
        <View style={styles.overlay} />

        <View style={styles.logoContainer}>
          <Image source={require('../../assets/images/logowhite.png')} style={styles.logo} />
        </View>
      <ScrollView>
        
        <View style={styles.contentContainer} className='w-full justify-center h-full px-4 my-6'>
          
          
          <Text style={styles.welcome} className='text-2xl text-black text-semibold mt-10 font-oregular'>
            Welcome back
          </Text>

          <FormField 
            title='Email'
            placeholder={'Email'}
            value={form.email}
            handleChangeText={(e) => setForm({...form, email: e})}
            otherStyles='mt-7'
            keyboardType='email-address'
          />

          <FormField 
            title='Password'
            placeholder={'Password'}
            value={form.password}
            handleChangeText={(e) => setForm({
               ...form, 
               password: e
              })}
            otherStyles='mt-7'
            secureTextEntry={!showPassword}  // Add this to hide the password
            showPassword={showPassword}
            setShowPassword={setShowPassword}
          />

          <CustomButton 
            title='Sign In'
            handlePress={submit}
            containerStyles='mt-7'
            isLoading={isSubmitting}
          />

          <View className='justify-center pt-5 flex-row gap-2'>
            <Text className='text-lg text-lightgray font-oregular'>
              Don't have an account?
            </Text>
            <Link 
              href='/sign-up'
              className='text-lg font-obold text-black'
            >
              Sign Up
            </Link>

          </View>

        </View>
      </ScrollView>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f8f8f8',
  },
  contentContainer: {
    flexGrow: 1,
    paddingTop: '95%',
  },
  video: {
    position: 'absolute',
    height: '50%',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
    ...StyleSheet.absoluteFillObject,
  },
  welcome: {
    marginBottom: 20,
  },
  logoContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    height: '50%',
  },
  logo: {
    width: 200,
    height: 200,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    height: '50%',
  },
});

export default SignIn;
