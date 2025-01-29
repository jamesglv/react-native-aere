import {useEffect, useRef, useState} from 'react';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import {Subscription} from 'expo-notifications';
import {Platform} from 'react-native';

export default function usePushNotifications() {
    const [expoPushToken, setExpoPushToken] = useState('');
    const [notification, setNotification] = useState<Notifications.Notification | null>(null);
    const notificationListener = useRef<Subscription>();
    const responseListener = useRef<Subscription>();

    useEffect(() => {
        const setupPushNotifications = async () => {
            const token = await registerForPushNotificationsAsync();
            if (token) {
                setExpoPushToken(token);
                console.log('Token set in state:', token);
            } else {
                console.log('Failed to get push token');
            }
        };

        setupPushNotifications();

        notificationListener.current = Notifications.addNotificationReceivedListener(setNotification);
        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            console.log('Notification response received:', response);
        });

        return () => {
            if (notificationListener.current) {
                Notifications.removeNotificationSubscription(notificationListener.current);
            }
            if (responseListener.current) {
                Notifications.removeNotificationSubscription(responseListener.current);
            }
        };
    }, []);

    return {
        expoPushToken,
        notification,
    };
}

async function registerForPushNotificationsAsync() {
    let token;
    console.log('Device:', Device.isDevice); // Log the device model name
    if (Device.isDevice) {
        try {
            const {status: existingStatus} = await Notifications.getPermissionsAsync();
            console.log('Existing permission status:', existingStatus); // Log existing status
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
                const {status} = await Notifications.requestPermissionsAsync();
                finalStatus = status;
                console.log('Requested permission status:', finalStatus); // Log requested status
            }
            if (finalStatus !== 'granted') {
                alert('Failed to get push token for push notification!');
                return;
            }
            token = (await Notifications.getExpoPushTokenAsync({projectId: '1bb185ee-a45e-4287-843b-2f92cb20c7d9'})).data;
            console.log('Push Token:', token); // Log the token for debugging
        } catch (error) {
            console.error('Error getting push token:', error);
        }
    } else {
        // alert('Must use physical device for Push Notifications'); // Annoying
    }

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    return token;
}