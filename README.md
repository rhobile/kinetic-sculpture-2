# Rhobile | Kinetic Sculptures Gallery

This is a high-performance digital gallery for kinetic sculptures, built with Next.js 15, Firebase, and Tailwind CSS.

## 🏗️ Backend Architecture

This application is designed to run on a fully integrated Firebase backend:

- **Firebase App Hosting**: Hosts the Next.js application, supporting both static generation and Server-Side Rendering (SSR).
- **Cloud Firestore**: A NoSQL database used to store all sculpture metadata, news entries, flow observations, and custom page content.
- **Cloud Storage for Firebase**: Used for high-speed delivery of high-resolution images (`ks-images/`) and MP4 videos (`ks-videos/`).
- **Firebase Authentication**: Provides secure, anonymous access to the Management Dashboard.

## 🚀 Go-Live Checklist (Firebase)

### 1. Upgrade to Firebase Blaze Plan
Firebase App Hosting requires the **Blaze (Pay-as-you-go)** plan. It includes a generous free tier, and you only pay for resources used.
- Go to the [Firebase Console](https://console.firebase.google.com/).
- Select your project: `kinetic-sculptures-2-936-80a86`.
- Click **Upgrade** in the bottom left.

### 2. Enable Services
Ensure the following are active in your console:
- **Authentication**: Enable Anonymous and Email/Password providers.
- **Firestore**: Create a database in "Production Mode" (rules are managed in this repo).
- **Storage**: Ensure a bucket exists for your media.

### 3. Connect Your Custom Domain
To use `rhobile.com` instead of the Firebase-generated URL:
- In the Firebase Console, go to **App Hosting**.
- Select your backend and click **Add Custom Domain**.
- Follow the DNS verification steps provided by Firebase.

### 4. Final Security Review
Your Security Rules (`firestore.rules` and `storage.rules`) are currently configured for a public gallery:
- **Public Read:** Anyone can view sculptures, news, and pages.
- **Auth Required for Write:** Only users signed into your project (like you via the dashboard) can modify content.

## 🛠️ Development
- `npm run dev`: Start the local development server.
- `src/app/manage`: Access the Management Dashboard to curate your gallery and sync content.
