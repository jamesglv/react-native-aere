import { View, Text, ScrollView, Image, Alert, StyleSheet, StatusBar, KeyboardAvoidingView, Platform, Dimensions, Keyboard } from 'react-native';
import React, { useState, useRef, useEffect } from 'react';
import FormField from '../../components/FormField';
import { Link, useRouter } from 'expo-router';
import { Video } from 'expo-av';
import { logError } from '../../errorLogger';

import CustomButton from '../../components/CustomButton';
// Firebase imports
import { signInWithEmailAndPassword } from 'firebase/auth';
import { FIREBASE_AUTH } from '../../firebaseConfig';  

const { height: screenHeight } = Dimensions.get('window');

const SignIn = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    });
  
    return () => {
      keyboardDidShowListener.remove();
    };
  }, []);

  const submit = async () => {
    if (!form.email || !form.password) {
      Alert.alert("Error", "Please make sure all fields are complete.");
      logError(new Error('Please make sure all fields are complete.'));
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
    <View className="bg-white h-full">
      <StatusBar translucent backgroundColor="transparent" />
      <ScrollView ref={scrollViewRef}>
        <View style={styles.topContainer}>
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
        </View>
      
        
        <View style={styles.contentContainer} className='w-full justify-center px-4'>
          
          
          <Text style={styles.welcome} className='text-2xl text-black text-semibold font-oregular'>
            Nice to see you again.
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
    </KeyboardAvoidingView>
  );
};

// Styles
const styles = StyleSheet.create({
  topContainer: {
    position: 'relative',
    height: screenHeight * 0.5, // Adjust the height as needed
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    height: '100%',
  },
  logoContainer: {
    ...StyleSheet.absoluteFillObject,
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 200,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
  contentContainer: {
    flexGrow: 1,
    backgroundColor: 'white',
    paddingTop: 20,
    marginBottom: 20,
  },
  welcome: {
    marginBottom: 20,
  },
});

export default SignIn;
