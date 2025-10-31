# Despia Mobile App Setup

> 🚦 **IMPORTANT: Read this file before any native feature work**
> This file is the source of truth for all Despia-native integration.

## Project Info
- **App ID**: `app.lovable.985860bc5c6b402bba1c5e7da5fead04`
- **App Name**: `despia-lovable-unity`
- **Bundle ID**: (Set in Despia Publishing Panel)
- **Package Name**: (Set in Despia Publishing Panel)

## Deep Linking Requirements (NON-NEGOTIABLE)

### iOS - Apple App Site Association (AASA)
**Must host at**: `/.well-known/apple-app-site-association`
- HTTPS only
- JSON content-type
- No redirects
- No file extension

```json
{
  "applinks": {
    "details": [
      {
        "appIDs": ["TEAMID.BUNDLEID"],
        "components": [{ "/": "/*" }]
      }
    ]
  }
}
```

**Required values:**
- `TEAMID`: From Apple Developer account
- `BUNDLEID`: From Despia Publishing Panel

### Android - Digital Asset Links
**Must host at**: `/.well-known/assetlinks.json`
- HTTPS only
- JSON content-type
- No redirects

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "PACKAGE_NAME",
      "sha256_cert_fingerprints": ["SHA256_FINGERPRINT"]
    }
  }
]
```

**Required values:**
- `PACKAGE_NAME`: From Despia Publishing Panel
- `SHA256_FINGERPRINT`: From Play Console → App Integrity

## RevenueCat Integration (Server Authority)

### Key Principle
**Server is the authority for entitlements. Client `iapSuccess` is a HINT only.**

### Flow
1. Start purchase: `despia("revenuecat://purchase?external_id={USER_ID}&product={PRODUCT_ID}")`
2. `iapSuccess` fires → show optimistic UI
3. Listen on realtime channel for server-confirmed entitlement
4. Unlock ONLY when server confirms active entitlement

### Important Rules
- Do NOT unlock from `iapSuccess` alone
- Always fetch offerings from server (don't hardcode product metadata)
- Handle `iapSuccess` on boot (iOS revalidation)
- Offer manual "Unlock" action if automatic check fails
- No infinite polling loops

### Webhook Setup
- Backend receives RevenueCat webhook
- Backend calls RevenueCat Subscribers API
- Backend upserts entitlement state
- Backend publishes realtime event to user's channel

## Device Linking

After successful login, associate device with user:

```ts
import despia from 'despia-native';

// Read Despia variables directly
const deviceUUID = despia.uuid;
const pushPlayerID = despia.onesignalplayerid;

// Send to backend to link device + push to user
await linkDeviceToUser({
  userId: currentUser.id,
  deviceUUID,
  pushPlayerID
});
```

## Push Notifications (OneSignal)

1. Configure APNs (iOS) and Firebase (Android) in OneSignal
2. Set OneSignal App ID in Despia project settings
3. After login, link `despia.onesignalplayerid` to user on backend
4. Backend sends push via OneSignal REST API

## Docs Ritual (Memory-Proof)

**ALWAYS follow this for EVERY native feature:**

1. Open sitemap: `http://lovable.despia.com/sitemap.xml`
2. Find feature page with "Lovable Prompt"
3. Open page, copy latest prompt
4. Execute prompt here
5. Record source URL below in "Documentation Sources"
6. If scraping fails, use cached references below and retry later

## Documentation Sources
- Primary sitemap: http://lovable.despia.com/sitemap.xml
- Feature pages used:
  - (URLs will be added as features are implemented)

## Docs Cache
(If live fetching fails, cached prompts can be stored here temporarily)

## Setup Instructions

### Initial Setup (Done)
```bash
npm install
```

### Run on Device/Emulator

1. **Export to GitHub**
   - Use "Export to Github" button in Lovable
   - Git pull the project locally

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Add platforms**
   ```bash
   npx cap add ios
   npx cap add android
   ```

4. **Update platform dependencies**
   ```bash
   npx cap update ios
   # or
   npx cap update android
   ```

5. **Build the web app**
   ```bash
   npm run build
   ```

6. **Sync to native**
   ```bash
   npx cap sync
   ```

7. **Run on device/emulator**
   ```bash
   npx cap run ios
   # or
   npx cap run android
   ```

   **Requirements:**
   - iOS: Mac with Xcode
   - Android: Android Studio

### After Code Changes
Whenever you git pull new changes:
```bash
npx cap sync
```

## Billing Nuance
- Query store location: `despia('getstorelocation://', ['storeLocation'])`
- Regional policy may allow secondary web checkout alongside native IAP
- Mark payment domains "Always Open in Browser" in Despia settings

## Environment Detection
```ts
const isDespia = /despia/.test(navigator.userAgent);

if (!isDespia) {
  // Provide web fallbacks
}
```

## Safe Areas (Mobile UI)
Use CSS variables for safe areas:
```css
padding-top: var(--safe-area-top);
padding-bottom: var(--safe-area-bottom);
```

## Link Handling
- Internal navigation: Use SPA router (React Router)
- External links: Open in browser by default
- OAuth/payment: Mark "Always Open in Browser" in Despia settings
- Deep links: Return via HTTPS callback to set first-party cookies

## What to Avoid
- Custom wrappers around Despia functions
- Granting access from `iapSuccess` alone
- Hardcoding paywall product metadata
- Full-screen global loaders (keep stable shell)

## Recovery If Memory Is Lost
1. Open `README.md` banner
2. Follow link to this file (`DESPIA_README.md`)
3. Use Docs Ritual to fetch current prompts before implementing features
