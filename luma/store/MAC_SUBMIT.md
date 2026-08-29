# Submit Luma to the App Store (Mac)

This Linux/cloud environment **cannot** archive or upload an IPA. Do these steps on a Mac with Xcode 16+ and an enrolled Apple Developer account ($99/year).

There is no `apps.apple.com` link until App Review approves the binary.

## 0. Once, on Apple’s sites
1. Enroll at [developer.apple.com/programs](https://developer.apple.com/programs).
2. Sign the **Paid Applications** agreement in App Store Connect → Business.
3. App Store Connect → Apps → **+** → New App
   - Bundle ID: `app.luma.spark` (create it under Certificates, Identifiers & Profiles if missing)
   - SKU: `luma-spark-ios`
4. Features → In-App Purchases → Subscription group **Luma Plus**
   - `app.luma.spark.plus.monthly` — $4.99, 1 month, 7-day free trial
   - `app.luma.spark.plus.yearly` — $29.99, 1 year, 7-day free trial
   - Localization: copy from `luma/store/LISTING.md`
5. Paste Privacy Policy and Terms URLs (GitHub Pages on `docs/` or any public https page).

## 1. Open the native project
```bash
git clone https://github.com/Mithunprom/CohortAnalytics-main.git
cd CohortAnalytics-main/luma
npm install
npm test
npm run ios:sync
npx cap open ios
```

Xcode opens `ios/App/App.xcworkspace` (use the **workspace**, not the `.xcodeproj`, after CocoaPods).

If CocoaPods is missing: `sudo gem install cocoapods && cd ios/App && pod install`.

## 2. Signing
- Target **App** → Signing & Capabilities
- Team: your Apple Developer team
- Bundle Identifier: `app.luma.spark`
- Add capability **In-App Purchase** if it is not already listed
- Destination: Any iOS Device (arm64) for Archive

The shared scheme **App** already points at `LumaPlus.storekit` so Simulator purchases work without App Store Connect products.

## 3. Sanity check on a phone or Simulator
- Onboarding → skip into Games → one Rift Delve run
- Plus → Yearly → confirm StoreKit sheet (Simulator uses `LumaPlus.storekit`)
- Restore Purchases
- Airplane mode: sparks still save on device

## 4. Archive and upload
Product → Destination: **Any iOS Device** → **Archive**.  
Organizer → Distribute App → App Store Connect → Upload.

Wait for processing, then in App Store Connect:
- Select the build
- Attach the two Plus products to the version
- Add screenshots (see `LISTING.md`)
- Answer the encryption question: **No** (`ITSAppUsesNonExemptEncryption` is already `false`)
- Submit for TestFlight first, then **Add for Review**

## 5. After approval
The public link looks like `https://apps.apple.com/app/idXXXXXXXX`. Put it in the README. Plus revenue (minus Apple’s 15–30%) lands in App Store Connect → Payments.

## If Archive fails
- `pod install` inside `luma/ios/App`
- Clean Build Folder
- Confirm `luma/ios/App/App/public/index.html` exists (`npm run ios:sync`)
- Deployment target is iOS 15 (StoreKit 2)
