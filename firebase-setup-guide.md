# Firebase Setup for Saved Places Map

## Overview

You'll end up with this architecture:
- **Firebase Auth** → Google login, you control who has access
- **Cloud Firestore** → Database with places + visited status per user
- **Hosting** → Optional — you can still host the HTML file anywhere

The free tier covers plenty (50K reads/day, 20K writes/day).

---

## Step 1: Create a Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Sign in with your Google account
3. Click **"Create a project"**
4. Give it a name, e.g. `saved-places-map`
5. Google Analytics: choose **no** (unnecessary for this)
6. Click **"Create project"** → wait 30 sec → click **"Continue"**

---

## Step 2: Add a web app

1. From the project dashboard, click the large **`</>`** icon (Web)
2. App nickname: `saved-places`
3. Do NOT check "Firebase Hosting" (unless you want to host there)
4. Click **"Register app"**
5. You'll now get a code block with your config — **copy and save it**. It looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "saved-places-map.firebaseapp.com",
  projectId: "saved-places-map",
  storageBucket: "saved-places-map.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

6. Click **"Continue to console"**

---

## Step 3: Enable Google Authentication

1. In the left sidebar: click **"Build" → "Authentication"**
2. Click **"Get started"**
3. Under "Sign-in method", click **"Google"**
4. **Enable** it
5. Choose your email as the support email
6. Click **"Save"**

### Restrict access to specific users

By default, Firebase Auth lets anyone with a Google account sign in. To restrict it to your family, you do that in **Firestore Security Rules** (Step 5). Alternatively, you can manage it manually via an allow-list in the rules.

---

## Step 4: Create Firestore database

1. In the left sidebar: click **"Build" → "Firestore Database"**
2. Click **"Create database"**
3. Choose location: **eur3 (europe-west)** (since you're in Denmark)
4. Start in **"production mode"** (we'll set up rules in the next step)
5. Click **"Create"**

### Data structure

Firestore organizes data in collections and documents. The structure will be:

```
trips/                          ← collection
  japan-2026/                   ← document (one per trip)
    name: "Japan 2026"
    places: [ ... ]             ← array with all places including visited status
```

Everything is shared — when one person marks a place as visited, everyone sees it immediately. No separate user data needed.

---

## Step 5: Set security rules

1. In Firestore, click the **"Rules"** tab
2. Replace the content with this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper function: only allowed emails
    function isAllowed() {
      return request.auth != null &&
        request.auth.token.email in [
          'your-email@gmail.com',
          'stinas-email@gmail.com',
          'linus-email@gmail.com'
        ];
    }

    // Trips: all allowed users can read and write
    match /trips/{tripId} {
      allow read, write: if isAllowed();
    }
  }
}
```

3. **Replace the three emails** with your actual Gmail addresses
4. Click **"Publish"**

Now only you three can sign in, see the map, and mark places as visited — all changes are shared instantly.

---

## Step 6: Upload your trip data

The easiest way to get data in the first time:

1. Go to **Firestore → Data** in the Firebase Console
2. Click **"Start collection"** → Collection ID: `trips`
3. Document ID: `japan-2026`
4. Add fields:
   - `name` (string): `Japan 2026`
   - `places` (array): Here you can paste your JSON array

**Or** (easier) — I'll build an admin function into the app that uploads your existing JSON data to Firestore with one click.

---

## Step 7: Add Firebase SDK to the app

Add these scripts to the `<head>` of the HTML file:

```html
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"></script>
```

And in the JS, add roughly 60 lines that:
1. Initialize Firebase with your config
2. Show a "Sign in with Google" button
3. Load places from Firestore instead of localStorage
4. Save visited status to Firestore (shared between all users)

---

## Step 8 (optional): Host on Firebase Hosting

If you want a clean URL (e.g. `saved-places-map.web.app`):

1. Install Firebase CLI: `npm install -g firebase-tools`
2. In your project folder: `firebase login`
3. `firebase init hosting`
   - Select your project
   - Public directory: `.` (or `public`)
   - Single-page app: **Yes**
4. Place `saved-places-map.html` (renamed to `index.html`), `manifest.json` and your JSON files in the folder
5. `firebase deploy`

You'll get a URL like `https://saved-places-map.web.app`

---

## What changes in the app?

| Before (now)              | After (Firebase)                        |
| ------------------------- | --------------------------------------- |
| localStorage              | Firestore                               |
| No login                  | Google login                            |
| Data on one device only   | Data synced across devices              |
| Visited is personal       | Visited is shared — everyone sees changes |
| manifest.json files       | Trips collection in Firestore           |

The rest of the app (map, markers, categories, UI) stays identical.

---

## Next steps

1. Complete Steps 1–5 in the Firebase Console (about 10 minutes)
2. Send me your `firebaseConfig` from Step 2
3. Then I'll build the Firebase integration into the app
