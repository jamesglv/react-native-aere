import React from 'react';
import { View, Image } from 'react-native';
import { Tabs } from 'expo-router';
import { icons } from '../../constants';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faComments } from '@fortawesome/free-solid-svg-icons/faComments';
import { faHouse } from '@fortawesome/free-solid-svg-icons/faHouse';
import { faHeart } from '@fortawesome/free-solid-svg-icons/faHeart';
import { faUser } from '@fortawesome/free-solid-svg-icons/faUser';


const TabsLayout = () => {
  return (
    <>
      <Tabs
        screenOptions={{
          tabBarShowLabel: false,
          tabBarActiveTintColor: 'white',
          tabBarInactiveTintColor: '#6a6a6a',
          tabBarStyle: {
            backgroundColor: "black",
            borderTopWidth: 1,
            borderTopColor: '#232533',
            height: 100,
          }
        }}
      >
        <Tabs.Screen 
          name="home"
          options={{
            title: 'Home',
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <FontAwesomeIcon icon={faHouse} size={32} color={color} />
            )
          }}
        />
        <Tabs.Screen 
          name="matches"
          options={{
            title: 'Matches',
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <FontAwesomeIcon icon={faComments} size={36} color={color} />

            )
          }}
        />
        <Tabs.Screen 
          name="likes"
          options={{
            title: 'Likes',
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <FontAwesomeIcon icon={faHeart} size={28} color={color} />
            )
          }}
        />
        <Tabs.Screen 
          name="profile"
          options={{
            title: 'Profile',
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <FontAwesomeIcon icon={faUser} size={28} color={color} />

            )
          }}
        />
      </Tabs>
    </>
  );
};

export default TabsLayout;
