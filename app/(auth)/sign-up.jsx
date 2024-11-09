import { View, Text, ScrollView, Image, Alert, StyleSheet, StatusBar, KeyboardAvoidingView, Platform, Dimensions, Keyboard } from 'react-native';
import React, { useState, useRef, useEffect } from 'react';
import FormField from '../../components/FormField';
import { Link, useRouter } from 'expo-router';
import { Video } from 'expo-av';
import CustomButton from '../../components/CustomButton';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { FIREBASE_AUTH } from '../../firebaseConfig';
import { createUserDocument } from '../../firebaseActions';  // Import from firebaseActions

const { height: screenHeight } = Dimensions.get('window');

const SignUp = () => {
  const router = useRouter();
  const [form, setForm] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
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
      return;
    }

    setIsSubmitting(true);

    try {
      // Firebase Authentication: Create User
      const userCredential = await createUserWithEmailAndPassword(
        FIREBASE_AUTH,
        form.email,
        form.password
      );

      const user = userCredential.user;

      // Use the firebaseActions function to create the user document
      await createUserDocument(user.uid, form.email);

      // Navigate to the home screen after successful sign-up
      router.replace('/onboarding');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        // Redirect to the sign-in page if the email is already in use
        Alert.alert('Email is already in use');
        router.replace('/sign-in');
      } else {
        // Handle other errors
        console.error(error);
      }    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <View className="bg-white h-full">
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
            <Text className='text-2xl text-black text-semibold font-oregular'>
              Nice to meet you!
            </Text>
            <Text style={styles.subheading}>
              Let's get you signed up.
            </Text>
            <FormField 
              title='Email'
              value={form.email}
              handleChangeText={(e) => setForm({...form, email: e})}
              otherStyles='mt-7'
              keyboardType='email-address'
              placeholder={'Email'}
            />
            <FormField 
              title='Password'
              value={form.password}
              handleChangeText={(e) => setForm({
                ...form, 
                password: e
                })}
              otherStyles='mt-7'
              secureTextEntry={!showPassword} 
              placeholder={'Password'}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
            />
            <CustomButton 
              title='Sign Up'
              handlePress={submit}
              containerStyles='mt-7'
              isLoading={isSubmitting}
            />
            <View className='justify-center pt-5 flex-row gap-2'>
              <Text className='text-lg text-lightgray font-oregular'>
                Already have an account?
              </Text>
              <Link 
                href='/sign-in'
                className='text-lg font-obold text-black'
              >
                Sign In
              </Link>
            </View>
        </View>
      </ScrollView>
    </View>
    </KeyboardAvoidingView>
  );
};

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
  subheading: {
    fontSize: 18,
    color: 'gray',
    fontFamily: 'Optima',
    marginTop: 5,
    marginBottom: 20,
  }
});

export default SignUp;
