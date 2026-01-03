
import { NextResponse } from 'next/server';

export async function GET() {
    const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FCM_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FCM_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FCM_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FCM_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FCM_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FCM_APP_ID,
    };

    const script = `
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp(${JSON.stringify(firebaseConfig)});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon || '/icon.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
  `;

    return new NextResponse(script, {
        headers: {
            'Content-Type': 'application/javascript',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
    });
}
