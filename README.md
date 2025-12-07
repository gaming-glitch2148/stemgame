This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Deploy to Google Play Store (TWA)

To deploy this Next.js app to the Google Play Store as a Trusted Web Activity (TWA):

1.  **Prerequisites:**
    *   Ensure your app is deployed to a public HTTPS URL (e.g., Vercel).
    *   Ensure `public/manifest.json` is present and valid.
    *   Ensure you have icon files (`icon-192x192.png` and `icon-512x512.png`) in the `public` folder.

2.  **Install Bubblewrap:**
    Bubblewrap is a CLI tool from Google to wrap PWAs.
    ```bash
    npm install -g @bubblewrap/cli
    ```

3.  **Initialize Android Project:**
    Run the init command and follow the prompts. You'll need your deployed web app URL.
    ```bash
    bubblewrap init --manifest=https://your-app-url.com/manifest.json
    ```

4.  **Build the App:**
    ```bash
    bubblewrap build
    ```
    This generates an Android App Bundle (`.aab`) file and an APK.

5.  **Verify Ownership (Asset Links):**
    *   Copy the **SHA-256 fingerprint** output by the Bubblewrap build process.
    *   Open `public/assetlinks.json` in your project.
    *   Replace `REPLACE_WITH_YOUR_APP_SHA256_FINGERPRINT` with your actual fingerprint.
    *   Redeploy your Next.js app so the file is accessible at `https://your-app-url.com/.well-known/assetlinks.json` (Next.js serves `public` folder files at root, but check your routing).
    *   *Note:* You might need to configure `next.config.js` or vercel rewrites to serve `.well-known` correctly if it doesn't work out of the box.

6.  **Upload to Play Console:**
    *   Create a developer account on Google Play Console.
    *   Create a new app and upload the `.aab` file generated in step 4.
