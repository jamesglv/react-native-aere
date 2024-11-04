import { View, Text, ScrollView, Image, Alert, StyleSheet } from 'react-native';
import React, { useState } from 'react';
import FormField from '../../components/FormField';
import { Link, useRouter } from 'expo-router';
import { Video } from 'expo-av';
import CustomButton from '../../components/CustomButton';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { FIREBASE_AUTH } from '../../firebaseConfig';
import { createUserDocument } from '../../firebaseActions';  // Import from firebaseActions

const SignUp = () => {
  const router = useRouter();
  const [form, setForm] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    <View className="bg-white h-full">
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
          
          <Text className='text-2xl text-black text-semibold mt-10 font-oregular'>
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
  );
};

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
  subheading: {
    fontSize: 18,
    color: 'gray',
    fontFamily: 'Optima',
    marginTop: 5,
    marginBottom: 20,
  }
});

export default SignUp;
