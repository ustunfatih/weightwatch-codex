# Google Sheets Integration Setup Guide

This guide will help you connect your Weightwatch dashboard to your Google Sheets for real-time data synchronization.

## Prerequisites

- A Google account
- Access to Google Cloud Console
- Your weight tracking Google Sheet

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click **"New Project"**
4. Enter a project name (e.g., "Weightwatch Dashboard")
5. Click **"Create"**

## Step 2: Enable Google Sheets API

1. In your Google Cloud project, go to **"APIs & Services" > "Library"**
2. Search for "Google Sheets API"
3. Click on it and press **"Enable"**

## Step 3: Create OAuth 2.0 Credentials

### Configure OAuth Consent Screen

1. Go to **"APIs & Services" > "OAuth consent screen"**
2. Select **"External"** user type
3. Click **"Create"**
4. Fill in the required fields:
   - App name: `Weightwatch Dashboard`
   - User support email: Your email
   - Developer contact information: Your email
5. Click **"Save and Continue"**
6. On the Scopes page, click **"Add or Remove Scopes"**
7. Add the following scope:
   ```
   https://www.googleapis.com/auth/spreadsheets
   ```
8. Click **"Update"** then **"Save and Continue"**
9. Add your email as a test user
10. Click **"Save and Continue"** and then **"Back to Dashboard"**

### Create OAuth Client ID

1. Go to **"APIs & Services" > "Credentials"**
2. Click **"Create Credentials" > "OAuth client ID"**
3. Select **"Web application"**
4. Name it: `Weightwatch Web Client`
5. Under **"Authorized JavaScript origins"**, add:
   ```
   http://localhost:5173
   http://localhost:4173
   http://127.0.0.1:5173
   http://127.0.0.1:4173
   ```
6. Under **"Authorized redirect URIs"**, add:
   ```
   http://localhost:5173
   http://localhost:4173
   http://127.0.0.1:5173
   http://127.0.0.1:4173
   ```
7. Click **"Create"**
8. **IMPORTANT**: Copy your **Client ID** - you'll need this!

## Step 4: Get Your Google Sheet ID

1. Open your weight tracking Google Sheet
2. Look at the URL in your browser. It will look like:
   ```
   https://docs.google.com/spreadsheets/d/1te4QfcgjiMIHYAmRar0EdFyiVeOs2D-lj8lXGE0lqmk/edit
   ```
3. The Sheet ID is the long string between `/d/` and `/edit`:
   ```
   1te4QfcgjiMIHYAmRar0EdFyiVeOs2D-lj8lXGE0lqmk
   ```

## Step 5: Configure Your Application

### Create Environment File

Create a file named `.env` in your project root:

```env
VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
VITE_GOOGLE_SHEET_ID=your-sheet-id-here
VITE_GOOGLE_API_KEY=your-google-api-key-here
```

Replace the values with:
- `VITE_GOOGLE_CLIENT_ID`: The OAuth Client ID from Step 3
- `VITE_GOOGLE_SHEET_ID`: The Sheet ID from Step 4
- `VITE_GOOGLE_API_KEY`: Optional API key for better quota tracking

### Update `.gitignore`

Make sure `.env` is in your `.gitignore` file to prevent committing your credentials:

```
# .gitignore
.env
.env.local
```

## Step 6: Sheet Structure

Your Google Sheet should have the following structure:

### Sheet 1: "Weight Data"

| Date       | Week Day  | Weight | Change % | Change kg | Daily Change | Recorded At |
|------------|-----------|--------|----------|-----------|--------------|-------------|
| 2025-09-28 | Sunday    | 112.35 | 0.00     | 0.00      | 0.00         | 2025-09-28T09:15 |
| 2025-10-04 | Saturday  | 112.00 | -0.31    | -0.35     | -0.06        | 2025-10-04T08:40 |

### Sheet 2: "Target"

| Field          | Value      |
|----------------|------------|
| Start Date     | 2025-09-28 |
| Start Weight   | 112.35     |
| End Date       | 2026-07-31 |
| End Weight     | 75         |
| Total Duration | 307        |
| Total kg       | 37.35      |
| Height         | 170        |

## Step 7: Enable Google Sheets Integration in App

Once you've completed the setup:

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Click on the **Settings** icon in the app header
3. You'll see your Sheet ID is already configured from the `.env` file
4. Click **"Connect to Google Sheets"**
5. Sign in with your Google account
6. Grant permissions to access your spreadsheets
7. Click **"Sync Now"** to fetch your data

## Troubleshooting

### "Access blocked: This app's request is invalid" / redirect_uri_mismatch

- Add the exact origin you're using (for example, `http://127.0.0.1:5173`) to both Authorized JavaScript origins and Authorized redirect URIs
- Make sure you're opening the app with the same URL you added in Google Cloud

### "Access Denied" Error

- Make sure your email is added as a test user in the OAuth consent screen
- Verify that the Google Sheets API is enabled
- Check that your redirect URIs match exactly (including http/https)

### "Invalid Client" Error

- Double-check your Client ID in the `.env` file
- Make sure there are no extra spaces or quotes
- Restart your development server after changing `.env`

### Data Not Syncing

- Verify your Sheet ID is correct
- Check that your sheet structure matches the format above
- Open browser DevTools Console to see detailed error messages
- Ensure Date and Weight headers exist exactly in the Weight Data tab

## Security Notes

- **Never commit your `.env` file** to version control
- The Client ID is not a secret, but it's still best practice to keep it in `.env`
- For production deployment, add your production URL to authorized origins
- Consider implementing a backend proxy for enhanced security in production

## Next Steps

Once connected, your app will:
- ✅ Fetch data from Google Sheets on load
- ✅ Sync changes to Google Sheets when you add/edit/delete entries
- ✅ Show sync status in the header
- ✅ Support offline mode with local caching
- ✅ Auto-sync every 5 minutes (plus refresh on focus)

Enjoy your connected weight tracking experience! 🎉
