import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Keyboard,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Video } from 'expo-av';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { FIREBASE_AUTH } from '../../firebaseConfig';
import { createUserDocument } from '../../firebaseActions';

import FormField from '../../components/FormField';
import CustomButton from '../../components/CustomButton';

const { height: screenHeight } = Dimensions.get('window');

const SignUp: React.FC = () => {
  const router = useRouter();
  const [form, setForm] = useState<{ email: string; password: string }>({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const scrollViewRef = useRef<ScrollView | null>(null);

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

      // Navigate to the onboarding screen after successful sign-up
      router.replace('/onboarding');
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        // Redirect to the sign-in page if the email is already in use
        Alert.alert('Email is already in use');
        router.replace('/sign-in');
      } else {
        // Handle other errors
        Alert.alert('Error', error.message);
        console.error(error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
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

          <View style={styles.contentContainer}>
            <Text style={styles.welcomeText}>Nice to meet you!</Text>
            <Text style={styles.subheading}>Let's get you signed up.</Text>

            <FormField 
              title="Email"
              value={form.email}
              handleChangeText={(e) => setForm({ ...form, email: e })}
              keyboardType="email-address"
              placeholder="Email"
            />

            <FormField 
              title="Password"
              value={form.password}
              handleChangeText={(e) => setForm({ ...form, password: e })}
              secureTextEntry={!showPassword}
              placeholder="Password"
              showPassword={showPassword}
              setShowPassword={setShowPassword}
            />

            <CustomButton 
              title="Sign Up"
              handlePress={submit}
              isLoading={isSubmitting}
            />

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Already have an account?</Text>
              <Link href="/sign-in" style={styles.signupLink}>
                Sign In
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
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
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
  contentContainer: {
    flexGrow: 1,
    backgroundColor: 'white',
    paddingTop: 20,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  subheading: {
    fontSize: 18,
    color: 'gray',
    textAlign: 'center',
    marginBottom: 20,
  },
  signupContainer: {
    justifyContent: 'center',
    flexDirection: 'row',
    paddingTop: 20,
  },
  signupText: {
    fontSize: 16,
    color: 'gray',
  },
  signupLink: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
    marginLeft: 5,
  },
});

export default SignUp;
