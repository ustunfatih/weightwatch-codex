import { WeightEntry, TargetData } from '../types';
import { parseISO, format, isValid, parse } from 'date-fns';
import { STORAGE_KEYS, readString, writeString } from './storage';
import { normalizeRecordedAt, parseDateFlexible, toISODate } from '../utils/dateUtils';

const DISCOVERY_DOCS = ['https://sheets.googleapis.com/$discovery/rest?version=v4'];
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';
const WEIGHT_SHEET_NAME = 'Weight Data';
const TARGET_SHEET_NAME = 'Target';
const WEIGHT_HEADER_RANGE = `${WEIGHT_SHEET_NAME}!A1:Z1`;
const WEIGHT_DATA_RANGE = `${WEIGHT_SHEET_NAME}!A2:Z`;
const TARGET_DATA_RANGE = `${TARGET_SHEET_NAME}!B2:B8`;

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

class GoogleSheetsService {
  private gapiInited = false;
  private tokenClient: any = null;
  private gapiInitPromise: Promise<void> | null = null;
  private tokenClientReady: Promise<void> | null = null;
  private spreadsheetId: string = '';
  private syncStatus: SyncStatus = 'idle';
  private lastSyncTime: Date | null = null;
  private lastError: string | null = null;
  private statusListeners: ((status: SyncStatus) => void)[] = [];

  constructor() {
    this.spreadsheetId = import.meta.env.VITE_GOOGLE_SHEET_ID || '';
  }

  /**
   * Initialize the Google API client
   */
  async initClient(): Promise<void> {
    if (this.gapiInited) return;
    if (this.gapiInitPromise) return this.gapiInitPromise;

    this.gapiInitPromise = this.loadScript('https://apis.google.com/js/api.js').then(() => {
      return new Promise<void>((resolve, reject) => {
        (window as any).gapi.load('client', async () => {
          try {
            await (window as any).gapi.client.init({
              apiKey: import.meta.env.VITE_GOOGLE_API_KEY || '',
              discoveryDocs: DISCOVERY_DOCS,
            });
            this.gapiInited = true;
            await this.initTokenClient();
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      });
    });

    return this.gapiInitPromise;
  }

  private async ensureClientReady(): Promise<void> {
    if (!this.gapiInited) {
      await this.initClient();
    }
    if (!this.tokenClient) {
      await this.initTokenClient();
    }
  }

  /**
   * Initialize the Google Identity Services token client
   */
  private async initTokenClient(): Promise<void> {
    if (this.tokenClient) return;
    if (this.tokenClientReady) return this.tokenClientReady;

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new Error('Google Client ID not found in environment variables');
    }

    this.tokenClientReady = this.loadScript('https://accounts.google.com/gsi/client').then(() => {
      this.tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: '', // Will be set during login
      });
    });

    return this.tokenClientReady;
  }

  /**
   * Sign in to Google account
   */
  async signIn(): Promise<void> {
    await this.ensureClientReady();

    if (!this.tokenClient) {
      throw new Error('Google auth client not initialized');
    }

    return new Promise((resolve, reject) => {
      try {
        this.tokenClient.callback = async (response: any) => {
          if (response.error !== undefined) {
            reject(response);
          } else {
            (window as any).gapi.client.setToken({ access_token: response.access_token });
            resolve();
          }
        };

        if ((window as any).gapi.client.getToken() === null) {
          this.tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
          this.tokenClient.requestAccessToken({ prompt: '' });
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Sign out from Google account
   */
  signOut(): void {
    const token = (window as any).gapi.client.getToken();
    if (token !== null) {
      (window as any).google.accounts.oauth2.revoke(token.access_token);
      (window as any).gapi.client.setToken(null);
    }
  }

  /**
   * Check if user is signed in
   */
  isSignedIn(): boolean {
    const token = (window as any).gapi?.client?.getToken();
    return Boolean(token?.access_token);
  }

  /**
   * Set spreadsheet ID
   */
  setSpreadsheetId(id: string): void {
    this.spreadsheetId = id;
  }

  /**
   * Get current spreadsheet ID
   */
  getSpreadsheetId(): string {
    return this.spreadsheetId;
  }

  /**
   * Update sync status and notify listeners
   */
  private updateSyncStatus(status: SyncStatus): void {
    this.syncStatus = status;
    if (status === 'success') {
      this.lastSyncTime = new Date();
      this.lastError = null;
    }
    this.statusListeners.forEach(listener => listener(status));
  }

  private setLastError(message: string): void {
    this.lastError = message;
    this.updateSyncStatus('error');
  }

  /**
   * Subscribe to sync status changes
   */
  onStatusChange(listener: (status: SyncStatus) => void): () => void {
    this.statusListeners.push(listener);
    return () => {
      this.statusListeners = this.statusListeners.filter(l => l !== listener);
    };
  }

  /**
   * Get current sync status
   */
  getSyncStatus(): SyncStatus {
    return this.syncStatus;
  }

  /**
   * Get last sync time
   */
  getLastSyncTime(): Date | null {
    return this.lastSyncTime;
  }

  getLastError(): string | null {
    return this.lastError;
  }

  /**
   * Fetch weight data from Google Sheets
   */
  async fetchWeightData(): Promise<WeightEntry[]> {
    await this.ensureClientReady();
    if (!this.spreadsheetId) {
      throw new Error('Spreadsheet ID not configured');
    }

    this.updateSyncStatus('syncing');

    try {
      const [headerResponse, dataResponse] = await Promise.all([
        (window as any).gapi.client.sheets.spreadsheets.values.get({
          spreadsheetId: this.spreadsheetId,
          range: WEIGHT_HEADER_RANGE,
        }),
        (window as any).gapi.client.sheets.spreadsheets.values.get({
          spreadsheetId: this.spreadsheetId,
          range: WEIGHT_DATA_RANGE, // Skip header row
        }),
      ]);

      const headerRow = headerResponse.result.values?.[0] || [];
      const rows = dataResponse.result.values || [];
      const columnMap = this.resolveWeightColumnMap(headerRow);

      const entries = this.normalizeEntries(
        rows
          .map((row: any[]) => this.mapWeightRow(row, columnMap))
          .filter((entry): entry is WeightEntry => Boolean(entry))
      );

      this.updateSyncStatus('success');
      return entries;
    } catch (error) {
      console.error('Error fetching weight data:', error);
      const message = error instanceof Error ? error.message : 'Failed to fetch weight data from Google Sheets';
      this.setLastError(message);
      throw new Error(message);
    }
  }

  /**
   * Fetch target data from Google Sheets
   */
  async fetchTargetData(): Promise<TargetData> {
    await this.ensureClientReady();
    if (!this.spreadsheetId) {
      throw new Error('Spreadsheet ID not configured');
    }

    this.updateSyncStatus('syncing');

    try {
      const response = await (window as any).gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: TARGET_DATA_RANGE, // Value column only
      });

      const values = response.result.values || [];
      const targetData: TargetData = {
        startDate: this.normalizeDateValue(values[0]?.[0] || ''),
        startWeight: parseFloat(values[1]?.[0]) || 0,
        endDate: this.normalizeDateValue(values[2]?.[0] || ''),
        endWeight: parseFloat(values[3]?.[0]) || 0,
        totalDuration: parseInt(values[4]?.[0]) || 0,
        totalKg: Math.abs(parseFloat(values[5]?.[0]) || 0),
        height: parseFloat(values[6]?.[0]) || 0,
      };

      this.updateSyncStatus('success');
      return targetData;
    } catch (error) {
      console.error('Error fetching target data:', error);
      const message = error instanceof Error ? error.message : 'Failed to fetch target data from Google Sheets';
      this.setLastError(message);
      throw new Error(message);
    }
  }

  /**
   * Write weight entries to Google Sheets
   */
  async writeWeightData(entries: WeightEntry[]): Promise<void> {
    await this.ensureClientReady();
    if (!this.spreadsheetId) {
      throw new Error('Spreadsheet ID not configured');
    }

    this.updateSyncStatus('syncing');

    try {
      // Sort entries by date
      const sortedEntries = [...entries].sort((a, b) => {
        const aDate = parseDateFlexible(a.date) ?? new Date(a.date);
        const bDate = parseDateFlexible(b.date) ?? new Date(b.date);
        return aDate.getTime() - bDate.getTime();
      });

      // Convert to sheet format
      const rows = sortedEntries.map(entry => [
        entry.date,
        entry.weekDay,
        entry.weight,
        entry.changePercent,
        entry.changeKg,
        entry.dailyChange,
        entry.recordedAt || '',
      ]);

      // Clear existing data (except header)
      await (window as any).gapi.client.sheets.spreadsheets.values.clear({
        spreadsheetId: this.spreadsheetId,
        range: `${WEIGHT_SHEET_NAME}!A2:Z`,
      });

      // Write new data
      await (window as any).gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${WEIGHT_SHEET_NAME}!A2`,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: rows,
        },
      });

      this.updateSyncStatus('success');
    } catch (error) {
      console.error('Error writing weight data:', error);
      const message = error instanceof Error ? error.message : 'Failed to write weight data to Google Sheets';
      this.setLastError(message);
      throw new Error(message);
    }
  }

  /**
   * Add a single weight entry to Google Sheets
   */
  async addWeightEntry(entry: WeightEntry): Promise<void> {
    await this.ensureClientReady();
    if (!this.spreadsheetId) {
      throw new Error('Spreadsheet ID not configured');
    }

    this.updateSyncStatus('syncing');

    try {
      const row = [
        entry.date,
        entry.weekDay,
        entry.weight,
        entry.changePercent,
        entry.changeKg,
        entry.dailyChange,
        entry.recordedAt || '',
      ];

      await (window as any).gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${WEIGHT_SHEET_NAME}!A2`,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [row],
        },
      });

      this.updateSyncStatus('success');
    } catch (error) {
      console.error('Error adding weight entry:', error);
      const message = error instanceof Error ? error.message : 'Failed to add weight entry to Google Sheets';
      this.setLastError(message);
      throw new Error(message);
    }
  }

  /**
   * Update target data in Google Sheets
   */
  async writeTargetData(targetData: TargetData): Promise<void> {
    await this.ensureClientReady();
    if (!this.spreadsheetId) {
      throw new Error('Spreadsheet ID not configured');
    }

    this.updateSyncStatus('syncing');

    try {
      const values = [
        [targetData.startDate],
        [targetData.startWeight],
        [targetData.endDate],
        [targetData.endWeight],
        [targetData.totalDuration],
        [targetData.totalKg],
        [targetData.height],
      ];

      await (window as any).gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: TARGET_DATA_RANGE,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: values,
        },
      });

      this.updateSyncStatus('success');
    } catch (error) {
      console.error('Error writing target data:', error);
      const message = error instanceof Error ? error.message : 'Failed to write target data to Google Sheets';
      this.setLastError(message);
      throw new Error(message);
    }
  }

  /**
   * Full sync: Fetch all data from Google Sheets
   */
  async syncFromSheets(): Promise<{ entries: WeightEntry[]; targetData: TargetData; changed: boolean }> {
    const [entries, targetData] = await Promise.all([
      this.fetchWeightData(),
      this.fetchTargetData(),
    ]);

    const changed = this.updateLastSyncHash(entries, targetData);
    return { entries, targetData, changed };
  }

  /**
   * Full sync: Push all data to Google Sheets
   */
  async syncToSheets(entries: WeightEntry[], targetData: TargetData): Promise<void> {
    await Promise.all([
      this.writeWeightData(entries),
      this.writeTargetData(targetData),
    ]);
    this.updateLastSyncHash(entries, targetData);
  }

  private resolveWeightColumnMap(headerRow: string[]): Record<string, number> {
    if (!headerRow || headerRow.length === 0) {
      return {
        date: 0,
        weekDay: 1,
        weight: 2,
        changePercent: 3,
        changeKg: 4,
        dailyChange: 5,
        recordedAt: 6,
      };
    }

    const normalize = (value: string) =>
      value.toLowerCase().replace(/[\s_]/g, '').replace('%', 'percent');

    const aliases: Record<string, string[]> = {
      date: ['date'],
      weekDay: ['weekday', 'week day', 'day'],
      weight: ['weight'],
      changePercent: ['change%', 'change percent', 'changepercent'],
      changeKg: ['change kg', 'changekg'],
      dailyChange: ['daily change', 'dailychange'],
      recordedAt: ['recorded at', 'recordedat', 'recorded time', 'time', 'timestamp'],
    };

    const map: Record<string, number> = {
      date: 0,
      weekDay: 1,
      weight: 2,
      changePercent: 3,
      changeKg: 4,
      dailyChange: 5,
      recordedAt: 6,
    };

    const normalizedHeaders = headerRow.map((header) => normalize(header));
    const missingRequired = ['date', 'weight'].filter(
      required => !normalizedHeaders.includes(required)
    );
    if (missingRequired.length > 0) {
      throw new Error('Missing required columns in Weight Data sheet: Date, Weight');
    }

    headerRow.forEach((header, index) => {
      const normalized = normalize(header);
      Object.entries(aliases).forEach(([key, values]) => {
        if (values.some(value => normalize(value) === normalized)) {
          map[key] = index;
        }
      });
    });

    return map;
  }

  private mapWeightRow(row: any[], columnMap: Record<string, number>): WeightEntry | null {
    const rawDateValue = row[columnMap.date];
    const dateValue = this.normalizeDateValue(rawDateValue);
    const weightValue = row[columnMap.weight];
    if (!dateValue || weightValue === undefined || weightValue === null) return null;

    const weight = parseFloat(weightValue);
    if (Number.isNaN(weight)) return null;

    const recordedAtRaw = row[columnMap.recordedAt];
    let recordedAt = recordedAtRaw || undefined;
    if (recordedAtRaw && typeof recordedAtRaw === 'string' && !recordedAtRaw.includes('T')) {
      if (recordedAtRaw.includes(' ')) {
        const [rawDate, rawTime] = recordedAtRaw.split(' ');
        const normalizedDate = this.normalizeDateValue(rawDate);
        if (normalizedDate && rawTime) {
          recordedAt = `${normalizedDate}T${rawTime}`;
        }
      } else {
        recordedAt = `${dateValue}T${recordedAtRaw}`;
      }
    }

    return {
      date: dateValue,
      weekDay: row[columnMap.weekDay] || '',
      weight,
      changePercent: parseFloat(row[columnMap.changePercent]) || 0,
      changeKg: parseFloat(row[columnMap.changeKg]) || 0,
      dailyChange: parseFloat(row[columnMap.dailyChange]) || 0,
      recordedAt,
    };
  }

  private normalizeEntries(entries: WeightEntry[]): WeightEntry[] {
    if (entries.length === 0) return entries;

    const normalized = entries
      .map((entry) => {
        const isoDate = toISODate(entry.date);
        if (!isoDate) return null;
        return {
          ...entry,
          date: isoDate,
          recordedAt: normalizeRecordedAt(isoDate, entry.recordedAt),
        };
      })
      .filter((entry): entry is WeightEntry => Boolean(entry));

    const sorted = [...normalized].sort((a, b) => {
      const aDate = parseDateFlexible(a.date) ?? new Date(a.date);
      const bDate = parseDateFlexible(b.date) ?? new Date(b.date);
      return aDate.getTime() - bDate.getTime();
    });

    return sorted.map((entry, index) => {
      if (index === 0) {
        return { ...entry, changePercent: 0, changeKg: 0, dailyChange: 0 };
      }
      const prev = sorted[index - 1];
      const changeKg = entry.weight - prev.weight;
      const changePercent = (changeKg / prev.weight) * 100;
      const entryDate = parseDateFlexible(entry.date) ?? new Date(entry.date);
      const prevDate = parseDateFlexible(prev.date) ?? new Date(prev.date);
      const daysDiff = Math.max(
        1,
        Math.floor((entryDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))
      );
      const dailyChange = changeKg / daysDiff;
      return {
        ...entry,
        changePercent,
        changeKg,
        dailyChange,
      };
    });
  }

  private normalizeDateValue(value: string | number): string {
    if (!value) return '';
    if (typeof value === 'string' && value.includes('T')) {
      const parsed = parseISO(value.trim());
      return isValid(parsed) ? format(parsed, 'yyyy-MM-dd') : value;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      const base = trimmed.split(' ')[0];
      const formats = ['dd.MM.yyyy', 'dd-MM-yyyy', 'dd/MM/yyyy', 'd/M/yyyy', 'yyyy-MM-dd'];
      for (const fmt of formats) {
        const parsedText = parse(base, fmt, new Date());
        if (isValid(parsedText)) {
          return format(parsedText, 'yyyy-MM-dd');
        }
      }
    }
    const parsed = typeof value === 'number'
      ? new Date(Math.round((value - 25569) * 86400 * 1000))
      : new Date(value);
    if (isValid(parsed)) {
      return format(parsed, 'yyyy-MM-dd');
    }
    return String(value);
  }

  private updateLastSyncHash(entries: WeightEntry[] | null, targetData: TargetData | null): boolean {
    const payload = JSON.stringify({
      entries: entries ?? null,
      targetData: targetData ?? null,
    });
    const hash = this.simpleHash(payload);
    const lastHash = readString(STORAGE_KEYS.GOOGLE_SHEETS_SYNC_HASH);
    if (hash !== lastHash) {
      writeString(STORAGE_KEYS.GOOGLE_SHEETS_SYNC_HASH, hash);
      return true;
    }
    return false;
  }

  private simpleHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = (hash << 5) - hash + input.charCodeAt(i);
      hash |= 0;
    }
    return hash.toString();
  }

  private loadScript(src: string): Promise<void> {
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
    if (existing && existing.dataset.loaded === 'true') {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const script = existing || document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => {
        script.dataset.loaded = 'true';
        resolve();
      };
      script.onerror = reject;
      if (!existing) {
        document.body.appendChild(script);
      }
    });
  }
}

// Export singleton instance
export const googleSheetsService = new GoogleSheetsService();
