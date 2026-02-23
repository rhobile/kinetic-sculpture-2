# Rhobile | Kinetic Sculptures Gallery

This is a high-performance digital gallery for kinetic sculptures, built with Next.js 15, Firebase, and Tailwind CSS.

## 🏗️ Backend Architecture

This application is designed to run on a fully integrated Firebase backend:

- **Firebase App Hosting**: Hosts the Next.js application. It automatically builds and deploys your site whenever you push code to your connected GitHub repository.
- **Cloud Firestore**: A NoSQL database used to store all sculpture metadata, news entries, flow observations, and custom page content.
- **Cloud Storage for Firebase**: Used for high-speed delivery of high-resolution images (`ks-images/`) and MP4 videos (`ks-videos/`).
- **Firebase Authentication**: Provides secure access to the Management Dashboard for `rhobile@gmail.com`.

## 🚀 How to Publish Changes (Firebase App Hosting)

Since you are using Firebase App Hosting, "publishing" is a two-step process:

1. **Apply Changes**: When you ask the AI to make changes, they are applied to the code in this environment.
2. **Push to GitHub**: To make those changes go live, run these commands in the **Terminal** below:

```bash
git add .
git commit -m "Update gallery content and styles"
git push origin main
```

Firebase App Hosting will detect the push and automatically start a new deployment. You can track the progress in the [Firebase Console](https://console.firebase.google.com/).

## 📦 How to Download to Your PC

If you want to save a copy of this entire project to your local computer:

1. **Open the Terminal** in this environment.
2. **Run this command**:
   ```bash
   zip -r rhobile-project.zip . -x "node_modules/*" ".next/*"
   ```
3. **Download the file**: Right-click `rhobile-project.zip` in the file explorer and select **Download**.

## 🌐 Go-Live Checklist

- **Authentication**: Ensure "Email/Password" provider is enabled in the Firebase Console.
- **Firestore**: Database should be in "Production Mode".
- **Storage**: Ensure your bucket has `ks-images/` and `ks-videos/` folders.
- **Custom Domain**: Connect `rhobile.com` in the **App Hosting** tab of the Firebase Console.

## 🛠️ Development
- `npm run dev`: Start the local development server.
- `src/app/manage`: Access the Management Dashboard to curate your gallery.
