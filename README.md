# Rhobile | Kinetic Sculptures Gallery

This is a high-performance digital gallery for kinetic sculptures, built with Next.js 15, Firebase, and Tailwind CSS.

## 🏗️ Backend Architecture

This application is designed to run on a fully integrated Firebase backend:

- **Firebase App Hosting**: Hosts the Next.js application, supporting both static generation and Server-Side Rendering (SSR).
- **Cloud Firestore**: A NoSQL database used to store all sculpture metadata, news entries, flow observations, and custom page content.
- **Cloud Storage for Firebase**: Used for high-speed delivery of high-resolution images (`ks-images/`) and MP4 videos (`ks-videos/`).
- **Firebase Authentication**: Provides secure, anonymous access to the Management Dashboard.

## 🚀 Deployment to GitHub

Before you can use Firebase App Hosting, you must push this code to a GitHub repository:

1. **Create a new repository** on [GitHub](https://github.com/new). Do not initialize it with a README or License.
2. **Open the terminal** in this environment.
3. **Run the following commands** (replacing `<your-repo-url>` with the URL of the repository you just created):

```bash
git init
git add .
git commit -m "Initial gallery setup"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

## 🌐 Go-Live Checklist (Firebase)

### 1. Connect to Firebase App Hosting
- Go to the [Firebase Console](https://console.firebase.google.com/).
- Select your project: `kinetic-sculptures-2-936-80a86`.
- Go to **App Hosting** in the build menu.
- Click **Get Started** and connect the GitHub repository you just created.

### 2. Upgrade to Firebase Blaze Plan
Firebase App Hosting requires the **Blaze (Pay-as-you-go)** plan. It includes a generous free tier, and you only pay for resources used.
- In the Firebase Console, click **Upgrade** in the bottom left.

### 3. Enable Services
Ensure the following are active in your console:
- **Authentication**: Enable Anonymous and Email/Password providers.
- **Firestore**: Create a database in "Production Mode".
- **Storage**: Ensure your bucket exists and has the `ks-images/` and `ks-videos/` folders.

### 4. Connect Your Custom Domain
To use `rhobile.com` instead of the Firebase-generated URL:
- In the Firebase Console, go to **App Hosting**.
- Select your backend and click **Add Custom Domain**.
- Follow the DNS verification steps provided by Firebase.

## 🛠️ Development
- `npm run dev`: Start the local development server.
- `src/app/manage`: Access the Management Dashboard to curate your gallery and sync content.
