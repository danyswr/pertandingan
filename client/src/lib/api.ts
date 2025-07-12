import { apiRequest } from "./queryClient";
import type { 
  Athlete, 
  InsertAthlete, 
  Category, 
  InsertCategory, 
  Match, 
  InsertMatch,
  MainCategory,
  InsertMainCategory,
  SubCategory,
  InsertSubCategory,
  AthleteGroup,
  InsertAthleteGroup,
  GroupAthlete,
  InsertGroupAthlete,
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
  
  getAllAthletes: (): Promise<Athlete[]> =>
    fetch('/api/athletes').then(res => res.json()),
  
  syncAthletes: (competitionId?: string): Promise<{ success: boolean; count: number; athletes: Athlete[] }> =>
    fetch(`/api/athletes/sync${competitionId ? `?competitionId=${competitionId}` : ''}`).then(res => res.json()),
  
  createAthlete: (athlete: InsertAthlete): Promise<Athlete> =>
    apiRequest('POST', '/api/athletes', athlete).then(res => res.json()),
  
  updateAthleteAttendance: (id: number, isPresent: boolean): Promise<Athlete> =>
    apiRequest('PATCH', `/api/athletes/${id}/attendance`, { isPresent }).then(res => res.json()),
  
  updateAthleteStatus: (id: number, status: string, ring?: string): Promise<Athlete> =>
    apiRequest('PATCH', `/api/athletes/${id}/status`, { status, ring }).then(res => res.json()),

  updateAthlete: (id: number, athlete: Partial<InsertAthlete>): Promise<Athlete> =>
    apiRequest('PUT', `/api/athletes/${id}`, athlete).then(res => res.json()),

  deleteAthlete: (id: number): Promise<void> =>
    apiRequest('DELETE', `/api/athletes/${id}`).then(res => res.json()),

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

  transferAthletesToManagement: (data: { athletes: GoogleSheetsAthlete[] }): Promise<{ count: number }> =>
    apiRequest('POST', '/api/google-sheets/transfer-athletes', data).then(res => res.json()),

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
    apiRequest('POST', '/api/sheets/sync', { data, action }).then(res => res.json()),

  // Tournament Bracket API
  // Main Categories (Kategori_utama)
  getMainCategories: (): Promise<MainCategory[]> =>
    fetch('/api/tournament/main-categories').then(res => res.json()),
  
  createMainCategory: (category: InsertMainCategory): Promise<MainCategory> =>
    apiRequest('POST', '/api/tournament/main-categories', category).then(res => res.json()),
  
  updateMainCategory: (id: number, category: Partial<InsertMainCategory>): Promise<MainCategory> =>
    apiRequest('PUT', `/api/tournament/main-categories/${id}`, category).then(res => res.json()),
  
  deleteMainCategory: (id: number): Promise<{ success: boolean }> =>
    apiRequest('DELETE', `/api/tournament/main-categories/${id}`).then(res => res.json()),

  // Sub Categories (SubKategori)
  getSubCategories: (mainCategoryId: number): Promise<SubCategory[]> =>
    fetch(`/api/tournament/main-categories/${mainCategoryId}/sub-categories`).then(res => res.json()),
  
  createSubCategory: (subCategory: InsertSubCategory): Promise<SubCategory> =>
    apiRequest('POST', '/api/tournament/sub-categories', subCategory).then(res => res.json()),
  
  updateSubCategory: (id: number, subCategory: Partial<InsertSubCategory>): Promise<SubCategory> =>
    apiRequest('PUT', `/api/tournament/sub-categories/${id}`, subCategory).then(res => res.json()),
  
  deleteSubCategory: (id: number): Promise<{ success: boolean }> =>
    apiRequest('DELETE', `/api/tournament/sub-categories/${id}`).then(res => res.json()),

  // Athlete Groups (Kelompok_Atlet)
  getAthleteGroups: (subCategoryId: number): Promise<AthleteGroup[]> =>
    fetch(`/api/tournament/sub-categories/${subCategoryId}/athlete-groups`).then(res => res.json()),
  
  createAthleteGroup: (athleteGroup: InsertAthleteGroup): Promise<AthleteGroup> =>
    apiRequest('POST', '/api/tournament/athlete-groups', athleteGroup).then(res => res.json()),
  
  updateAthleteGroup: (id: number, athleteGroup: Partial<InsertAthleteGroup>): Promise<AthleteGroup> =>
    apiRequest('PUT', `/api/tournament/athlete-groups/${id}`, athleteGroup).then(res => res.json()),
  
  deleteAthleteGroup: (id: number): Promise<{ success: boolean }> =>
    apiRequest('DELETE', `/api/tournament/athlete-groups/${id}`).then(res => res.json()),

  // Group Athletes (daftar_kelompok)
  getGroupAthletes: (groupId: number): Promise<GroupAthlete[]> =>
    fetch(`/api/tournament/athlete-groups/${groupId}/athletes`).then(res => res.json()),
  
  addAthleteToGroup: (groupId: number, athleteData: Omit<InsertGroupAthlete, 'groupId'>): Promise<GroupAthlete> =>
    apiRequest('POST', `/api/tournament/athlete-groups/${groupId}/athletes`, athleteData).then(res => res.json()),
  
  removeAthleteFromGroup: (groupId: number, athleteId: number): Promise<{ success: boolean }> =>
    apiRequest('DELETE', `/api/tournament/athlete-groups/${groupId}/athletes/${athleteId}`).then(res => res.json()),
  
  updateAthletePosition: (groupId: number, athleteId: number, position: string, queueOrder?: number): Promise<GroupAthlete> =>
    apiRequest('PATCH', `/api/tournament/athlete-groups/${groupId}/athletes/${athleteId}/position`, { position, queueOrder }).then(res => res.json()),
  
  eliminateAthlete: (groupId: number, athleteId: number): Promise<GroupAthlete> =>
    apiRequest('PATCH', `/api/tournament/athlete-groups/${groupId}/athletes/${athleteId}/eliminate`).then(res => res.json())
};
