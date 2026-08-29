# Luma — Daily Spark Companion

A cozy firefly lives on your phone. Each day Luma brings a **60-second Spark** — a tiny quest, a riddle, a breath, or a mini-game. Finish it and a star lands in your constellation. Streaks grow the companion. **Luma Plus** is a cancelable Apple subscription that funds the product without ads, gambling, or selling user data.

This is the consumer app wrapped for the App Store (`bundle id app.luma.spark`). The original Cohort Analytics dashboard remains in the repo root.

## Why people open it
- A character who reacts (Luma evolves from Ember → Nova)
- A fresh daily quest from 90 prompts across Create, Kindness, Curious, Body, and Play
- A featured **Rift Delve** cave raid (original exploration — not a clone of any sandbox). Walk, mine glow-ore, dodge shadow mites. Depth raises the live zone difficulty; explore XP unlocks Scout → Runner → Delver → Mythic.
- **Neon Rush** and Star Catch scale speed from that same delve rank.
- Daily sparks, constellation sky, and a neon HUD aimed at teens.
- A sky of stars you actually made, not a generic calendar
- Mood check-in that stays on-device

## Why people pay (and how you earn)
Apple takes 15–30% of auto-renewable subscriptions. Luma is built so Plus feels optional and worth it:

| Free | Plus ($4.99 / month or $29.99 / year, 7-day trial) |
| --- | --- |
| 1 spark / day | Unlimited sparks + rerolls |
| 2 arcade plays / day | Unlimited arcade energy |
| Night-sky nest | Aurora, coral, cabin habitats + extra glows |
| 7-day local history still on device | Streak shield every 7 days |

There is no “earn cash as a user” mechanic. That would be unsafe and would fail App Review. Income is **your** subscription revenue.

## Run it (web)
```bash
cd luma
npm install
npm test
npm run dev
```
Open the printed local URL. On a phone-sized viewport it feels like a native shell.

## Ship to the App Store
This repo is ready to open in Xcode. It cannot be uploaded from Linux — you need a Mac and an Apple Developer Program membership.

1. Follow **`store/MAC_SUBMIT.md`** (enroll, create the app, archive, TestFlight, submit).
2. Paste listing copy from **`store/LISTING.md`**.
3. Host `docs/privacy.html` and `docs/terms.html` (GitHub Pages on the `docs/` folder, or any public https URL).
4. On a Mac:
   ```bash
   cd luma
   npm install
   npm run ios:sync
   npx cap open ios
   ```
5. Products (already in `ios/App/LumaPlus.storekit` for Simulator):
   - `app.luma.spark.plus.monthly`
   - `app.luma.spark.plus.yearly`

Native Plus uses StoreKit 2 (`plugins/luma-iap`). The web preview still uses a local demo receipt so you can try Plus in a browser. Restore Purchases is on the Plus screen.

There is no App Store link until Apple approves the first binary.

## Safety
- No ads, trackers, loot boxes, or real-money rewards to users
- Kindness quests never require contacting strangers
- Breathing/body prompts are comfort tools, not medical treatment
- Easy paywall dismiss; first daily spark is never paywalled
