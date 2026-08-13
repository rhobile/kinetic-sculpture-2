# Rhobile | Gallery Management & Security Guide

## 🔐 How to Verify Public Access
1. **Persistent Session**: Your PC "always has the dashboard available" because you are logged in as **rhobile@gmail.com**. Firebase remembers you.
2. **Public View**: To see what a normal visitor sees, open your browser in **Incognito** or **Private Mode** and visit rhobile.com.
   - The "Management Dashboard" link will be **hidden**.
   - Navigating to `/manage` manually will show a **login screen** instead of your data.

## 🚀 GitHub Push & Commit Messages
If your custom commit messages are being ignored and replaced by AI chat text:
1. Go to the **Source Control** tab in the sidebar.
2. **Clear the text box** completely.
3. Type your own message (e.g., "Adjusted mobile layout").
4. **CRITICAL**: Click outside the text box or press Enter to ensure the UI "saves" your message before you click the Push/Cloud icon.

## 🎨 Design Notes
- **Theme**: Strictly **White Background with Black Text**.
- **Typography**: Titles are **9pt/11pt uppercase** and configured to **wrap to a second line** on mobile portrait screens so they are never cut off.
- **Spacing**: Vertical gaps between videos and text are tightened (minimal margins) for a sleek look.

## 📁 Storage Structure
- `ks-images/`: Sculpture thumbnails (.jpg, .png).
- `ks-videos/`: Sculpture videos (.mp4).
