import { describe, it, expect, vi, beforeEach } from 'vitest';
import { googleSheetsService } from '../GoogleSheetsService';

describe('GoogleSheetsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (window as any).gapi = undefined;
  });

  it('should report signed out when no token exists', () => {
    (window as any).gapi = { client: { getToken: () => null } };
    expect(googleSheetsService.isSignedIn()).toBe(false);
  });

  it('should report signed in when token exists', () => {
    (window as any).gapi = { client: { getToken: () => ({ access_token: 'token' }) } };
    expect(googleSheetsService.isSignedIn()).toBe(true);
  });
});
