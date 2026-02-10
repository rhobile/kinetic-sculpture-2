# Rhobile | Kinetic Sculptures Gallery

This is a high-performance digital gallery for kinetic sculptures, built with Next.js 15, Firebase, and Tailwind CSS.

## 🚀 Go-Live Checklist (Firebase Hosting)

When you are ready to move from this development environment to a live public site, follow these steps:

### 1. Upgrade to Firebase Blaze Plan
Firebase App Hosting requires the **Blaze (Pay-as-you-go)** plan. You only pay for what you use, and it includes a generous free tier.
- Go to the [Firebase Console](https://console.firebase.google.com/).
- Select your project: `kinetic-sculptures-2-936-80a86`.
- Click **Upgrade** in the bottom left.

### 2. Enable Authentication Providers
The app uses Anonymous sign-in for the management dashboard and could use Email/Password.
- In the Firebase Console, go to **Build > Authentication**.
- Click **Get Started**.
- Under the **Sign-in method** tab, enable **Anonymous** and **Email/Password**.

### 3. Configure Genkit (AI) Secrets
If you are using Genkit for AI features, you must provide your API key to the production environment.
- Generate a Google AI API Key at [Google AI Studio](https://aistudio.google.com/).
- In the Firebase Console, go to **App Hosting**.
- Select your backend and add an environment variable/secret named `GOOGLE_GENAI_API_KEY`.

### 4. Connect Your Custom Domain
To use `rhobile.com` instead of the Firebase-generated URL:
- In the Firebase Console, go to **App Hosting** or **Hosting**.
- Click **Add Custom Domain**.
- Follow the instructions to update your DNS records (A and TXT records) at your domain registrar.

### 5. Final Security Review
Your Security Rules are currently set to:
- **Firestore:** Public Read, Auth Required for Write.
- **Storage:** Public Read, Auth Required for Write.
This is correct for your gallery, but always ensure your `manage` page is protected if you transition from Anonymous to a specific admin email in the future.

## Development
- `npm run dev`: Start the local development server.
- `src/app/manage`: Access the Management Dashboard to sync storage and curate the gallery.
