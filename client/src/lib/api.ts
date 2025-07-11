import { apiRequest } from "./queryClient";
import type { 
  Athlete, 
  InsertAthlete, 
  Category, 
  InsertCategory, 
  Match, 
  InsertMatch,
  DashboardStats,
  ActiveMatch,
  GoogleSheetsCompetition,
  GoogleSheetsAthlete
} from "@shared/schema";

export const api = {
  // Dashboard
  getDashboardStats: (): Promise<DashboardStats> =>
    fetch('/api/dashboard/stats').then(res => res.json()),
  
  getActiveMatches: (): Promise<ActiveMatch[]> =>
    fetch('/api/dashboard/active-matches').then(res => res.json()),

  // Athletes
  getAthletes: (): Promise<Athlete[]> =>
    fetch('/api/athletes').then(res => res.json()),
  
  syncAthletes: (competitionId?: string): Promise<{ success: boolean; count: number; athletes: Athlete[] }> =>
    fetch(`/api/athletes/sync${competitionId ? `?competitionId=${competitionId}` : ''}`).then(res => res.json()),
  
  createAthlete: (athlete: InsertAthlete): Promise<Athlete> =>
    apiRequest('POST', '/api/athletes', athlete).then(res => res.json()),
  
  updateAthleteAttendance: (id: number, isPresent: boolean): Promise<Athlete> =>
    apiRequest('PATCH', `/api/athletes/${id}/attendance`, { isPresent }).then(res => res.json()),
  
  updateAthleteStatus: (id: number, status: string, ring?: string): Promise<Athlete> =>
    apiRequest('PATCH', `/api/athletes/${id}/status`, { status, ring }).then(res => res.json()),

  // Categories
  getCategories: (): Promise<Category[]> =>
    fetch('/api/categories').then(res => res.json()),
  
  createCategory: (category: InsertCategory): Promise<Category> =>
    apiRequest('POST', '/api/categories', category).then(res => res.json()),
  
  getCategoryGroups: (categoryId: number) =>
    fetch(`/api/categories/${categoryId}/groups`).then(res => res.json()),

  // Matches
  getMatches: (): Promise<Match[]> =>
    fetch('/api/matches').then(res => res.json()),
  
  createMatch: (match: InsertMatch): Promise<Match> =>
    apiRequest('POST', '/api/matches', match).then(res => res.json()),
  
  declareWinner: (matchId: number, winnerId: number): Promise<Match> =>
    apiRequest('PATCH', `/api/matches/${matchId}/winner`, { winnerId }).then(res => res.json()),

  // Anti-clash
  getCompetingAthletes: (): Promise<Athlete[]> =>
    fetch('/api/anti-clash/competing').then(res => res.json()),
  
  getAvailableAthletes: (): Promise<Athlete[]> =>
    fetch('/api/anti-clash/available').then(res => res.json()),

  // Export
  exportAthletes: (format: 'excel' | 'pdf') =>
    fetch(`/api/export/athletes?format=${format}`).then(res => res.json()),
  
  exportResults: (format: 'excel' | 'pdf') =>
    fetch(`/api/export/results?format=${format}`).then(res => res.json()),

  // Google Sheets integration dengan optimasi
  getCompetitionsFromGoogleSheets: (): Promise<GoogleSheetsCompetition[]> =>
    fetch('/api/google-sheets/competitions', {
      headers: { 'Cache-Control': 'no-cache' }
    }).then(res => res.json()),

  getAthletesFromCompetition: (competitionId: string): Promise<GoogleSheetsAthlete[]> =>
    fetch(`/api/google-sheets/athletes/${competitionId}`, {
      headers: { 'Cache-Control': 'no-cache' }
    }).then(res => res.json()),

  transferAthletesToManagement: (athletes: GoogleSheetsAthlete[]): Promise<{ count: number }> =>
    apiRequest('POST', '/api/google-sheets/transfer-athletes', { athletes }).then(res => res.json()),

  // Real-time data API
  getRealTimeAthletes: (): Promise<{ timestamp: number; athletes: any[] }> =>
    fetch('/api/realtime/athletes').then(res => res.json()),

  // Cache management
  clearDataCache: (): Promise<{ message: string }> =>
    apiRequest('POST', '/api/cache/clear', {}).then(res => res.json()),

  // Health check
  getHealthStatus: (): Promise<{ status: string; connections: number; cacheSize: number }> =>
    fetch('/api/health').then(res => res.json()),

  // Google Sheets sync (legacy)
  syncToGoogleSheets: (data: any, action: string) =>
    apiRequest('POST', '/api/sheets/sync', { data, action }).then(res => res.json())
};
