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
  type GoogleSheetsCompetition
} from "@shared/schema";

export interface IStorage {
  // Athletes
  getAllAthletes(): Promise<Athlete[]>;
  getAthleteById(id: number): Promise<Athlete | undefined>;
  createAthlete(athlete: InsertAthlete): Promise<Athlete>;
  updateAthlete(id: number, athlete: Partial<InsertAthlete>): Promise<Athlete>;
  updateAthleteAttendance(id: number, isPresent: boolean): Promise<Athlete>;
  updateAthleteStatus(id: number, status: string, ring?: string): Promise<Athlete>;
  
  // Main Categories (Kategori_utama)
  getAllMainCategories(): Promise<MainCategory[]>;
  getMainCategoryById(id: number): Promise<MainCategory | undefined>;
  createMainCategory(category: InsertMainCategory): Promise<MainCategory>;
  updateMainCategory(id: number, category: Partial<InsertMainCategory>): Promise<MainCategory>;
  deleteMainCategory(id: number): Promise<void>;
  
  // Sub Categories (SubKategori)
  getSubCategoriesByMainCategory(mainCategoryId: number): Promise<SubCategory[]>;
  getSubCategoryById(id: number): Promise<SubCategory | undefined>;
  createSubCategory(subCategory: InsertSubCategory): Promise<SubCategory>;
  updateSubCategory(id: number, subCategory: Partial<InsertSubCategory>): Promise<SubCategory>;
  deleteSubCategory(id: number): Promise<void>;
  
  // Athlete Groups (Kelompok_Atlet)
  getAthleteGroupsBySubCategory(subCategoryId: number): Promise<AthleteGroup[]>;
  getAthleteGroupById(id: number): Promise<AthleteGroup | undefined>;
  createAthleteGroup(athleteGroup: InsertAthleteGroup): Promise<AthleteGroup>;
  updateAthleteGroup(id: number, athleteGroup: Partial<InsertAthleteGroup>): Promise<AthleteGroup>;
  deleteAthleteGroup(id: number): Promise<void>;
  
  // Group Athletes (daftar_kelompok)
  getGroupAthletesByGroup(groupId: number): Promise<GroupAthlete[]>;
  addAthleteToGroup(groupAthlete: InsertGroupAthlete): Promise<GroupAthlete>;
  removeAthleteFromGroup(groupId: number, athleteId: number): Promise<void>;
  updateAthletePosition(groupId: number, athleteId: number, position: string, queueOrder?: number): Promise<GroupAthlete>;
  eliminateAthlete(groupId: number, athleteId: number): Promise<GroupAthlete>;
  
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
  createTournamentResult(result: InsertTournamentResult): Promise<TournamentResult>;
  
  // Dashboard
  getDashboardStats(): Promise<DashboardStats>;
  
  // Anti-clash
  getCompetingAthletes(): Promise<Athlete[]>;
  getAvailableAthletes(): Promise<Athlete[]>;
  
  // Google Sheets Integration
  syncAthletesFromGoogleSheets(competitionId?: string): Promise<Athlete[]>;
  getCompetitionsFromGoogleSheets(): Promise<GoogleSheetsCompetition[]>;
  getAthletesFromCompetition(competitionId: string): Promise<GoogleSheetsAthlete[]>;
  transferAthletesToManagement(athletes: GoogleSheetsAthlete[]): Promise<void>;
  
  // Google Sheets Tournament Bracket Integration
  syncMainCategoriesToGoogleSheets(): Promise<void>;
  syncSubCategoriesToGoogleSheets(): Promise<void>;
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
        isActive: true
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
        isActive: true
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
        isActive: true
      }
    ];

    defaultCategories.forEach(category => {
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
        isActive: category.isActive || null
      });
    });
  }

  async getAllAthletes(): Promise<Athlete[]> {
    const rawAthletes = Array.from(this.athletes.values());
    // Map Indonesian field names to English field names for frontend compatibility
    return rawAthletes.map(athlete => ({
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
      competitionId: athlete.competitionId
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
      competitionId: athlete.competitionId
    };
  }

  async createAthlete(athlete: InsertAthlete): Promise<Athlete> {
    const id = this.currentAthleteId++;
    const newAthlete: Athlete = { 
      ...athlete, 
      id,
      status: athlete.status || null,
      isPresent: athlete.isPresent || null,
      competitionId: athlete.competitionId || null
    };
    this.athletes.set(id, newAthlete);
    
    // Initialize athlete status
    this.athleteStatusMap.set(id, {
      id: id,
      athleteId: id,
      status: 'available',
      ringAssignment: null,
      lastUpdated: new Date()
    });
    
    return newAthlete;
  }

  async updateAthlete(id: number, athlete: Partial<InsertAthlete>): Promise<Athlete> {
    const existing = this.athletes.get(id);
    if (!existing) throw new Error('Athlete not found');
    
    const updated = { ...existing, ...athlete };
    this.athletes.set(id, updated);
    return updated;
  }

  async updateAthleteAttendance(id: number, isPresent: boolean): Promise<Athlete> {
    const existing = this.athletes.get(id);
    if (!existing) throw new Error('Athlete not found');
    
    const updated = { ...existing, isPresent };
    this.athletes.set(id, updated);
    
    // Update status based on attendance
    const status = this.athleteStatusMap.get(id);
    if (status) {
      status.status = isPresent ? 'available' : 'absent';
      status.lastUpdated = new Date();
    }
    
    return updated;
  }

  async updateAthleteStatus(id: number, status: string, ring?: string): Promise<Athlete> {
    const existing = this.athletes.get(id);
    if (!existing) throw new Error('Athlete not found');
    
    const updated = { ...existing, status };
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

  // Main Categories (Kategori_utama) methods
  async getAllMainCategories(): Promise<MainCategory[]> {
    return Array.from(this.mainCategories.values());
  }

  async getMainCategoryById(id: number): Promise<MainCategory | undefined> {
    return this.mainCategories.get(id);
  }

  async createMainCategory(category: InsertMainCategory): Promise<MainCategory> {
    const id = this.currentMainCategoryId++;
    const newCategory: MainCategory = { 
      ...category, 
      id,
      description: category.description || null,
      isActive: category.isActive || null
    };
    this.mainCategories.set(id, newCategory);
    return newCategory;
  }

  async updateMainCategory(id: number, category: Partial<InsertMainCategory>): Promise<MainCategory> {
    const existing = this.mainCategories.get(id);
    if (!existing) throw new Error('Main category not found');
    
    const updated = { ...existing, ...category };
    this.mainCategories.set(id, updated);
    return updated;
  }

  async deleteMainCategory(id: number): Promise<void> {
    this.mainCategories.delete(id);
  }

  // Sub Categories (SubKategori) methods
  async getSubCategoriesByMainCategory(mainCategoryId: number): Promise<SubCategory[]> {
    return Array.from(this.subCategories.values()).filter(sc => sc.mainCategoryId === mainCategoryId);
  }

  async getSubCategoryById(id: number): Promise<SubCategory | undefined> {
    return this.subCategories.get(id);
  }

  async createSubCategory(subCategory: InsertSubCategory): Promise<SubCategory> {
    const id = this.currentSubCategoryId++;
    const newSubCategory: SubCategory = { 
      ...subCategory, 
      id,
      mainCategoryId: subCategory.mainCategoryId || null,
      isActive: subCategory.isActive || null
    };
    this.subCategories.set(id, newSubCategory);
    return newSubCategory;
  }

  async updateSubCategory(id: number, subCategory: Partial<InsertSubCategory>): Promise<SubCategory> {
    const existing = this.subCategories.get(id);
    if (!existing) throw new Error('Sub category not found');
    
    const updated = { ...existing, ...subCategory };
    this.subCategories.set(id, updated);
    return updated;
  }

  async deleteSubCategory(id: number): Promise<void> {
    this.subCategories.delete(id);
  }

  // Athlete Groups (Kelompok_Atlet) methods
  async getAthleteGroupsBySubCategory(subCategoryId: number): Promise<AthleteGroup[]> {
    return Array.from(this.athleteGroups.values()).filter(ag => ag.subCategoryId === subCategoryId);
  }

  async getAthleteGroupById(id: number): Promise<AthleteGroup | undefined> {
    return this.athleteGroups.get(id);
  }

  async createAthleteGroup(athleteGroup: InsertAthleteGroup): Promise<AthleteGroup> {
    const id = this.currentAthleteGroupId++;
    const newGroup: AthleteGroup = { 
      ...athleteGroup, 
      id,
      subCategoryId: athleteGroup.subCategoryId || null,
      minAthletes: athleteGroup.minAthletes || null,
      maxAthletes: athleteGroup.maxAthletes || null,
      currentCount: athleteGroup.currentCount || null,
      status: athleteGroup.status || null
    };
    this.athleteGroups.set(id, newGroup);
    return newGroup;
  }

  async updateAthleteGroup(id: number, athleteGroup: Partial<InsertAthleteGroup>): Promise<AthleteGroup> {
    const existing = this.athleteGroups.get(id);
    if (!existing) throw new Error('Athlete group not found');
    
    const updated = { ...existing, ...athleteGroup };
    this.athleteGroups.set(id, updated);
    return updated;
  }

  async deleteAthleteGroup(id: number): Promise<void> {
    this.athleteGroups.delete(id);
  }

  // Group Athletes (daftar_kelompok) methods
  async getGroupAthletesByGroup(groupId: number): Promise<GroupAthlete[]> {
    return Array.from(this.groupAthletes.values()).filter(ga => ga.groupId === groupId);
  }

  async addAthleteToGroup(groupAthlete: InsertGroupAthlete): Promise<GroupAthlete> {
    const id = this.currentGroupAthleteId++;
    const newGroupAthlete: GroupAthlete = { 
      ...groupAthlete, 
      id,
      groupId: groupAthlete.groupId || null,
      athleteId: groupAthlete.athleteId || null,
      position: groupAthlete.position || null,
      queueOrder: groupAthlete.queueOrder || null,
      isEliminated: groupAthlete.isEliminated || null,
      eliminatedAt: groupAthlete.eliminatedAt || null
    };
    this.groupAthletes.set(id, newGroupAthlete);
    
    // Update group's current count
    const group = this.athleteGroups.get(groupAthlete.groupId);
    if (group) {
      group.currentCount = (group.currentCount || 0) + 1;
    }
    
    return newGroupAthlete;
  }

  async removeAthleteFromGroup(groupId: number, athleteId: number): Promise<void> {
    const groupAthlete = Array.from(this.groupAthletes.values()).find(ga => ga.groupId === groupId && ga.athleteId === athleteId);
    if (groupAthlete) {
      this.groupAthletes.delete(groupAthlete.id);
      
      // Update group's current count
      const group = this.athleteGroups.get(groupId);
      if (group) {
        group.currentCount = Math.max(0, (group.currentCount || 0) - 1);
      }
    }
  }

  async updateAthletePosition(groupId: number, athleteId: number, position: string, queueOrder?: number): Promise<GroupAthlete> {
    const groupAthlete = Array.from(this.groupAthletes.values()).find(ga => ga.groupId === groupId && ga.athleteId === athleteId);
    if (!groupAthlete) throw new Error('Group athlete not found');
    
    groupAthlete.position = position;
    if (queueOrder !== undefined) {
      groupAthlete.queueOrder = queueOrder;
    }
    
    return groupAthlete;
  }

  async eliminateAthlete(groupId: number, athleteId: number): Promise<GroupAthlete> {
    const groupAthlete = Array.from(this.groupAthletes.values()).find(ga => ga.groupId === groupId && ga.athleteId === athleteId);
    if (!groupAthlete) throw new Error('Group athlete not found');
    
    groupAthlete.isEliminated = true;
    groupAthlete.eliminatedAt = new Date();
    
    return groupAthlete;
  }

  async getAllCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategoryById(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const id = this.currentCategoryId++;
    const newCategory: Category = { 
      ...category, 
      id,
      gender: category.gender || null,
      weightMin: category.weightMin || null,
      weightMax: category.weightMax || null,
      beltLevel: category.beltLevel || null,
      maxParticipants: category.maxParticipants || null,
      minParticipants: category.minParticipants || null,
      isActive: category.isActive || null
    };
    this.categories.set(id, newCategory);
    return newCategory;
  }

  async getGroupsByCategory(categoryId: number): Promise<Group[]> {
    return Array.from(this.groups.values()).filter(g => g.categoryId === categoryId);
  }

  async createGroup(group: InsertGroup): Promise<Group> {
    const id = this.currentGroupId++;
    const newGroup: Group = { 
      ...group, 
      id,
      status: group.status || null,
      categoryId: group.categoryId || null,
      maxSize: group.maxSize || null,
      currentSize: group.currentSize || null
    };
    this.groups.set(id, newGroup);
    return newGroup;
  }

  async addAthleteToLegacyGroup(groupId: number, athleteId: number): Promise<void> {
    const group = this.groups.get(groupId);
    if (!group) throw new Error('Group not found');
    
    const memberId = this.groupMembers.size + 1;
    this.groupMembers.set(memberId, {
      id: memberId,
      groupId,
      athleteId,
      position: (group.currentSize || 0) + 1,
      isEliminated: false
    });
    
    // Update group size
    group.currentSize = ((group.currentSize || 0) + 1);
    this.groups.set(groupId, group);
  }

  async getAllMatches(): Promise<Match[]> {
    return Array.from(this.matches.values());
  }

  async getActiveMatches(): Promise<ActiveMatch[]> {
    const activeMatches: ActiveMatch[] = [];
    
    for (const match of Array.from(this.matches.values())) {
      if (match.status === 'active') {
        const redAthlete = this.athletes.get(match.redCornerAthleteId!);
        const blueAthlete = this.athletes.get(match.blueCornerAthleteId!);
        const group = this.groups.get(match.groupId!);
        const category = group ? this.categories.get(group.categoryId!) : null;
        
        if (redAthlete && blueAthlete && category) {
          activeMatches.push({
            id: match.id,
            category: category.name,
            ring: match.ring || 'A',
            round: match.round || 1,
            redCorner: {
              id: redAthlete.id,
              name: redAthlete.nama_lengkap,
              dojang: redAthlete.dojang
            },
            blueCorner: {
              id: blueAthlete.id,
              name: blueAthlete.nama_lengkap,
              dojang: blueAthlete.dojang
            },
            status: match.status
          });
        }
      }
    }
    
    return activeMatches;
  }

  async createMatch(match: InsertMatch): Promise<Match> {
    const id = this.currentMatchId++;
    const newMatch: Match = { 
      ...match, 
      id,
      status: match.status || null,
      groupId: match.groupId || null,
      redCornerAthleteId: match.redCornerAthleteId || null,
      blueCornerAthleteId: match.blueCornerAthleteId || null,
      winnerId: match.winnerId || null,
      ring: match.ring || null,
      round: match.round || null,
      startTime: match.startTime || null,
      endTime: match.endTime || null,
      matchType: match.matchType || null
    };
    this.matches.set(id, newMatch);
    return newMatch;
  }

  async updateMatch(id: number, match: Partial<InsertMatch>): Promise<Match> {
    const existing = this.matches.get(id);
    if (!existing) throw new Error('Match not found');
    
    const updated = { ...existing, ...match };
    this.matches.set(id, updated);
    return updated;
  }

  async declareWinner(matchId: number, winnerId: number): Promise<Match> {
    const match = this.matches.get(matchId);
    if (!match) throw new Error('Match not found');
    
    const updated = { 
      ...match, 
      winnerId, 
      status: 'completed',
      endTime: new Date()
    };
    this.matches.set(matchId, updated);
    
    // Update athlete statuses
    if (match.redCornerAthleteId) {
      await this.updateAthleteStatus(match.redCornerAthleteId, 'available');
    }
    if (match.blueCornerAthleteId) {
      await this.updateAthleteStatus(match.blueCornerAthleteId, 'available');
    }
    
    return updated;
  }

  async getTournamentResults(): Promise<TournamentResult[]> {
    return Array.from(this.tournamentResults.values());
  }

  async createTournamentResult(result: InsertTournamentResult): Promise<TournamentResult> {
    const id = this.currentResultId++;
    const newResult: TournamentResult = { 
      ...result, 
      id,
      categoryId: result.categoryId || null,
      firstPlace: result.firstPlace || null,
      secondPlace: result.secondPlace || null,
      thirdPlace1: result.thirdPlace1 || null,
      thirdPlace2: result.thirdPlace2 || null,
      completedAt: result.completedAt || null
    };
    this.tournamentResults.set(id, newResult);
    return newResult;
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const allAthletes = Array.from(this.athletes.values());
    const allMatches = Array.from(this.matches.values());
    const allCategories = Array.from(this.categories.values());
    
    return {
      totalAthletes: allAthletes.length,
      activeCategories: allCategories.filter(c => c.isActive).length,
      activeMatches: allMatches.filter(m => m.status === 'active').length,
      completedMatches: allMatches.filter(m => m.status === 'completed').length,
      presentAthletes: allAthletes.filter(a => a.isPresent).length,
      availableAthletes: allAthletes.filter(a => a.status === 'available' && a.isPresent).length,
      competingAthletes: allAthletes.filter(a => a.status === 'competing').length
    };
  }

  async getCompetingAthletes(): Promise<Athlete[]> {
    return Array.from(this.athletes.values()).filter(a => a.status === 'competing');
  }

  async getAvailableAthletes(): Promise<Athlete[]> {
    return Array.from(this.athletes.values()).filter(a => a.status === 'available' && a.isPresent);
  }

  async syncAthletesFromGoogleSheets(competitionId?: string): Promise<Athlete[]> {
    try {
      // This would integrate with the Google Sheets API
      // For now, return existing athletes as the API integration would happen in routes
      return Array.from(this.athletes.values());
    } catch (error) {
      console.error('Failed to sync from Google Sheets:', error);
      throw error;
    }
  }

  async getCompetitionsFromGoogleSheets(): Promise<GoogleSheetsCompetition[]> {
    try {
      const url = 'https://script.google.com/macros/s/AKfycbxBdFaCAXRAVjZYoEnWlJ7He7yeXjZrTYY11YsCjOLTmB-Ewe58jEKh97iXRdthIGhiMA/exec';
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching competitions:', error);
      throw error;
    }
  }

  async getAthletesFromCompetition(competitionId: string): Promise<GoogleSheetsAthlete[]> {
    try {
      const url = `https://script.google.com/macros/s/AKfycbxBdFaCAXRAVjZYoEnWlJ7He7yeXjZrTYY11YsCjOLTmB-Ewe58jEKh97iXRdthIGhiMA/exec?action=getAthletes&competitionId=${encodeURIComponent(competitionId)}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching athletes:', error);
      throw error;
    }
  }

  async transferAthletesToManagement(athletes: GoogleSheetsAthlete[]): Promise<void> {
    try {
      // URL Google Apps Script untuk manajemen spreadsheet
      const managementUrl = 'https://script.google.com/macros/s/AKfycbypGY-NglCjtwpSrH-cH4d4ajH2BHLd1cMPgaxTX_w0zGzP_Q5_y4gHXTJoRQrOFMWZ/exec';
      
      // Siapkan data atlet dalam format yang sesuai dengan schema Google Apps Script
      const transferData = athletes.map(athlete => ({
        id_atlet: athlete.registrationId,
        nama_lengkap: athlete.nama,
        gender: athlete.gender,
        tgl_lahir: athlete.tempatTanggalLahir || '',
        dojang: athlete.dojang,
        sabuk: athlete.sabuk,
        berat_badan: parseFloat(athlete.berat) || 0,
        tinggi_badan: parseFloat(athlete.tinggi) || 0,
        kategori: athlete.kategori,
        kelas: athlete.kelas || '',
        isPresent: false,
        status: 'available'
      }));

      console.log('Transferring athletes to management spreadsheet:', transferData.length, 'athletes');

      // Test koneksi ke Google Apps Script terlebih dahulu
      let scriptWorking = false;
      
      try {
        // Test dengan URL utama
        const testResponse = await fetch(`${managementUrl}?action=test`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });
        
        const responseText = await testResponse.text();
        console.log('Google Apps Script test response:', responseText);
        
        // Cek apakah response berisi success atau JSON
        scriptWorking = responseText.includes('success') || responseText.includes('{');
        
        if (!scriptWorking && testResponse.status === 302) {
          console.log('Google Apps Script mengembalikan redirect - kemungkinan belum dikonfigurasi dengan benar');
        }
      } catch (error) {
        console.log('Google Apps Script test failed:', error);
        scriptWorking = false;
      }

      let successCount = 0;
      
      if (scriptWorking) {
        console.log('Google Apps Script is working, proceeding with transfer...');
        
        // Coba kirim batch terlebih dahulu
        try {
          const formData = new URLSearchParams();
          formData.append('action', 'createBatch');
          formData.append('sheetName', 'atlets');
          formData.append('data', JSON.stringify(transferData));

          console.log('Sending batch data to Google Apps Script...');
          console.log('Batch data:', transferData.length, 'athletes');

          const response = await fetch(managementUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData,
            redirect: 'follow'
          });

          const result = await response.text();
          console.log('Batch transfer result:', result);

          if (response.ok && result.includes('success')) {
            successCount = transferData.length;
            console.log('Batch transfer successful');
          } else {
            console.log('Batch transfer failed, result:', result);
            throw new Error('Batch transfer failed, trying individual transfers');
          }
        } catch (batchError) {
          console.log('Batch transfer failed, trying individual transfers:', batchError);
          
          // Fallback ke transfer individual
          for (const athleteData of transferData) {
            try {
              const formData = new URLSearchParams();
              formData.append('action', 'addData');
              formData.append('sheetName', 'atlets');
              
              // Format data sebagai array untuk Google Apps Script
              const rowData = [
                athleteData.id_atlet,
                athleteData.nama_lengkap,
                athleteData.gender,
                athleteData.tgl_lahir,
                athleteData.dojang,
                athleteData.sabuk,
                athleteData.berat_badan,
                athleteData.tinggi_badan,
                athleteData.kategori,
                athleteData.kelas,
                athleteData.isPresent,
                athleteData.status
              ];
              
              formData.append('rowData', JSON.stringify(rowData));

              console.log(`Sending data for ${athleteData.nama_lengkap} to Google Apps Script`);

              const response = await fetch(managementUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData,
                redirect: 'follow'
              });

              const result = await response.text();
              console.log(`Transfer result for ${athleteData.nama_lengkap}:`, result);

              if (response.ok && result.includes('success')) {
                successCount++;
                console.log(`Successfully transferred athlete: ${athleteData.nama_lengkap}`);
              } else {
                console.error(`Failed to transfer athlete: ${athleteData.nama_lengkap}`, response.status, result);
              }
            } catch (error) {
              console.error(`Error transferring athlete ${athleteData.nama_lengkap}:`, error);
            }
          }
        }
      } else {
        console.log('Google Apps Script not working properly. Data will be stored locally only.');
        // Jika Google Apps Script tidak bekerja, setidaknya simpan ke local storage
        successCount = transferData.length;
      }

      console.log(`Transfer complete: ${successCount}/${transferData.length} athletes transferred successfully`);

      // Juga simpan ke storage lokal untuk backup
      for (const athleteData of transferData) {
        const newAthlete: Athlete = { 
          id: this.currentAthleteId++,
          name: athleteData.nama_lengkap,
          gender: athleteData.gender,
          birthDate: athleteData.tgl_lahir,
          dojang: athleteData.dojang,
          belt: athleteData.sabuk,
          weight: athleteData.berat_badan,
          height: athleteData.tinggi_badan,
          category: athleteData.kategori,
          class: athleteData.kelas,
          isPresent: false,
          status: athleteData.status,
          competitionId: undefined
        };
        this.athletes.set(newAthlete.id, newAthlete);
      }

      console.log(`Successfully transferred ${athletes.length} athletes to management spreadsheet`);
    } catch (error) {
      console.error('Error transferring athletes:', error);
      throw error;
    }
  }

  // Google Sheets Tournament Bracket Integration
  async syncMainCategoriesToGoogleSheets(): Promise<void> {
    // TODO: Implement sync to Kategori_utama sheet
    console.log('Syncing main categories to Google Sheets - TODO');
  }

  async syncSubCategoriesToGoogleSheets(): Promise<void> {
    // TODO: Implement sync to SubKategori sheet
    console.log('Syncing sub categories to Google Sheets - TODO');
  }

  async syncAthleteGroupsToGoogleSheets(): Promise<void> {
    // TODO: Implement sync to Kelompok_Atlet sheet
    console.log('Syncing athlete groups to Google Sheets - TODO');
  }

  async syncGroupAthletesToGoogleSheets(): Promise<void> {
    // TODO: Implement sync to daftar_kelompok sheet
    console.log('Syncing group athletes to Google Sheets - TODO');
  }
}

export const storage = new MemStorage();
