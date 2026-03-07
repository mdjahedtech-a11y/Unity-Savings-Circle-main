# Deploying to Vercel

This guide will help you deploy your Unity Savings Circle application to Vercel.

## Prerequisites

1.  A [GitHub](https://github.com/) account.
2.  A [Vercel](https://vercel.com/) account.
3.  Your Supabase project URL and Anon Key.

## Step 1: Push Your Code to GitHub

1.  Create a new repository on GitHub.
2.  Push your local code to this repository.
    *   If you are using this AI Studio environment, you might need to download the code first or use the provided Git integration if available.
    *   Ideally, initialize git: `git init`, `git add .`, `git commit -m "Initial commit"`, `git remote add origin <your-repo-url>`, `git push -u origin main`.

## Step 2: Import Project to Vercel

1.  Log in to your Vercel Dashboard.
2.  Click **"Add New..."** -> **"Project"**.
3.  Select **"Import"** next to the GitHub repository you just created.

## Step 3: Configure Project Settings

Vercel should automatically detect that this is a **Vite** project.

1.  **Framework Preset:** Ensure it says `Vite`.
2.  **Root Directory:** Leave as `./`.
3.  **Build Command:** `npm run build` (default).
4.  **Output Directory:** `dist` (default).

## Step 4: Add Environment Variables (Crucial!)

Before clicking Deploy, expand the **"Environment Variables"** section. Add the following variables from your Supabase project:

| Key | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | Your Supabase Project URL (e.g., `https://xyz.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase Anon/Public Key |

> **Note:** You can find these in your Supabase Dashboard under **Project Settings -> API**.

## Step 5: Deploy

1.  Click **"Deploy"**.
2.  Wait for the build to complete.
3.  Once finished, you will get a live URL (e.g., `https://your-project.vercel.app`).

## Troubleshooting

*   **404 on Refresh:** If you refresh a page and get a 404 error, ensure the `vercel.json` file is present in your repository root. This handles client-side routing.
*   **Database Connection Error:** Double-check your Environment Variables in Vercel settings. If they are wrong, the app won't connect to Supabase.
