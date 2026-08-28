# Luma — Daily Spark Companion

A cozy firefly lives on your phone. Each day Luma brings a **60-second Spark** — a tiny quest, a riddle, a breath, or a mini-game. Finish it and a star lands in your constellation. Streaks grow the companion. **Luma Plus** is a cancelable subscription that funds the product without ads, gambling, or selling user data.

This is the consumer app to wrap for the App Store. The original Cohort Analytics dashboard remains in the repo root.

## Why people open it
- A character who reacts (Luma evolves from Ember → Nova)
- A fresh daily quest from 90 prompts across Create, Kindness, Curious, Body, and Play
- Three short games: Star Catch, Glow Memory, Word Spark
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

## Run it
```bash
cd luma
npm install
npm test
npm run dev
```
Open the printed local URL. On a phone-sized viewport it feels like a native shell.

## Ship to the App Store
1. Create the app in App Store Connect: bundle id `app.luma.spark`.
2. Create auto-renewable products:
   - `app.luma.spark.plus.monthly`
   - `app.luma.spark.plus.yearly`
3. `npm install @capacitor/core @capacitor/cli @capacitor/ios`
4. `npx cap init` (config already in `capacitor.config.json`) then `npx cap add ios && npm run build && npx cap copy ios`
5. Replace `store.subscribePlan()` with StoreKit 2 (or RevenueCat). Keep Restore Purchases.
6. App privacy: all sparks, moods, and scores are `localStorage` only in this build.
7. Review notes: “Web/demo StoreKit is local. Native build uses IAP. No user accounts. No UGC feed.”

The Cursor skill `.cursor/skills/app-store-launch/SKILL.md` is the agent that can keep building, reviewing, and shipping this loop with you.

## Safety
- No ads, trackers, loot boxes, or real-money rewards to users
- Kindness quests never require contacting strangers
- Breathing/body prompts are comfort tools, not medical treatment
- Easy paywall dismiss; first daily spark is never paywalled
