// Loads local .env and places keys into expo.extra so they are available at runtime
// This approach works with expo-router and does not require changing app entry points.
require('dotenv').config({ path: '.env', debug: false });

module.exports = ({ exp }) => {
  return {
    // preserve any existing fields in app.json/app.config
    ...exp,
    extra: {
      // Firebase
      FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
      FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
      FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
      FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
      FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
      FIREBASE_MEASUREMENT_ID: process.env.FIREBASE_MEASUREMENT_ID,
    },
  };
};