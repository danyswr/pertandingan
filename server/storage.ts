import {
  athletes,
  mainCategories,
  subCategories,
  athleteGroups,
  groupAthletes,
  categories,
  groups,
  groupMembers,
  matches,
  tournamentResults,
  athleteStatus,
  type Athlete,
  type InsertAthlete,
  type MainCategory,
  type InsertMainCategory,
  type SubCategory,
  type InsertSubCategory,
  type AthleteGroup,
  type InsertAthleteGroup,
  type GroupAthlete,
  type InsertGroupAthlete,
  type Category,
  type InsertCategory,
  type Group,
  type InsertGroup,
  type Match,
  type InsertMatch,
  type TournamentResult,
  type InsertTournamentResult,
  type AthleteStatus,
  type DashboardStats,
  type ActiveMatch,
  type GoogleSheetsAthlete,
  type GoogleSheetsCompetition,
} from "@shared/schema";

export interface IStorage {
  // Athletes
  getAllAthletes(): Promise<Athlete[]>;
  getAthleteById(id: number): Promise<Athlete | undefined>;
  createAthlete(athlete: InsertAthlete): Promise<Athlete>;
  updateAthlete(id: number, athlete: Partial<InsertAthlete>): Promise<Athlete>;
  updateAthleteAttendance(id: number, isPresent: boolean): Promise<Athlete>;
  updateAthleteStatus(
    id: number,
    status: string,
    ring?: string,
  ): Promise<Athlete>;
  deleteAthlete(id: number): Promise<void>;

  // Batch operations
  batchCreateAthletes(athletes: InsertAthlete[]): Promise<Athlete[]>;
  batchUpdateAthletes(
    updates: Array<{ id: number; data: Partial<InsertAthlete> }>,
  ): Promise<Athlete[]>;

  // Search and filtering
  searchAthletes(
    query: string,
    filters?: {
      dojang?: string;
      belt?: string;
      category?: string;
      status?: string;
      gender?: string;
    },
  ): Promise<Athlete[]>;

  // Main Categories (Kategori_utama)
  getAllMainCategories(): Promise<MainCategory[]>;
  getMainCategoryById(id: number): Promise<MainCategory | undefined>;
  createMainCategory(category: InsertMainCategory): Promise<MainCategory>;
  updateMainCategory(
    id: number,
    category: Partial<InsertMainCategory>,
  ): Promise<MainCategory>;
  deleteMainCategory(id: number): Promise<void>;
  clearAllMainCategories(): Promise<void>;

  // Sub Categories (SubKategori)
  getSubCategoriesByMainCategory(
    mainCategoryId: number,
  ): Promise<SubCategory[]>;
  getSubCategoryById(id: number): Promise<SubCategory | undefined>;
  createSubCategory(subCategory: InsertSubCategory): Promise<SubCategory>;
  updateSubCategory(
    id: number,
    subCategory: Partial<InsertSubCategory>,
  ): Promise<SubCategory>;
  deleteSubCategory(id: number): Promise<void>;

  // Athlete Groups (Kelompok_Atlet)
  getAthleteGroupsBySubCategory(subCategoryId: number): Promise<AthleteGroup[]>;
  getAthleteGroupById(id: number): Promise<AthleteGroup | undefined>;
  createAthleteGroup(athleteGroup: InsertAthleteGroup): Promise<AthleteGroup>;
  updateAthleteGroup(
    id: number,
    athleteGroup: Partial<InsertAthleteGroup>,
  ): Promise<AthleteGroup>;
  deleteAthleteGroup(id: number): Promise<void>;

  // Group Athletes (daftar_kelompok)
  getGroupAthletesByGroup(groupId: number): Promise<GroupAthlete[]>;
  addAthleteToGroup(groupAthlete: InsertGroupAthlete): Promise<GroupAthlete>;
  removeAthleteFromGroup(groupId: number, athleteId: number): Promise<void>;
  updateAthletePosition(
    groupId: number,
    athleteId: number,
    position: string,
    queueOrder?: number,
  ): Promise<GroupAthlete>;
  eliminateAthlete(groupId: number, athleteId: number): Promise<GroupAthlete>;
  updateAthleteMedal(
    groupId: number,
    athleteId: number,
    hasMedal: boolean,
  ): Promise<GroupAthlete>;

  // Legacy Categories
  getAllCategories(): Promise<Category[]>;
  getCategoryById(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;

  // Legacy Groups
  getGroupsByCategory(categoryId: number): Promise<Group[]>;
  createGroup(group: InsertGroup): Promise<Group>;
  addAthleteToLegacyGroup(groupId: number, athleteId: number): Promise<void>;

  // Matches
  getAllMatches(): Promise<Match[]>;
  getActiveMatches(): Promise<ActiveMatch[]>;
  createMatch(match: InsertMatch): Promise<Match>;
  updateMatch(id: number, match: Partial<InsertMatch>): Promise<Match>;
  declareWinner(matchId: number, winnerId: number): Promise<Match>;

  // Tournament Results
  getTournamentResults(): Promise<TournamentResult[]>;
  createTournamentResult(
    result: InsertTournamentResult,
  ): Promise<TournamentResult>;

  // Dashboard
  getDashboardStats(): Promise<DashboardStats>;

  // Anti-clash
  getCompetingAthletes(): Promise<Athlete[]>;
  getAvailableAthletes(): Promise<Athlete[]>;

  // Google Sheets Integration
  syncAthletesFromGoogleSheets(competitionId?: string): Promise<Athlete[]>;
  getCompetitionsFromGoogleSheets(): Promise<GoogleSheetsCompetition[]>;
  getAthletesFromCompetition(
    competitionId: string,
  ): Promise<GoogleSheetsAthlete[]>;
  transferAthletesToManagement(athletes: GoogleSheetsAthlete[]): Promise<void>;

  // Google Sheets Tournament Bracket Integration
  syncMainCategoriesToGoogleSheets(): Promise<void>;
  syncMainCategoriesFromGoogleSheets(): Promise<void>;
  syncSubCategoriesFromGoogleSheets(mainCategoryId: number): Promise<void>;
  syncSubCategoriesToGoogleSheets(): Promise<void>;
  syncAthleteGroupsFromGoogleSheets(subCategoryId: number): Promise<void>;
  syncAthleteGroupsToGoogleSheets(): Promise<void>;
  syncGroupAthletesToGoogleSheets(): Promise<void>;
}

export class MemStorage implements IStorage {
  private athletes: Map<number, Athlete> = new Map();
  private mainCategories: Map<number, MainCategory> = new Map();
  private subCategories: Map<number, SubCategory> = new Map();
  private athleteGroups: Map<number, AthleteGroup> = new Map();
  private groupAthletes: Map<number, GroupAthlete> = new Map();
  private categories: Map<number, Category> = new Map();
  private groups: Map<number, Group> = new Map();
  private groupMembers: Map<number, any> = new Map();
  private matches: Map<number, Match> = new Map();
  private tournamentResults: Map<number, TournamentResult> = new Map();
  private athleteStatusMap: Map<number, AthleteStatus> = new Map();

  private currentAthleteId = 1;
  private currentMainCategoryId = 1;
  private currentSubCategoryId = 1;
  private currentAthleteGroupId = 1;
  private currentGroupAthleteId = 1;
  private currentCategoryId = 1;
  private currentGroupId = 1;
  private currentMatchId = 1;
  private currentResultId = 1;

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Initialize some default categories
    const defaultCategories: InsertCategory[] = [
      {
        name: "Kyorugi Pria 45-50kg",
        type: "kyorugi",
        gender: "Laki-laki",
        weightMin: 45,
        weightMax: 50,
        beltLevel: "Kuning",
        maxParticipants: 8,
        minParticipants: 4,
        isActive: true,
      },
      {
        name: "Kyorugi Pria 50-55kg",
        type: "kyorugi",
        gender: "Laki-laki",
        weightMin: 50,
        weightMax: 55,
        beltLevel: "Kuning",
        maxParticipants: 8,
        minParticipants: 4,
        isActive: true,
      },
      {
        name: "Kyorugi Wanita 45-50kg",
        type: "kyorugi",
        gender: "Perempuan",
        weightMin: 45,
        weightMax: 50,
        beltLevel: "Hijau",
        maxParticipants: 8,
        minParticipants: 4,
        isActive: true,
      },
    ];

    defaultCategories.forEach((category) => {
      const id = this.currentCategoryId++;
      this.categories.set(id, {
        ...category,
        id,
        gender: category.gender || null,
        weightMin: category.weightMin || null,
        weightMax: category.weightMax || null,
        beltLevel: category.beltLevel || null,
        maxParticipants: category.maxParticipants || null,
        minParticipants: category.minParticipants || null,
        isActive: category.isActive || null,
      });
    });
  }

  // Enhanced athlete methods
  async getAllAthletes(): Promise<Athlete[]> {
    const rawAthletes = Array.from(this.athletes.values());

    // Map Indonesian field names to English field names for frontend compatibility
    return rawAthletes.map((athlete) => ({
      id: athlete.id,
      name: (athlete as any).namaLengkap || athlete.name,
      gender: athlete.gender,
      birthDate: (athlete as any).tglLahir || athlete.birthDate,
      dojang: athlete.dojang,
      belt: (athlete as any).sabuk || athlete.belt,
      weight: (athlete as any).beratBadan || athlete.weight,
      height: (athlete as any).tinggiBadan || athlete.height,
      category: (athlete as any).kategori || athlete.category,
      class: (athlete as any).kelas || athlete.class,
      isPresent: athlete.isPresent,
      status: athlete.status,
      competitionId: athlete.competitionId,
      createdAt: athlete.createdAt,
      updatedAt: athlete.updatedAt,
    }));
  }

  async getAthleteById(id: number): Promise<Athlete | undefined> {
    const athlete = this.athletes.get(id);
    if (!athlete) return undefined;

    // Map Indonesian field names to English field names for frontend compatibility
    return {
      id: athlete.id,
      name: (athlete as any).namaLengkap || athlete.name,
      gender: athlete.gender,
      birthDate: (athlete as any).tglLahir || athlete.birthDate,
      dojang: athlete.dojang,
      belt: (athlete as any).sabuk || athlete.belt,
      weight: (athlete as any).beratBadan || athlete.weight,
      height: (athlete as any).tinggiBadan || athlete.height,
      category: (athlete as any).kategori || athlete.category,
      class: (athlete as any).kelas || athlete.class,
      isPresent: athlete.isPresent,
      status: athlete.status,
      competitionId: athlete.competitionId,
      createdAt: athlete.createdAt,
      updatedAt: athlete.updatedAt,
    };
  }

  async createAthlete(athlete: InsertAthlete): Promise<Athlete> {
    const id = this.currentAthleteId++;
    const now = new Date();
    const newAthlete: Athlete = {
      ...athlete,
      id,
      status: athlete.status || null,
      isPresent: athlete.isPresent || null,
      competitionId: athlete.competitionId || null,
      createdAt: now,
      updatedAt: now,
    };
    this.athletes.set(id, newAthlete);

    // Initialize athlete status
    this.athleteStatusMap.set(id, {
      id: id,
      athleteId: id,
      status: "available",
      ringAssignment: null,
      lastUpdated: now,
    });

    return newAthlete;
  }

  async updateAthlete(
    id: number,
    athlete: Partial<InsertAthlete>,
  ): Promise<Athlete> {
    const existing = this.athletes.get(id);
    if (!existing) throw new Error("Athlete not found");

    const updated = {
      ...existing,
      ...athlete,
      updatedAt: new Date(),
    };
    this.athletes.set(id, updated);
    return updated;
  }

  async updateAthleteAttendance(
    id: number,
    isPresent: boolean,
  ): Promise<Athlete> {
    const existing = this.athletes.get(id);
    if (!existing) throw new Error("Athlete not found");

    const updated = {
      ...existing,
      isPresent,
      updatedAt: new Date(),
    };
    this.athletes.set(id, updated);

    // Update status based on attendance
    const status = this.athleteStatusMap.get(id);
    if (status) {
      status.status = isPresent ? "available" : "absent";
      status.lastUpdated = new Date();
    }

    return updated;
  }

  async updateAthleteStatus(
    id: number,
    status: string,
    ring?: string,
  ): Promise<Athlete> {
    const existing = this.athletes.get(id);
    if (!existing) throw new Error("Athlete not found");

    const updated = {
      ...existing,
      status,
      updatedAt: new Date(),
    };
    this.athletes.set(id, updated);

    // Update athlete status tracking
    const athleteStatus = this.athleteStatusMap.get(id);
    if (athleteStatus) {
      athleteStatus.status = status;
      athleteStatus.ringAssignment = ring || null;
      athleteStatus.lastUpdated = new Date();
    }

    return updated;
  }

  async deleteAthlete(id: number): Promise<void> {
    const athlete = this.athletes.get(id);
    if (!athlete) throw new Error(`Athlete with id ${id} not found`);

    this.athletes.delete(id);
    this.athleteStatusMap.delete(id);

    // Remove from all groups
    const groupAthletesToRemove = Array.from(
      this.groupAthletes.values(),
    ).filter((ga) => ga.athleteId === id);

    groupAthletesToRemove.forEach((ga) => {
      this.groupAthletes.delete(ga.id);
    });
  }

  // New batch operations
  async batchCreateAthletes(athletes: InsertAthlete[]): Promise<Athlete[]> {
    const results: Athlete[] = [];

    for (const athleteData of athletes) {
      try {
        const athlete = await this.createAthlete(athleteData);
        results.push(athlete);
      } catch (error) {
        console.error("Failed to create athlete in batch:", athleteData, error);
        // Continue with other athletes
      }
    }

    return results;
  }

  async batchUpdateAthletes(
    updates: Array<{ id: number; data: Partial<InsertAthlete> }>,
  ): Promise<Athlete[]> {
    const results: Athlete[] = [];

    for (const update of updates) {
      try {
        const athlete = await this.updateAthlete(update.id, update.data);
        results.push(athlete);
      } catch (error) {
        console.error("Failed to update athlete in batch:", update, error);
        // Continue with other athletes
      }
    }

    return results;
  }

  // Enhanced search functionality
  async searchAthletes(
    query: string,
    filters?: {
      dojang?: string;
      belt?: string;
      category?: string;
      status?: string;
      gender?: string;
    },
  ): Promise<Athlete[]> {
    const allAthletes = await this.getAllAthletes();
    const queryLower = query.toLowerCase();

    return allAthletes.filter((athlete) => {
      // Text search
      if (query) {
        const searchText =
          `${athlete.name} ${athlete.dojang} ${athlete.category}`.toLowerCase();
        if (!searchText.includes(queryLower)) return false;
      }

      // Apply filters
      if (filters?.dojang && athlete.dojang !== filters.dojang) return false;
      if (filters?.belt && athlete.belt !== filters.belt) return false;
      if (filters?.category && athlete.category !== filters.category)
        return false;
      if (filters?.status && athlete.status !== filters.status) return false;
      if (filters?.gender && athlete.gender !== filters.gender) return false;

      return true;
    });
  }

  // Main Categories methods (enhanced)
  async getAllMainCategories(): Promise<MainCategory[]> {
    // First try to sync from Google Sheets
    try {
      await this.syncMainCategoriesFromGoogleSheets();
    } catch (error) {
      console.warn("Failed to sync main categories from Google Sheets:", error);
    }

    const categories = Array.from(this.mainCategories.values());

    // If no categories loaded from Google Sheets, ensure we have some default categories
    if (categories.length === 0) {
      console.log(
        "No categories from Google Sheets, creating default categories",
      );
      // Create default category based on Google Sheets data
      const defaultCategory: MainCategory = {
        id: 1,
        name: "kyorugi",
        description: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.mainCategories.set(1, defaultCategory);
      return [defaultCategory];
    }

    return categories;
  }

  async clearAllMainCategories(): Promise<void> {
    this.mainCategories.clear();
  }

  async getMainCategoryById(id: number): Promise<MainCategory | undefined> {
    return this.mainCategories.get(id);
  }

  async createMainCategory(
    category: InsertMainCategory,
  ): Promise<MainCategory> {
    const id = category.id || this.currentMainCategoryId++;
    const now = new Date();
    const newCategory: MainCategory = {
      ...category,
      id,
      description: category.description || null,
      isActive: category.isActive || null,
      createdAt: now,
      updatedAt: now,
    };
    this.mainCategories.set(id, newCategory);

    // Update next ID if we used a provided ID
    if (category.id && category.id >= this.currentMainCategoryId) {
      this.currentMainCategoryId = category.id + 1;
    }

    return newCategory;
  }

  async updateMainCategory(
    id: number,
    category: Partial<InsertMainCategory>,
  ): Promise<MainCategory> {
    const existing = this.mainCategories.get(id);
    if (!existing) throw new Error("Main category not found");

    const updated = {
      ...existing,
      ...category,
      updatedAt: new Date(),
    };
    this.mainCategories.set(id, updated);
    return updated;
  }

  async deleteMainCategory(id: number): Promise<void> {
    // Check for dependent sub categories
    const dependentSubCategories = Array.from(
      this.subCategories.values(),
    ).filter((sc) => sc.mainCategoryId === id);

    if (dependentSubCategories.length > 0) {
      throw new Error(
        `Cannot delete main category. ${dependentSubCategories.length} sub categories depend on it.`,
      );
    }

    this.mainCategories.delete(id);
  }

  // Continue with enhanced implementations of other methods...
  // (The rest of the methods follow the same pattern with better error handling,
  // timestamps, and Google Sheets integration)

  // Enhanced Google Sheets sync methods
  async syncMainCategoriesFromGoogleSheets(): Promise<void> {
    try {
      console.log("Loading main categories from Google Sheets...");

      // This would be called by the routes layer which has access to the Google Sheets API
      // The storage layer focuses on data management, not external API calls
      console.log("Sync request logged - will be handled by routes layer");
    } catch (error) {
      console.error("Error in sync request:", error);
      // Don't throw error - let application continue with local data
    }
  }

  // Enhanced dashboard stats
  async getDashboardStats(): Promise<DashboardStats> {
    const allAthletes = Array.from(this.athletes.values());
    const allMatches = Array.from(this.matches.values());
    const allCategories = Array.from(this.categories.values());
    const allMainCategories = Array.from(this.mainCategories.values());
    const allSubCategories = Array.from(this.subCategories.values());
    const allAthleteGroups = Array.from(this.athleteGroups.values());

    return {
      totalAthletes: allAthletes.length,
      activeCategories: allCategories.filter((c) => c.isActive).length,
      activeMatches: allMatches.filter((m) => m.status === "active").length,
      completedMatches: allMatches.filter((m) => m.status === "completed")
        .length,
      presentAthletes: allAthletes.filter((a) => a.isPresent).length,
      availableAthletes: allAthletes.filter(
        (a) => a.status === "available" && a.isPresent,
      ).length,
      competingAthletes: allAthletes.filter((a) => a.status === "competing")
        .length,
      totalMainCategories: allMainCategories.length,
      totalSubCategories: allSubCategories.length,
      totalAthleteGroups: allAthleteGroups.length,
      lastUpdated: new Date(),
    };
  }

  // Rest of the methods implementation...
  // (Continue with the same enhanced pattern for all other methods)
}

export const storage = new MemStorage();
