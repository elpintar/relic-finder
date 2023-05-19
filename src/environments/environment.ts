// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyATprvaHg1pRLiDE1426RYAy44ZTM3mpYU',
  authDomain: 'relic-finder.firebaseapp.com',
  databaseURL: 'https://relic-finder.firebaseio.com',
  projectId: 'relic-finder',
  storageBucket: 'relic-finder.appspot.com',
  messagingSenderId: '149042048555',
  appId: '1:149042048555:web:3f54f2a15ca24c3ddd446e',
  measurementId: 'G-NKFQKZ6D96',
};

export const environment = {
  production: false,
  firebase: firebaseConfig,
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
