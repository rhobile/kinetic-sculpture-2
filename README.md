
# Rhobile | Gallery Management & Security Guide

## 🚀 Recommended: Direct GitHub Deployment
Ensure you are pushing to the correct repository: **rhobile/kinetic-sculpture-2**.

1.  **Wait for "All changes published"**: Look at the status bar at the very bottom.
2.  **Publish to Studio**: You MUST click the **PUBLISH** button in the top toolbar to apply changes to your files.
3.  **Push to GitHub**: Click the **Cloud with Up Arrow** icon to send changes to your live site. Enter a message like "Optimized mobile layout and admin access".

## 📂 Media Folders
Keep your storage organized using your established folders:
- **`ks-images/`**: Upload all `.jpg`, `.jpeg`, and `.png` thumbnail images here.
- **`ks-videos/`**: Upload all `.mp4` video files here.
- The dashboard and gallery will pair files automatically if they share the same filename (e.g., `sculpture.jpg` and `sculpture.mp4`).

## 🔐 Hidden Admin Doorway
Visit `https://rhobile.com/manage` directly to log in as **rhobile@gmail.com**. Once logged in, a "Unified Management" link will appear in your sidebar.

## 🌀 Cinematic Storytelling
Use `[video:filename.mp4]` in your Page content for auto-playing, muted videos that play as the user scrolls. Files should be located in `ks-videos/`.

## 🛠️ Mobile Spacing & Typography
- **Spacing**: Vertical gaps between videos and titles are tightened for an elegant mobile portrait look.
- **Titles**: Optimized at **9pt/11pt** uppercase to ensure they fit on a single line.

## 🌐 Storage Bucket Notice
All assets are served from the **`ks-bucket-nl`** bucket. While physically located in its primary region, Firebase CDN optimizes delivery globally for USA and International users.
