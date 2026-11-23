# ClashDaSarva Creator Website

React + Vite + Firebase (Auth, Firestore, Storage) · deploy on Vercel.

## 1. Firebase setup
1. Create a project at console.firebase.google.com and add a **Web app**; copy its config.
2. Enable **Authentication → Email/Password**, then create ONE user (your admin email) in the console.
3. Create a **Firestore** database and a **Storage** bucket (Storage needs the Blaze plan; without it, paste image URLs instead of uploading).
4. Paste `firestore.rules` and `storage.rules` into the console Rules tabs, replacing `YOUR_ADMIN_EMAIL` with your admin email, then Publish.

## 2. Run locally
```
npm install
cp .env.example .env     # fill in the Firebase keys + VITE_ADMIN_EMAIL
npm run dev
```
Open `/admin`, sign in, and fill in General, Socials (replace the placeholder links, especially the Discord invite), Videos, Giveaways and Achievements.

## 3. YouTube
- Manual: Admin → Videos → paste a YouTube link (thumbnail is automatic).
- API: set `VITE_YOUTUBE_API_KEY` (YouTube Data API v3, restrict to your domain) and the channel ID in General, then click **Sync from YouTube**.

## 4. Deploy to Vercel
Import the repo, add every `VITE_*` variable in Project Settings → Environment Variables, deploy. `vercel.json` handles SPA routing. Add your Vercel domain under Firebase Auth → Authorized domains.

## Notes
- Subscriber count is entered manually in the dashboard (no fake numbers); milestones unlock from it.
- Seed content: the site shows defaults until you save changes in the dashboard.
