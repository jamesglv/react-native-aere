import { View, Text, FlatList, Image, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import { useGlobalContext } from '../../context/GlobalProvider';

import { images } from '../../constants';
import Trending from '../../components/Trending';
import EmptyState from '../../components/EmptyState';
import VideoCard from '../../components/VideoCard';
import { getAllPosts, getLatestPosts } from '../../lib/appwrite';
import useAppwrite from '../../lib/useAppwrite';

// Import Firebase signOut and useRouter for navigation
import { signOut } from 'firebase/auth';
import { FIREBASE_AUTH } from '../../firebaseConfig';  // Update the path as needed
import { useRouter } from 'expo-router';

const Home = () => {
  const { data: posts, refetch } = useAppwrite(getAllPosts);
  const { data: latestPosts } = useAppwrite(getLatestPosts);

  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter(); // Hook to navigate between screens

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Function to handle the logout
  const handleLogout = async () => {
    try {
      await signOut(FIREBASE_AUTH);
      Alert.alert("Success", "You have logged out successfully.");
      // Navigate back to the SignUp screen
      router.replace('/sign-up');
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <SafeAreaView className='bg-primary h-full'>
      {/* Add the Logout button at the top of the page */}
      <View className="flex-row justify-between items-center px-4 py-3">
        <TouchableOpacity onPress={handleLogout}>
          <Text className="text-lg text-white font-semibold">Log Out</Text>
        </TouchableOpacity>
        <Image 
          source={images.logoSmall}
          className='w-9 h-10'
          resizeMode='contain'
        />
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.$id} // Corrected keyExtractor
        renderItem={({ item }) => (
          <VideoCard 
            video={item}
          />
        )}
        ListHeaderComponent={() => (
          <View className="my-6 px-4 space-y-6">
            <View className="justify-between items-start flex-row mb-6">
              <View>
                <Text className="font-pmedium text-sm text-gray-100">
                  Welcome Back
                </Text>
                <Text className="text-2xl font-semibold text-white">
                  Username
                </Text>
              </View>
            </View>
            <View className='w-full flex-1 pt-5 pb-8'>
              <Text className='text-gray-100 text-lg font-pregular mb-3'>
                Latest Videos
              </Text>
              <Trending 
                posts={latestPosts ?? []}
              />
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <EmptyState 
            title="No videos found"
            subtitle="No videos created yet"
          />
        )}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      />
    </SafeAreaView>
  );
};

export default Home;
