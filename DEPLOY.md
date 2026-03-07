# Deploying to Vercel (Step-by-Step Guide)

This guide will help you deploy your **Unity Savings Circle** application to Vercel for free.

## Prerequisites

1.  A [GitHub](https://github.com/) account.
2.  A [Vercel](https://vercel.com/) account.
3.  Your Supabase project URL and Anon Key.

---

## Step 1: Push Your Code to GitHub

Since you are currently in the AI Studio environment, you need to get your code onto GitHub.

1.  **Download/Export Code:** If you have a "Download" or "Export to GitHub" button in your AI Studio interface, use it.
    *   *Alternative:* If you are copying files manually, make sure to copy everything except `node_modules` and `.env`.
2.  **Create a New Repository:** Go to GitHub and create a new repository (e.g., `unity-savings-app`).
3.  **Push Code:** Push your code to this new repository.

---

## Step 2: Import Project to Vercel

1.  Log in to your [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click the **"Add New..."** button and select **"Project"**.
3.  You will see a list of your GitHub repositories. Find `unity-savings-app` and click **"Import"**.

---

## Step 3: Configure Project Settings

Vercel is smart and will auto-detect that this is a **Vite** project.

1.  **Framework Preset:** Ensure it says `Vite`.
2.  **Root Directory:** Leave as `./`.
3.  **Build Command:** `npm run build` (default).
4.  **Output Directory:** `dist` (default).
5.  **Install Command:** `npm install` (default).

---

## Step 4: Add Environment Variables (IMPORTANT)

Before clicking Deploy, expand the **"Environment Variables"** section. You need to add your Supabase keys here so the app can connect to your database.

Add the following variables:

| Key | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | Your Supabase Project URL (e.g., `https://xyz.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase Anon/Public Key |

> **Where to find these?**
> Go to your Supabase Dashboard -> Select Project -> **Settings** (Gear Icon) -> **API**.

---

## Step 5: Deploy

1.  Click the **"Deploy"** button.
2.  Wait for a minute or two while Vercel builds your app.
3.  Once finished, you will see a success screen with a **Visit** button.
4.  Click it to see your live app! (e.g., `https://unity-savings-app.vercel.app`)

---

## Troubleshooting

### 404 Error on Refresh
If you refresh a page (like `/members`) and get a 404 error, ensure the `vercel.json` file is present in your repository root. This file handles the routing for Single Page Applications.

### Database Connection Error
If the app loads but you can't log in or see data:
1.  Go to your Vercel Project Settings -> **Environment Variables**.
2.  Check if `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct.
3.  If you changed them, you must **Redeploy** for changes to take effect (Go to Deployments -> Redeploy).
