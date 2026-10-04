// import { createClient } from '@base44/sdk';
// import { appParams } from '@/lib/app-params';

// const { appId, token, functionsVersion, appBaseUrl } = appParams;

//Create a client with authentication required
// export const base44 = createClient({
//   appId,
//   token,
//   functionsVersion,
//   serverUrl: '',
//   requiresAuth: false,
//   appBaseUrl
// });

// Mock base44 client to prevent WebSocket connection errors
export const base44 = {
  auth: {
    me: () => Promise.reject(new Error('Base44 disabled')),
    logout: () => {},
    redirectToLogin: () => {}
  }
};
