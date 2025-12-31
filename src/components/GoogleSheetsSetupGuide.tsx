import { ExternalLink } from 'lucide-react';

export function GoogleSheetsSetupGuide() {
  return (
    <div className="mt-4 space-y-3 rounded-2xl border border-[color:var(--border-subtle)] bg-[var(--paper-2)] p-4">
      <h4 className="text-sm font-semibold text-[var(--accent-2)]">
        Google Sheets Setup (In‑App)
      </h4>
      <ol className="list-decimal pl-5 space-y-2 text-sm text-[var(--ink)]">
        <li>Create a Google Sheet with two tabs: <strong>Weight Data</strong> and <strong>Target</strong>.</li>
        <li>Ensure <strong>Weight Data</strong> has headers: Date, Week Day, Weight, Change %, Change kg, Daily Change, Recorded At.</li>
        <li>Enable the Google Sheets API in Google Cloud.</li>
        <li>Create an OAuth Client ID (Web) and add your app origin.</li>
        <li>
          Add both <code>http://localhost:5173</code> and <code>http://127.0.0.1:5173</code> to
          Authorized JavaScript origins and redirect URIs.
        </li>
        <li>(Optional) Add <code>VITE_GOOGLE_API_KEY</code> for better quota tracking.</li>
        <li>Set <code>VITE_GOOGLE_CLIENT_ID</code> in your env and restart the dev server.</li>
        <li>Paste your Sheet ID in the field above and click “Connect”.</li>
      </ol>
      <p className="text-xs text-[var(--ink-muted)]">
        If you see <code>redirect_uri_mismatch</code>, your current origin must be added in Google
        Cloud Console.
      </p>
      <a
        href="https://developers.google.com/sheets/api/quickstart/js"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent-2)] underline hover:opacity-80"
      >
        Google Sheets API guide <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}
