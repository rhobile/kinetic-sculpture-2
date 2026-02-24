# Rhobile | Kinetic Sculptures Gallery

This is a high-performance digital gallery for kinetic sculptures, built with Next.js 15, Firebase, and Tailwind CSS.

## 🏗️ Backend Architecture

This application is designed to run on a fully integrated Firebase backend:

- **Firebase App Hosting**: Hosts the Next.js application. It automatically builds and deploys your site whenever you push code to your connected GitHub repository.
- **Cloud Storage for Firebase**: Used for high-speed delivery of high-resolution images (`ks-images/`) and MP4 videos (`ks-videos/`).
- **Cloud Firestore**: A NoSQL database used to store all sculpture metadata, news entries, flow observations, and custom page content.
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

## 📦 How to Download the ENTIRE Project to Your PC

To download the full copy of the project (including the `src/` folder), you must use the **Terminal**.

### 1. Locate the Terminal
The Terminal is the wide panel at the **very bottom of this screen**. If you don't see it, click the "Terminal" tab at the bottom or drag the bottom border of this window upwards.

### 2. Run the Download Command
Copy and paste **one** of these commands into that terminal and press Enter:

**Option A (Recommended):**
```bash
zip -r rhobile-full.zip . -x "node_modules/*" ".next/*" ".git/*"
```

**Option B (If Option A fails):**
```bash
tar -czvf rhobile-full.tar.gz . --exclude="node_modules" --exclude=".next" --exclude=".git"
```

### 3. Download the file:
1. Once the command finishes, look at the **File Explorer** on the left side of this window.
2. Find the new file (`rhobile-full.zip` or `rhobile-full.tar.gz`).
3. **Right-click** it and select **Download**.
4. Save it to your PC and extract the contents. You will see the `src/` folder and all files ready for use.

## 🌐 Go-Live Checklist

- **Authentication**: Ensure "Email/Password" provider is enabled in the Firebase Console.
- **Firestore**: Security rules are set to "Strong" (no expiration). Admin access is granted to `rhobile@gmail.com`.
- **Storage**: Ensure your bucket has `ks-images/` and `ks-videos/` folders.
- **Custom Domain**: Connect `rhobile.com` in the **App Hosting** tab of the Firebase Console.

## 🛠️ Development
- `npm run dev`: Start the local development server.
- `src/app/manage`: Access the Management Dashboard to curate your gallery.
