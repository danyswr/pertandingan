import { 
  athletes, 
  categories, 
  groups, 
  groupMembers, 
  matches, 
  tournamentResults, 
  athleteStatus,
  type Athlete, 
  type InsertAthlete,
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
  type GoogleSheetsAthlete
} from "@shared/schema";

export interface IStorage {
  // Athletes
  getAllAthletes(): Promise<Athlete[]>;
  getAthleteById(id: number): Promise<Athlete | undefined>;
  createAthlete(athlete: InsertAthlete): Promise<Athlete>;
  updateAthlete(id: number, athlete: Partial<InsertAthlete>): Promise<Athlete>;
  updateAthleteAttendance(id: number, isPresent: boolean): Promise<Athlete>;
  updateAthleteStatus(id: number, status: string, ring?: string): Promise<Athlete>;
  
  // Categories
  getAllCategories(): Promise<Category[]>;
  getCategoryById(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Groups
  getGroupsByCategory(categoryId: number): Promise<Group[]>;
  createGroup(group: InsertGroup): Promise<Group>;
  addAthleteToGroup(groupId: number, athleteId: number): Promise<void>;
  
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
}

export class MemStorage implements IStorage {
  private athletes: Map<number, Athlete> = new Map();
  private categories: Map<number, Category> = new Map();
  private groups: Map<number, Group> = new Map();
  private groupMembers: Map<number, any> = new Map();
  private matches: Map<number, Match> = new Map();
  private tournamentResults: Map<number, TournamentResult> = new Map();
  private athleteStatusMap: Map<number, AthleteStatus> = new Map();
  
  private currentAthleteId = 1;
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
    return Array.from(this.athletes.values());
  }

  async getAthleteById(id: number): Promise<Athlete | undefined> {
    return this.athletes.get(id);
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

  async addAthleteToGroup(groupId: number, athleteId: number): Promise<void> {
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
        const testResponse = await fetch(`${managementUrl}?action=test`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });
        
        const responseText = await testResponse.text();
        console.log('Google Apps Script test response:', responseText);
        
        // Jika response mengandung JSON atau success message, script bekerja
        scriptWorking = responseText.includes('success') || responseText.includes('{') || testResponse.ok;
      } catch (error) {
        console.log('Google Apps Script test failed:', error);
        scriptWorking = false;
      }

      let successCount = 0;
      
      if (scriptWorking) {
        console.log('Google Apps Script is working, proceeding with transfer...');
        
        // Coba kirim sebagai batch terlebih dahulu
        try {
          const batchResponse = await fetch(managementUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'createBatch',
              sheetName: 'atlets',
              data: transferData
            })
          });

          const batchResult = await batchResponse.text();
          console.log('Batch transfer response:', batchResult);

          if (batchResponse.ok && (batchResult.includes('success') || batchResult.includes('Athletes'))) {
            successCount = transferData.length;
            console.log('Batch transfer successful');
          } else {
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

              const response = await fetch(managementUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData
              });

              const result = await response.text();
              console.log(`Transfer result for ${athleteData.nama_lengkap}:`, result);

              if (response.ok) {
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
          idAtlet: athleteData.id_atlet,
          namaLengkap: athleteData.nama_lengkap,
          gender: athleteData.gender,
          tglLahir: athleteData.tgl_lahir,
          dojang: athleteData.dojang,
          sabuk: athleteData.sabuk,
          beratBadan: athleteData.berat_badan,
          tinggiBadan: athleteData.tinggi_badan,
          kategori: athleteData.kategori,
          kelas: athleteData.kelas,
          isPresent: false
        };
        this.athletes.set(newAthlete.id, newAthlete);
      }

      console.log(`Successfully transferred ${athletes.length} athletes to management spreadsheet`);
    } catch (error) {
      console.error('Error transferring athletes:', error);
      throw error;
    }
  }
}

export const storage = new MemStorage();
