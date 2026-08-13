# Rhobile | Gallery Management & Security Guide

## 🔐 How to Verify Public Access
1. **Persistent Session**: Your PC "always has the dashboard available" because you are logged in as **rhobile@gmail.com**. Firebase remembers you.
2. **Public View**: To see what a normal visitor sees, open your browser in **Incognito** or **Private Mode** and visit rhobile.com.
   - The "Management Dashboard" link will be **hidden**.
   - Navigating to `/manage` manually will show a **login screen** instead of your data.

## 🚀 Project Logic Summary
- **Storage-First Gallery**: All images uploaded to `ks-images/` appear in the main gallery immediately.
- **Management Dashboard**: Visit `/manage` to toggle visibility (Show/Hide) or edit metadata for sculptures.
- **Admin Access**: Sign in with **rhobile@gmail.com**. This grants full write access to Firestore and Storage.
- **Typography**: Titles are **9pt/11pt uppercase** and configured to **wrap to a second line** on mobile portrait screens.
- **Spacing**: Vertical gaps between videos and text are tightened for a sleek look.

## 📁 Storage Structure
- `ks-images/`: Sculpture thumbnails (.jpg, .png).
- `ks-videos/`: Sculpture videos (.mp4).

## 🚀 Deployment & GitHub
1. **Publish**: Apply design changes in Firebase Studio.
2. **Push Message**: When clicking the cloud icon to Push to GitHub, **manually clear the text box** and type your own summary (e.g., "Updated sculpture titles"). This prevents your conversation history from being used as the commit title.
