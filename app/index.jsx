import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, Text, View, Image, StyleSheet } from 'react-native';
import { Link, Redirect, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video } from 'expo-av';
import { images } from '../constants';
import CustomButton from '../components/CustomButton';
import { useGlobalContext } from '../context/GlobalProvider';
import usePushNotifications from '../usePushNotifications'; 
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync(); // Prevent the splash screen from auto-hiding

export default function App() {
  const { loading, isLogged } = useGlobalContext();
  const { expoPushToken, notification } = usePushNotifications();

  useEffect(() => {
    try {
      if (expoPushToken) {
        console.log('Expo Push Token:', expoPushToken); // Log the token
      } 
    } catch (error) {
        console.error('Error getting Expo Push Token:', error);
      }
    }, [expoPushToken]);

    useEffect(() => {
      async function prepare() {
        try {
          // Perform any necessary setup or data fetching here
        } catch (e) {
          console.warn(e);
        } finally {
          // Tell the splash screen to hide once your app is ready
          await SplashScreen.hideAsync();
        }
      }
  
      prepare();
    }, []);
    
  if(!loading && isLogged) return <Redirect href='/home'/>;
  console.log('isLogged:', isLogged, 'isLoading:', loading);

  return (
    <View className="bg-primary h-full" style={styles.container}>
      <Video
          source={require('../assets/images/splash.mp4')}
          style={styles.video}
          resizeMode="cover"
          isLooping
          shouldPlay
          isMuted
        />
        <View style={styles.overlay} />

      <ScrollView contentContainerStyle={{ height: '100%'}}>
        <View className="w-full justify-center items-center min-h-[85vh] px-4">
          <Image 
            source={require('../assets/images/logowhite.png')}
            className="w-[130px] h-[84px]"
            resizeMode='contain'
            style={styles.logo}
          />
          <View className='relative mt-5'>
            <Text style={styles.title} className='font-oregular'>
              Dating. Without the awkward conversation.
            </Text>

          </View>
          <Text className='text-sm font-pregular text-gray-100 mt-7 text-center'>
            Meet people who...
          </Text>

          <View style={styles.buttonContainer}>
            <CustomButton 
              title="Continue with email"
              handlePress={() => router.push('/sign-in')}
              containerStyles='w-full mt-7'
            />
          </View>
          
        </View>
      </ScrollView>

      <StatusBar backgroundColor='#161622' style='light'/>
    </View>
  );
}

const styles = StyleSheet.create({

  video: {
    position: 'absolute',
    height: '100%',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
    ...StyleSheet.absoluteFillObject,
  },
  title: {
    fontSize: 24,
    color: '#fff',
    textAlign: 'center',
  },
  logo: {
    width: 200,
    height: 200,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    height: '100%',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: 20,
  },
});
