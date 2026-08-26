# Dua Card (দোয়া কার্ড)

**Dua Card** is a private, mobile-first Progressive Web App (PWA) designed for personal collection, organization, rich-text editing, comfortable reading, and touch reordering of Islamic duas.

It stores all content locally on your device via **IndexedDB** with zero external cloud dependencies.

---

## 🌟 Key Features

- **Direct Instant Access**: Zero login roadblocks or external authentication required.
- **Offline-First IndexedDB Storage**: Zero cloud database dependencies. Your duas never leave your device.
- **Semantic Rich-Text Editor**: Built with TipTap, featuring 5 predefined typography styles:
  1. *Dua Title* (দোয়ার শিরোনাম)
  2. *Bengali Pronunciation* (উচ্চারণ)
  3. *Meaning / Translation* (অর্থ ও অনুবাদ)
  4. *Virtue / Purpose* (ফজিলত ও শিক্ষা)
  5. *Normal Paragraph* (সাধারণ অনুচ্ছেদ)
- **Long-Press Drag & Drop**: Touch-friendly reordering (long-press ~400ms with haptic feedback) plus accessible Move Up / Move Down controls.
- **Newest-at-Top**: Newly created duas automatically appear at the top.
- **Offline Fast Search**: Instant search across titles, pronunciation, translations, and notes.
- **Distraction-Free Reader**: Comfortable Bengali typography and optional *Screen Wake Lock* to keep your screen awake while reciting.
- **Pure-Black OLED Dark Mode & Light Mode**: True `#000000` background for battery efficiency and comfort.
- **Validated Backup & Restore**: Download human-readable JSON backups with Zod schema validation, duplicate-free merge, and safety snapshots.
- **PWA & Android Installation**: Fully installable as a standalone app from Google Chrome.

---

## 📱 Why Data Stays Local (No Cloud Sync)

> [!IMPORTANT]
> - **Privacy**: Dua Card does not transmit your personal notes or duas to any third-party server or cloud database.
> - **Offline Speed**: Your data loads instantly from your device's browser **IndexedDB** (`DuaCardDB`), even in airplane mode.
> - **Backup Recommendation**: Because browser cache clearing or uninstalling the PWA can remove IndexedDB storage, please use the built-in **Backup Export** feature periodically to save a `.json` backup file.

---

## 🚀 Deploying to Vercel

1. Push your repository to GitHub.
2. In the [Vercel Dashboard](https://vercel.com/dashboard), click **Add New** > **Project** and import your repository.
3. Click **Deploy**. (No environment variables or external database required!)

---

## 📲 How to Install PWA on Android (Chrome)

1. Open your deployed Dua Card URL in **Google Chrome on Android**.
2. Tap the **"ইনস্টল করুন" (Install)** button in the in-app banner, OR:
3. Tap the three dots menu (**⋮**) in Chrome's top right corner.
4. Tap **Add to Home screen** (or **Install app**).
5. Dua Card will install as a standalone, distraction-free app on your home screen with offline capability.

---

## 💾 How to Export & Restore Backups

### Exporting Backup:
1. Tap the **Settings (⚙️)** icon in the header.
2. Tap **"ব্যাকআপ এক্সপোর্ট" (Export Backup)**.
3. A file named `dua-card-backup-YYYY-MM-DD.json` will download to your device.

### Restoring Backup:
1. Tap the **Settings (⚙️)** icon.
2. Tap **"ব্যাকআপ রিস্টোর" (Restore Backup)** and choose your `.json` backup file.
3. Choose either:
   - **Merge**: Adds new duas from the backup file, skipping duplicates.
   - **Replace**: Replaces all current duas with the backup (an automatic safety snapshot is stored in the browser session beforehand).

---

## 🧪 Running Tests & Local Development

```bash
# Install dependencies
npm install

# Run local development server
npm run dev

# Run automated tests
npm test

# Build for production
npm run build
```

---

## 📜 License

Private personal use. All rights reserved.
