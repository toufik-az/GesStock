# GesStock

GesStock is a stock and checkout app for small shops in Algeria. It runs on Windows and Android, with a French interface and prices in dinars.

You can manage products, scan barcodes, record sales and deliveries, track low stock, and view sales reports. Managers can also create cashier accounts.

## Windows and Android

In connected mode, both apps use the same Supabase project. Sign in with an account from the same store to see its products and sales on either device. The phone does not need the PC to be running.

Android bundles the desktop interface and adapts it to a smaller screen. You do not need to host a separate website for the APK. Data screens refresh every 15 seconds, and you can refresh them manually.

Android also has a local mode with PIN login and a Room database on the phone. It works without the cloud connection. Its data stays separate: the app does not upload local products or sales to Supabase.

Version 1.1 updates the local interface with clearer dark-mode colors, smaller controls, grouped settings and spacing for Android's system bars.

## Project layout

```text
android/          Android app, including local mode and the connected WebView
exe/frontend/     React, TypeScript and Tailwind interface
exe/backend/      Express API for registration and staff management
exe/electron/     Windows app packaging
exe/supabase/     Database migrations and access policies
```

## Set up the shared store

Use one Supabase project for both apps. If you already use GesStock on Windows, keep that project.

For a new database, run the SQL files in [exe/supabase/migrations](exe/supabase/migrations) in numeric order, from 0001 to 0006. On an existing database, run only the migrations you have not applied.

Apply `0006_concurrent_checkout.sql` before using several devices at checkout. It locks the affected stock rows during a sale and checks quantities, current prices and payment amounts. Adding the file to the repository does not apply it to your database.

### Backend

Deploy `exe/backend` to a Node host with a public HTTPS address. Copy its `.env.example` to `.env` for local development, or set the variables in your hosting provider's dashboard.

If you already have a deployment from the older repository layout, update its root directory to `exe/backend` (or `exe/frontend` for a web deployment).

```powershell
cd exe/backend
npm ci
npm run build
npm start
```

Keep `SUPABASE_SERVICE_ROLE_KEY` on the backend only. Never put it in the frontend or APK.

`FRONTEND_URL` controls which browser origins the backend accepts. It can contain several origins separated by commas, without trailing slashes. Android's bundled origin, `https://appassets.androidplatform.net`, and Electron's null origin are handled separately. A literal `*` does not allow every origin.

### Frontend

Copy `exe/frontend/.env.example` to `exe/frontend/.env` and fill in:

- `VITE_SUPABASE_URL`: your Supabase project URL.
- `VITE_SUPABASE_ANON_KEY`: its public anon or publishable key.
- `VITE_API_URL`: your Express backend's HTTPS address, without a trailing slash.

The frontend uses Supabase directly for stock and sales. Registration and staff management use the Express backend.

```powershell
cd exe/frontend
npm ci
npm run dev
```

Create your store once. On Android, choose **Ouvrir mon magasin connecté** and use the same manager account, or a cashier account created for that store. Registering another store creates separate data.

## Build the Android app

You need Node.js and npm, JDK 17 or a compatible newer JDK, and Android SDK 35. Set `JAVA_HOME` and put your SDK location in `android/local.properties`:

```properties
sdk.dir=C:/Users/YOUR_NAME/AppData/Local/Android/Sdk
```

Install the frontend dependencies first, then build the APK:

```powershell
cd exe/frontend
npm ci
cd ../../android
.\gradlew.bat assembleDebug
```

Gradle builds and bundles the shared frontend automatically. It uses the frontend's `.env` by default. To give Android its own configuration, copy `.env.android.example` to `.env.android.local` in `exe/frontend` and fill in the real endpoints. Android builds require HTTPS endpoints and a public Supabase key.

The debug APK is here:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Transfer it to your phone and open it to install. To keep existing local data, install updates over the previous app using the same signing key. Uninstalling removes that data. A release build needs your own signing configuration.

## Build the Windows app

Build the frontend, copy its output into Electron's `frontend-dist` folder, then package the app:

```powershell
cd exe/frontend
npm ci
npm run build
cd ../electron
npm ci
New-Item -ItemType Directory -Force frontend-dist
Copy-Item ../frontend/dist/* frontend-dist -Recurse -Force
npm run dist
```

Electron writes the Windows installer to `exe/electron/dist-exe`.

## Checks before using real stock

Run the backend checks with `npm test` from `exe/backend`. The Android debug build, frontend compilation and backend CORS tests have passed locally.

The database migration and live synchronization still need testing against a deployed Supabase project. Camera scanning, Android printing and the updated local layouts also need device checks.

Start with a test product:

1. Add it on Windows, then refresh Android.
2. Sell it on Android and check the stock and sales history on Windows.
3. Set its stock to one and try selling it from both devices at once. Only one sale should succeed.
4. Check airplane mode, reconnection, camera permissions, printing and signing into another store.
5. Open local mode and confirm any existing phone data is still there.

If a payment request loses its connection, check the sales history before trying again. Connected mode does not queue offline sales.

The existing reporting functions, delivery validation and inactive-account restrictions outside checkout still need a full access-control review before hosting stores for other people.

## Configuration and generated files

Keep `.env` files, signing keys and local SDK paths out of Git. The included example files contain placeholders. Supabase public keys belong in client apps; service-role keys do not.

The ignore rules also exclude dependencies, APKs, installers and generated build files. They cannot remove secrets from earlier commits.
