# LARRYSCENT admin dashboard: setup

Your site works without any of this (it shows the built-in product list). Do these steps once to turn on the dashboard, live products and saved orders.

## 1. Create the Firebase project
1. Go to https://console.firebase.google.com and click **Create a project**. Stay on the free **Spark** plan.
2. In the project, click **Add app > Web (</>)**, name it "LARRYSCENT", and register it.
3. Copy the `firebaseConfig` values it shows into **js/firebase-config.js** (apiKey, authDomain, projectId, appId).

## 2. Turn on the database
1. **Build > Firestore Database > Create database.** Choose a location close to you and start in **production mode**.
2. Open the **Rules** tab, replace everything with the contents of **firestore.rules**, and click **Publish**.

## 3. Turn on admin sign-in
1. **Build > Authentication > Get started > Email/Password > Enable.**
2. **Users tab > Add user.** Enter your email and a strong password. Copy the **User UID** it shows.
3. In **Firestore Database > Start collection**, create a collection called `admins`. Add a document whose **Document ID is your User UID** (paste it). Add one field, e.g. `role` = `owner`.
   Only accounts with a document here can use the dashboard.

## 4. Put the site online and open the dashboard
- Upload the whole `larryscent` folder to your host (Firebase Hosting is free and works well).
- While testing on your computer, serve the folder with a local server (for example the VS Code "Live Server" extension). Opening files by double-click will not connect to Firebase.
- In **Authentication > Settings > Authorized domains**, add your live domain.
- The dashboard is at `yoursite.com/admin/`. Sign in, then click **Import starter products** to copy your 8 perfumes into the database. Set their real stock afterwards.

## Notes
- Product photos are shrunk in the browser and stored with the product, so you do not need Cloud Storage. Google now requires a billing account (the Blaze plan) for Cloud Storage; this setup avoids that.
- Stock is edited by hand. It is not reduced automatically when an order arrives.
- Order totals are calculated in the customer's browser. Check each order against your price list before confirming.
- No payment is collected online yet.
