# Rhobile | Gallery Management & Security Guide

## 🔐 How to Verify Public Access
1. **Persistent Session**: Your PC "always has the dashboard available" because you are logged in as **rhobile@gmail.com**. Firebase remembers you.
2. **Public View**: To see what a normal visitor sees, open your browser in **Incognito** or **Private Mode** and visit rhobile.com.
   - The "Management Dashboard" link will be **hidden**.
   - Navigating to `/manage` manually will show a **login screen** instead of your data.

## 🚀 Project Logic Summary
- **Real-Time Database**: When you click "Save" in the dashboard, the text updates **instantly** on all devices (like your wife's phone) because Firestore is a real-time database.
- **Publish & Push**: Clicking "Publish" in Studio saves your **code changes** (design, layout, fixes). Clicking the cloud icon to **Push to GitHub** deploys these design changes to the live site.
- **Commit Messages**: When pushing to GitHub, **manually clear the text box** and type your own summary (e.g., "Adjusted mobile spacing"). This prevents the conversation history from being used as the title.

## 🎨 Design Notes
- **Typography**: Titles are **9pt/11pt uppercase** and configured to **wrap to a second line** on mobile portrait screens so they are never cut off.
- **Spacing**: Vertical gaps between videos and text are tightened for a sleek look.
- **Theme**: Strictly **White Background with Black Text**.

## 📁 Storage Structure
- `ks-images/`: Sculpture thumbnails (.jpg, .png).
- `ks-videos/`: Sculpture videos (.mp4).
