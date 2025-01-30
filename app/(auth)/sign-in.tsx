import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Alert,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Keyboard,
} from 'react-native';
import * as Analytics from "expo-firebase-analytics";
import { Link, useRouter } from 'expo-router';
import { Video } from 'expo-av';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { FIREBASE_AUTH } from '../../firebaseConfig';  

import FormField from '../../components/FormField';
import CustomButton from '../../components/CustomButton';
import { logError } from '../../errorLogger';

const { height: screenHeight } = Dimensions.get('window');

const SignIn: React.FC = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [form, setForm] = useState<{ email: string; password: string }>({
    email: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const scrollViewRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    Analytics.logEvent("screen_view", {
      screen_name: "SignIn",
      screen_class: "SignInPage",
    });
  }, []);

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
      await signInWithEmailAndPassword(FIREBASE_AUTH, form.email, form.password);
      router.replace('/home'); // Navigate to home screen after successful sign-in
    } catch (error: any) {
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
      <View style={styles.container}>
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

          <View style={styles.contentContainer}>
            <Text style={styles.welcomeText}>Nice to see you again.</Text>

            <FormField 
              title="Email"
              placeholder="Email"
              value={form.email}
              handleChangeText={(e) => setForm({ ...form, email: e })}
              keyboardType="email-address"
            />

            <FormField 
              title="Password"
              placeholder="Password"
              value={form.password}
              handleChangeText={(e) => setForm({ ...form, password: e })}
              secureTextEntry={!showPassword}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
            />

            <CustomButton 
              title="Sign In"
              handlePress={submit}
              isLoading={isSubmitting}
            />

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don't have an account?</Text>
              <Link href="/sign-up" style={styles.signupLink}>
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
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  topContainer: {
    position: 'relative',
    height: screenHeight * 0.5,
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
    marginBottom: 20,
    textAlign: 'center',
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

export default SignIn;
