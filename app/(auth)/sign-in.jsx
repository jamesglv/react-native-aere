import { View, Text, ScrollView, Image, Alert } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import FormField from '../../components/FormField';
import { Link, useRouter } from 'expo-router';

import { images } from '../../constants';
import CustomButton from '../../components/CustomButton';
// Firebase imports
import { signInWithEmailAndPassword } from 'firebase/auth';
import { FIREBASE_AUTH } from '../../firebaseConfig';  // Assuming firebase.js is in lib folder

const SignIn = () => {
  const router = useRouter(); // Added router for navigation
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

    const auth = getAuth(app);  // Initialize Firebase Auth
    try {
      // Use Firebase sign-in method
      await signInWithEmailAndPassword(auth, form.email, form.password);

      // Navigate to home screen after successful sign-in
      router.replace('/home');
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="bg-primary h-full">
      <ScrollView>
        <View className='w-full justify-center h-full px-4 my-6'>
          
          <Image 
            source={images.logo}
            resizeMode='contain'
            className='w-[115px] h-[35px]'
          />

          <Text className='text-2xl text-white text-semibold mt-10 font-psemibold'>
            Sign in to Aora
          </Text>

          <FormField 
            title='Email'
            value={form.email}
            handleChangeText={(e) => setForm({...form, email: e})}
            otherStyles='mt-7'
            keyboardType='email-address'
          />

          <FormField 
            title='Password'
            value={form.password}
            handleChangeText={(e) => setForm({
               ...form, 
               password: e
              })}
            otherStyles='mt-7'
            secureTextEntry  // Add this to hide the password
          />

          <CustomButton 
            title='Sign In'
            handlePress={submit}
            containerStyles='mt-7'
            isLoading={isSubmitting}
          />

          <View className='justify-center pt-5 flex-row gap-2'>
            <Text className='text-lg text-gray-100 font-pregular'>
              Don't have an account?
            </Text>
            <Link 
              href='/sign-up'
              className='text-lg font-psemibold text-secondary'
            >
              Sign Up
            </Link>

          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SignIn;
