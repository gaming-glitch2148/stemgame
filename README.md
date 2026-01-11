# Stem Blast: AI-Powered STEM Quiz Game

Stem Blast is an interactive, curriculum-driven quiz game for students from Kindergarten to 12th Grade. It leverages a robust web stack and is packaged as a Trusted Web Activity (TWA) for deployment on the Google Play Store.

## ✨ Features

- **Dynamic Curriculum:** Questions are served from local CSV files, mapped by Grade, Subject, and Difficulty.
- **Adaptive UI:** The interface automatically switches between Light and Dark mode based on system settings.
- **User Authentication:** Secure sign-in using Google, powered by NextAuth.js.
- **Session Persistence:** Remembers a user's score, grade, subject, and difficulty, allowing them to pick up where they left off.
- **Monetization:**
  - **Banner Ads:** Google AdSense for non-premium users.
  - **Rewarded Ads:** A "Watch Ad" button to get a hint.
  - **Subscriptions:** $0.99/month or $10/year plans managed by Stripe to remove all ads.
- **Android TWA:** Packaged for the Google Play Store, offering a fullscreen, native-like experience.

## 🛠️ Tech Stack

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS
- **Authentication:** NextAuth.js
- **Payments:** Stripe
- **Advertisements:** Google AdSense
- **Deployment:** Vercel
- **Android Wrapper:** Bubblewrap CLI

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- npm, yarn, or pnpm
- Android Studio (for TWA builds)

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd stem-blast
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create a file named `.env.local` in the root of the project and add the following keys:

```
# Google Auth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=a-long-random-string-for-security

# Stripe Payments
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID=price_...
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 📦 Deploying to Production

1.  **Vercel:** Push the `main` branch to your GitHub repository. Connect the repo to a new Vercel project.
2.  **Environment Variables:** Add all the variables from your `.env.local` file to the Vercel project settings.
3.  **Android TWA:**
    -   Generate a signed APK/AAB in Android Studio.
    -   Use `signingReport` to get your `SHA-256` fingerprint.
    -   Update `public/assetlinks.json` with the fingerprint and push to Vercel.
    -   Upload the `.aab` file to the Google Play Console.

## ⚖️ Privacy Policy

This app is designed for children and adheres to Google's Families policies. You can view our full privacy policy [here](./public/privacy.html).
