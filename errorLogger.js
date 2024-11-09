// import { analytics } from './firebaseConfig';

// // logError function that you can use throughout the app
// export const logError = async (error, additionalInfo = {}) => {
//   try {
//     // Capture the error message and stack trace
//     const errorMessage = error.message || 'Unknown Error';
//     const errorStack = error.stack || 'No Stack Trace';

//     if (analytics && typeof analytics.logEvent === 'function') {
//       // Log custom error event to Firebase Analytics
//       await analytics.logEvent('custom_error', {
//         errorMessage,
//         errorStack,
//         ...additionalInfo, // Pass any additional info you want to track
//       });

//       console.log('Error logged to Firebase Analytics:', errorMessage);
//     } else {
//       console.warn('Analytics is not initialized or logEvent is not a function. Error not logged to Firebase Analytics.');
//     }
//   } catch (e) {
//     console.error('Failed to log error to Firebase Analytics:', e);
//   }
// };