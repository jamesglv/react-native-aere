import { View, Text, ScrollView, Image, Alert } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import FormField from '../../components/FormField';
import { Link, useRouter } from 'expo-router';

import { images } from '../../constants';
import CustomButton from '../../components/CustomButton';
// Import Firebase functions
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { FIREBASE_AUTH, FIREBASE_DB } from '../../firebaseConfig';  // Make sure this path is correct
import { doc, setDoc } from 'firebase/firestore'; // Firestore functions

const SignUp = () => {
  const router = useRouter(); // Use router for navigation
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    if (!form.username || !form.email || !form.password) {
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

      const user = userCredential.user;  // Firebase Auth user object

      // Firestore: Create user document with the same ID as the Auth user ID (uid)
      await setDoc(doc(FIREBASE_DB, 'users', user.uid), {
        username: form.username,
        email: form.email,
        createdAt: new Date().toISOString(),
        // Add more fields as necessary
      });

      // Navigate to the home screen after successful sign-up
      router.replace('/onboarding');
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
            Sign Up to Aora
          </Text>

          <FormField 
            title='Name'
            value={form.username}
            handleChangeText={(e) => setForm({...form, username: e})}
            otherStyles='mt-7'
          />

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
            secureTextEntry  // Ensures password is hidden
          />

          <CustomButton 
            title='Sign Up'
            handlePress={submit}
            containerStyles='mt-7'
            isLoading={isSubmitting}
          />

          <View className='justify-center pt-5 flex-row gap-2'>
            <Text className='text-lg text-gray-100 font-pregular'>
              Already have an account?
            </Text>
            <Link 
              href='/sign-in'
              className='text-lg font-psemibold text-secondary'
            >
              Sign In
            </Link>

          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SignUp;
