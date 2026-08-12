
# Rhobile | Gallery Management & Security Guide

## 🚀 Project Logic Summary
- **Storage-First Gallery**: All images uploaded to `ks-images/` appear in the main gallery immediately.
- **Management Dashboard**: Visit `/manage` to toggle visibility (Show/Hide) or edit metadata for sculptures.
- **Admin Access**: Sign in with **rhobile@gmail.com**. This grants full write access to Firestore and Storage.
- **Media Folders**: 
  - `ks-images/`: Sculpture thumbnails (.jpg, .jpeg, .png).
  - `ks-videos/`: Sculpture videos (.mp4).

## 📱 Mobile & Typography Optimization
- **Titles**: Set to **9pt/11pt uppercase**. Configured to **wrap to a second line** on narrow screens to prevent being cut off.
- **Spacing**: Vertical gaps between videos and titles are tightened for a sleek, cohesive look on mobile portrait screens.

## 🔐 Troubleshooting Repository Mismatch
If you see a different repository name (like `studio-2may`) in the push dialog:
1. Look at the **top header toolbar** next to the project name.
2. Click the **GitHub icon** or the **Settings (cog)**.
3. Disconnect the current repository and search for **rhobile/kinetic-sculpture-2** to reconnect it.

## 🚀 Direct GitHub Deployment
1. **Publish**: Click the **PUBLISH** button in the top toolbar to apply changes to your files.
2. **Push**: Click the **Cloud with Up Arrow** icon.
3. **Commit Message**: Type your own summary (e.g., "Adjust mobile spacing and title wrapping") in the message box that appears.
