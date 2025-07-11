import { apiRequest } from "./queryClient";
import type { 
  Athlete, 
  InsertAthlete, 
  Category, 
  InsertCategory, 
  Match, 
  InsertMatch,
  DashboardStats,
  ActiveMatch
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

  // Google Sheets sync
  syncToGoogleSheets: (data: any, action: string) =>
    apiRequest('POST', '/api/sheets/sync', { data, action }).then(res => res.json())
};
