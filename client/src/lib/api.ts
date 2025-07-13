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
  GoogleSheetsAthlete,
} from "@shared/schema";

// Enhanced API Response types
interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  timestamp?: string;
  error?: string;
  version?: string;
}

interface SyncResponse {
  success: boolean;
  count: number;
  athletes?: Athlete[];
  results?: any;
  message?: string;
  errors?: string[];
}

interface HealthResponse {
  status: string;
  timestamp: string;
  connections: number;
  cacheSize: number;
  uptime: number;
  version: string;
}

interface SearchResponse {
  success: boolean;
  query: string;
  filters: Record<string, any>;
  results: Athlete[];
  count: number;
}

interface BatchResponse<T> {
  success: boolean;
  created: number;
  errors: number;
  results: T[];
  errorDetails: any[];
}

// Enhanced API client with comprehensive error handling and response processing
class TournamentAPI {
  private baseUrl: string;
  private defaultHeaders: HeadersInit;
  private requestTimeout: number = 15000; // 15 seconds

  constructor(baseUrl: string = "") {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  // Enhanced fetch wrapper with comprehensive error handling
  private async fetchWithErrorHandling<T>(
    url: string,
    options: RequestInit = {},
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

    try {
      const response = await fetch(`${this.baseUrl}${url}`, {
        ...options,
        headers: {
          ...this.defaultHeaders,
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorJson.message || errorMessage;
        } catch {
          // If not JSON, use the text as error message
          errorMessage = errorText || errorMessage;
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === "AbortError") {
        throw new Error("Request timeout - please try again");
      }

      console.error(`API Error for ${url}:`, error);
      throw error;
    }
  }

  // Enhanced API request wrapper with retry logic
  private async apiRequestEnhanced<T>(
    method: string,
    url: string,
    data?: any,
    retries: number = 1,
  ): Promise<T> {
    const options: RequestInit = {
      method,
      headers: this.defaultHeaders,
    };

    if (data && (method === "POST" || method === "PUT" || method === "PATCH")) {
      options.body = JSON.stringify(data);
    }

    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this.fetchWithErrorHandling<T>(url, options);
      } catch (error) {
        lastError = error as Error;

        if (attempt < retries) {
          // Wait before retry (exponential backoff)
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
          console.log(
            `Retrying request to ${url} (attempt ${attempt + 2}/${retries + 1})`,
          );
        }
      }
    }

    throw lastError!;
  }

  // Dashboard APIs
  getDashboardStats = (): Promise<DashboardStats> =>
    this.fetchWithErrorHandling<DashboardStats>("/api/dashboard/stats");

  getActiveMatches = (): Promise<ActiveMatch[]> =>
    this.fetchWithErrorHandling<ActiveMatch[]>("/api/dashboard/active-matches");

  // Enhanced Athletes APIs
  getAthletes = (): Promise<Athlete[]> =>
    this.fetchWithErrorHandling<Athlete[]>("/api/athletes");

  getAllAthletes = (): Promise<Athlete[]> =>
    this.fetchWithErrorHandling<Athlete[]>("/api/athletes");

  getAthlete = (id: number): Promise<Athlete> =>
    this.fetchWithErrorHandling<Athlete>(`/api/athletes/${id}`);

  syncAthletes = (competitionId?: string): Promise<SyncResponse> =>
    this.fetchWithErrorHandling<SyncResponse>(
      `/api/athletes/sync${competitionId ? `?competitionId=${competitionId}` : ""}`,
    );

  createAthlete = (athlete: InsertAthlete): Promise<Athlete> =>
    this.apiRequestEnhanced<Athlete>("POST", "/api/athletes", athlete);

  updateAthlete = (
    id: number,
    athlete: Partial<InsertAthlete>,
  ): Promise<Athlete> =>
    this.apiRequestEnhanced<Athlete>("PUT", `/api/athletes/${id}`, athlete);

  updateAthleteAttendance = (
    id: number,
    isPresent: boolean,
  ): Promise<Athlete> =>
    this.apiRequestEnhanced<Athlete>(
      "PATCH",
      `/api/athletes/${id}/attendance`,
      { isPresent },
    );

  updateAthleteStatus = (
    id: number,
    status: string,
    ring?: string,
  ): Promise<Athlete> =>
    this.apiRequestEnhanced<Athlete>("PATCH", `/api/athletes/${id}/status`, {
      status,
      ring,
    });

  deleteAthlete = (id: number): Promise<{ success: boolean }> =>
    this.apiRequestEnhanced<{ success: boolean }>(
      "DELETE",
      `/api/athletes/${id}`,
    );

  // Enhanced batch operations for athletes
  batchCreateAthletes = (
    athletes: InsertAthlete[],
  ): Promise<BatchResponse<Athlete>> =>
    this.apiRequestEnhanced<BatchResponse<Athlete>>(
      "POST",
      "/api/athletes/batch",
      {
        athletes,
      },
    );

  batchUpdateAthletes = (
    updates: Array<{ id: number; data: Partial<InsertAthlete> }>,
  ): Promise<BatchResponse<Athlete>> =>
    this.apiRequestEnhanced<BatchResponse<Athlete>>(
      "POST",
      "/api/athletes/batch-update",
      {
        updates,
      },
    );

  batchUpdateAttendance = (
    updates: Array<{ id: number; isPresent: boolean }>,
  ): Promise<BatchResponse<Athlete>> =>
    this.apiRequestEnhanced<BatchResponse<Athlete>>(
      "POST",
      "/api/athletes/batch-attendance",
      { updates },
    );

  // Enhanced search functionality
  searchAthletes = (
    query: string,
    filters?: {
      dojang?: string;
      belt?: string;
      category?: string;
      status?: string;
      gender?: string;
    },
  ): Promise<SearchResponse> => {
    const params = new URLSearchParams({ query });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    return this.fetchWithErrorHandling<SearchResponse>(
      `/api/athletes/search?${params.toString()}`,
    );
  };

  getAthletesByCategory = (category: string): Promise<Athlete[]> =>
    this.fetchWithErrorHandling<Athlete[]>(
      `/api/athletes/by-category/${encodeURIComponent(category)}`,
    );

  getAthletesByDojang = (dojang: string): Promise<Athlete[]> =>
    this.fetchWithErrorHandling<Athlete[]>(
      `/api/athletes/by-dojang/${encodeURIComponent(dojang)}`,
    );

  // Categories APIs
  getCategories = (): Promise<Category[]> =>
    this.fetchWithErrorHandling<Category[]>("/api/categories");

  createCategory = (category: InsertCategory): Promise<Category> =>
    this.apiRequestEnhanced<Category>("POST", "/api/categories", category);

  updateCategory = (
    id: number,
    category: Partial<InsertCategory>,
  ): Promise<Category> =>
    this.apiRequestEnhanced<Category>("PUT", `/api/categories/${id}`, category);

  deleteCategory = (id: number): Promise<{ success: boolean }> =>
    this.apiRequestEnhanced<{ success: boolean }>(
      "DELETE",
      `/api/categories/${id}`,
    );

  getCategoryGroups = (categoryId: number): Promise<any[]> =>
    this.fetchWithErrorHandling<any[]>(`/api/categories/${categoryId}/groups`);

  // Tournament Bracket APIs
  // Main Categories (Kategori_utama)
  getMainCategories = (): Promise<MainCategory[]> =>
    this.fetchWithErrorHandling<MainCategory[]>(
      "/api/tournament/main-categories",
    );

  createMainCategory = (category: InsertMainCategory): Promise<MainCategory> =>
    this.apiRequestEnhanced<MainCategory>(
      "POST",
      "/api/tournament/main-categories",
      category,
    );

  updateMainCategory = (
    id: number,
    category: Partial<InsertMainCategory>,
  ): Promise<MainCategory> =>
    this.apiRequestEnhanced<MainCategory>(
      "PUT",
      `/api/tournament/main-categories/${id}`,
      category,
    );

  deleteMainCategory = (id: number): Promise<{ success: boolean }> =>
    this.apiRequestEnhanced<{ success: boolean }>(
      "DELETE",
      `/api/tournament/main-categories/${id}`,
    );

  // Sub Categories (SubKategori)
  getSubCategories = (mainCategoryId: number): Promise<SubCategory[]> =>
    this.fetchWithErrorHandling<SubCategory[]>(
      `/api/tournament/main-categories/${mainCategoryId}/sub-categories`,
    );

  createSubCategory = (subCategory: InsertSubCategory): Promise<SubCategory> =>
    this.apiRequestEnhanced<SubCategory>(
      "POST",
      "/api/tournament/sub-categories",
      subCategory,
    );

  updateSubCategory = (
    id: number,
    subCategory: Partial<InsertSubCategory>,
  ): Promise<SubCategory> =>
    this.apiRequestEnhanced<SubCategory>(
      "PUT",
      `/api/tournament/sub-categories/${id}`,
      subCategory,
    );

  deleteSubCategory = (id: number): Promise<{ success: boolean }> =>
    this.apiRequestEnhanced<{ success: boolean }>(
      "DELETE",
      `/api/tournament/sub-categories/${id}`,
    );

  // Athlete Groups (Kelompok_Atlet)
  getAthleteGroups = (subCategoryId: number): Promise<AthleteGroup[]> =>
    this.fetchWithErrorHandling<AthleteGroup[]>(
      `/api/tournament/sub-categories/${subCategoryId}/athlete-groups`,
    );

  createAthleteGroup = (
    athleteGroup: InsertAthleteGroup,
  ): Promise<AthleteGroup> =>
    this.apiRequestEnhanced<AthleteGroup>(
      "POST",
      "/api/tournament/athlete-groups",
      athleteGroup,
    );

  updateAthleteGroup = (
    id: number,
    athleteGroup: Partial<InsertAthleteGroup>,
  ): Promise<AthleteGroup> =>
    this.apiRequestEnhanced<AthleteGroup>(
      "PUT",
      `/api/tournament/athlete-groups/${id}`,
      athleteGroup,
    );

  deleteAthleteGroup = (id: number): Promise<{ success: boolean }> =>
    this.apiRequestEnhanced<{ success: boolean }>(
      "DELETE",
      `/api/tournament/athlete-groups/${id}`,
    );

  // Group Athletes (daftar_kelompok)
  getGroupAthletes = (groupId: number): Promise<GroupAthlete[]> =>
    this.fetchWithErrorHandling<GroupAthlete[]>(
      `/api/tournament/athlete-groups/${groupId}/athletes`,
    );

  addAthleteToGroup = (
    groupAthlete: InsertGroupAthlete,
  ): Promise<GroupAthlete> =>
    this.apiRequestEnhanced<GroupAthlete>(
      "POST",
      `/api/tournament/athlete-groups/${groupAthlete.groupId}/athletes`,
      groupAthlete,
    );

  removeAthleteFromGroup = (
    groupId: number,
    athleteId: number,
  ): Promise<{ success: boolean }> =>
    this.apiRequestEnhanced<{ success: boolean }>(
      "DELETE",
      `/api/tournament/athlete-groups/${groupId}/athletes/${athleteId}`,
    );

  updateAthletePosition = (
    groupId: number,
    athleteId: number,
    position: string,
    queueOrder?: number,
  ): Promise<GroupAthlete> =>
    this.apiRequestEnhanced<GroupAthlete>(
      "PATCH",
      `/api/tournament/athlete-groups/${groupId}/athletes/${athleteId}/position`,
      { position, queueOrder },
    );

  eliminateAthlete = (
    groupId: number,
    athleteId: number,
  ): Promise<GroupAthlete> =>
    this.apiRequestEnhanced<GroupAthlete>(
      "PATCH",
      `/api/tournament/athlete-groups/${groupId}/athletes/${athleteId}/eliminate`,
    );

  updateAthleteMedal = (
    groupId: number,
    athleteId: number,
    hasMedal: boolean,
  ): Promise<GroupAthlete> =>
    this.apiRequestEnhanced<GroupAthlete>(
      "PATCH",
      `/api/tournament/athlete-groups/${groupId}/athletes/${athleteId}/medal`,
      { hasMedal },
    );

  // Enhanced batch operations for group athletes
  batchAddAthletesToGroup = (
    groupId: number,
    athletes: InsertGroupAthlete[],
  ): Promise<BatchResponse<GroupAthlete>> =>
    this.apiRequestEnhanced<BatchResponse<GroupAthlete>>(
      "POST",
      `/api/tournament/athlete-groups/${groupId}/athletes/batch`,
      { athletes },
    );

  batchUpdateAthletePositions = (
    updates: Array<{
      groupId: number;
      athleteId: number;
      position: string;
      queueOrder?: number;
    }>,
  ): Promise<BatchResponse<GroupAthlete>> =>
    this.apiRequestEnhanced<BatchResponse<GroupAthlete>>(
      "POST",
      "/api/tournament/batch-update-positions",
      { updates },
    );

  // Matches APIs
  getMatches = (): Promise<Match[]> =>
    this.fetchWithErrorHandling<Match[]>("/api/matches");

  getMatch = (id: number): Promise<Match> =>
    this.fetchWithErrorHandling<Match>(`/api/matches/${id}`);

  createMatch = (match: InsertMatch): Promise<Match> =>
    this.apiRequestEnhanced<Match>("POST", "/api/matches", match);

  updateMatch = (id: number, match: Partial<InsertMatch>): Promise<Match> =>
    this.apiRequestEnhanced<Match>("PUT", `/api/matches/${id}`, match);

  deleteMatch = (id: number): Promise<{ success: boolean }> =>
    this.apiRequestEnhanced<{ success: boolean }>(
      "DELETE",
      `/api/matches/${id}`,
    );

  declareWinner = (matchId: number, winnerId: number): Promise<Match> =>
    this.apiRequestEnhanced<Match>("PATCH", `/api/matches/${matchId}/winner`, {
      winnerId,
    });

  // Anti-clash APIs
  getCompetingAthletes = (): Promise<Athlete[]> =>
    this.fetchWithErrorHandling<Athlete[]>("/api/anti-clash/competing");

  getAvailableAthletes = (): Promise<Athlete[]> =>
    this.fetchWithErrorHandling<Athlete[]>("/api/anti-clash/available");

  // Results APIs
  getTournamentResults = (): Promise<any[]> =>
    this.fetchWithErrorHandling<any[]>("/api/results");

  // Export APIs
  exportAthletes = (format: "excel" | "pdf" | "csv" = "csv"): Promise<any> =>
    this.fetchWithErrorHandling<any>(`/api/export/athletes?format=${format}`);

  exportResults = (format: "excel" | "pdf" | "csv" = "csv"): Promise<any> =>
    this.fetchWithErrorHandling<any>(`/api/export/results?format=${format}`);

  exportTournamentData = (
    format: "excel" | "pdf" | "csv" = "csv",
  ): Promise<any> =>
    this.fetchWithErrorHandling<any>(`/api/export/tournament?format=${format}`);

  // Google Sheets Integration APIs
  getCompetitionsFromGoogleSheets = (): Promise<GoogleSheetsCompetition[]> =>
    this.fetchWithErrorHandling<GoogleSheetsCompetition[]>(
      "/api/google-sheets/competitions",
      {
        headers: { "Cache-Control": "no-cache" },
      },
    );

  getAthletesFromCompetition = (
    competitionId: string,
  ): Promise<GoogleSheetsAthlete[]> =>
    this.fetchWithErrorHandling<GoogleSheetsAthlete[]>(
      `/api/google-sheets/athletes/${competitionId}`,
      {
        headers: { "Cache-Control": "no-cache" },
      },
    );

  transferAthletesToManagement = (data: {
    athletes: GoogleSheetsAthlete[];
  }): Promise<{ count: number; message: string }> =>
    this.apiRequestEnhanced<{ count: number; message: string }>(
      "POST",
      "/api/google-sheets/transfer-athletes",
      data,
    );

  // Enhanced Synchronization APIs
  syncToGoogleSheets = (data: any, action: string): Promise<ApiResponse> =>
    this.apiRequestEnhanced<ApiResponse>("POST", "/api/sheets/sync", {
      data,
      action,
    });

  syncAllData = (): Promise<SyncResponse> =>
    this.apiRequestEnhanced<SyncResponse>("POST", "/api/sync/all");

  syncAthleteData = (): Promise<SyncResponse> =>
    this.apiRequestEnhanced<SyncResponse>("POST", "/api/sync/athletes");

  syncTournamentStructure = (): Promise<SyncResponse> =>
    this.apiRequestEnhanced<SyncResponse>(
      "POST",
      "/api/sync/tournament-structure",
    );

  // Real-time data APIs
  getRealTimeAthletes = (): Promise<{
    timestamp: number;
    athletes: Athlete[];
  }> =>
    this.fetchWithErrorHandling<{ timestamp: number; athletes: Athlete[] }>(
      "/api/realtime/athletes",
    );

  getRealTimeMatches = (): Promise<{ timestamp: number; matches: Match[] }> =>
    this.fetchWithErrorHandling<{ timestamp: number; matches: Match[] }>(
      "/api/realtime/matches",
    );

  getRealTimeTournamentState = (): Promise<{ timestamp: number; state: any }> =>
    this.fetchWithErrorHandling<{ timestamp: number; state: any }>(
      "/api/realtime/tournament-state",
    );

  // Cache management APIs
  clearDataCache = (): Promise<{ message: string; timestamp: string }> =>
    this.apiRequestEnhanced<{ message: string; timestamp: string }>(
      "POST",
      "/api/cache/clear",
    );

  clearSpecificCache = (
    pattern: string,
  ): Promise<{ message: string; cleared: number }> =>
    this.apiRequestEnhanced<{ message: string; cleared: number }>(
      "POST",
      "/api/cache/clear-pattern",
      { pattern },
    );

  getCacheStats = (): Promise<{
    size: number;
    keys: string[];
    hitRate: number;
  }> =>
    this.fetchWithErrorHandling<{
      size: number;
      keys: string[];
      hitRate: number;
    }>("/api/cache/stats");

  // System health and monitoring APIs
  getHealthStatus = (): Promise<HealthResponse> =>
    this.fetchWithErrorHandling<HealthResponse>("/api/health");

  getSystemStats = (): Promise<{
    uptime: number;
    memory: any;
    connections: number;
    cacheSize: number;
    apiCalls: number;
  }> => this.fetchWithErrorHandling("/api/system/stats");

  // Enhanced connection testing
  testConnection = (): Promise<{
    success: boolean;
    latency: number;
    version: string;
  }> => {
    const startTime = Date.now();
    return this.fetchWithErrorHandling<HealthResponse>("/api/health")
      .then((response) => ({
        success: true,
        latency: Date.now() - startTime,
        version: response.version || "unknown",
      }))
      .catch((error) => ({
        success: false,
        latency: Date.now() - startTime,
        version: "unknown",
        error: error.message,
      }));
  };

  // Configuration methods
  setTimeout = (timeout: number): void => {
    this.requestTimeout = timeout;
  };

  setBaseUrl = (baseUrl: string): void => {
    this.baseUrl = baseUrl;
  };
}

// Create and export the API instance
export const api = new TournamentAPI();

// Export individual API functions for backward compatibility
export const {
  // Dashboard
  getDashboardStats,
  getActiveMatches,

  // Athletes
  getAthletes,
  getAllAthletes,
  getAthlete,
  syncAthletes,
  createAthlete,
  updateAthlete,
  updateAthleteAttendance,
  updateAthleteStatus,
  deleteAthlete,
  batchCreateAthletes,
  batchUpdateAthletes,
  batchUpdateAttendance,

  // Search
  searchAthletes,
  getAthletesByCategory,
  getAthletesByDojang,

  // Categories
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryGroups,

  // Tournament Structure
  getMainCategories,
  createMainCategory,
  updateMainCategory,
  deleteMainCategory,
  getSubCategories,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
  getAthleteGroups,
  createAthleteGroup,
  updateAthleteGroup,
  deleteAthleteGroup,

  // Group Athletes
  getGroupAthletes,
  addAthleteToGroup,
  removeAthleteFromGroup,
  updateAthletePosition,
  eliminateAthlete,
  updateAthleteMedal,
  batchAddAthletesToGroup,
  batchUpdateAthletePositions,

  // Matches
  getMatches,
  getMatch,
  createMatch,
  updateMatch,
  deleteMatch,
  declareWinner,

  // Anti-clash
  getCompetingAthletes,
  getAvailableAthletes,

  // Results
  getTournamentResults,

  // Export
  exportAthletes,
  exportResults,
  exportTournamentData,

  // Google Sheets
  getCompetitionsFromGoogleSheets,
  getAthletesFromCompetition,
  transferAthletesToManagement,

  // Sync
  syncToGoogleSheets,
  syncAllData,
  syncAthleteData,
  syncTournamentStructure,

  // Real-time
  getRealTimeAthletes,
  getRealTimeMatches,
  getRealTimeTournamentState,

  // Cache
  clearDataCache,
  clearSpecificCache,
  getCacheStats,

  // Health
  getHealthStatus,
  getSystemStats,
  testConnection,
} = api;

// Export types for external use
export type {
  ApiResponse,
  SyncResponse,
  HealthResponse,
  SearchResponse,
  BatchResponse,
};
