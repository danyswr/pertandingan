import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { 
  insertAthleteSchema, 
  insertCategorySchema, 
  insertMatchSchema,
  insertMainCategorySchema,
  insertSubCategorySchema,
  insertAthleteGroupSchema,
  insertGroupAthleteSchema
} from "@shared/schema";
import { z } from "zod";

const GOOGLE_SHEETS_CONFIG = {
  ATHLETES_API: process.env.ATHLETES_API || 'https://script.google.com/macros/s/AKfycbxBdFaCAXRAVjZYoEnWlJ7He7yeXjZrTYY11YsCjOLTmB-Ewe58jEKh97iXRdthIGhiMA/exec',
  MANAGEMENT_API: process.env.MANAGEMENT_API || 'https://script.google.com/macros/s/AKfycbypGY-NglCjtwpSrH-cH4d4ajH2BHLd1cMPgaxTX_w0zGzP_Q5_y4gHXTJoRQrOFMWZ/exec'
};

// Cache untuk mempercepat pengambilan data
const dataCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_DURATION = 2000; // 2 detik (reduced for quicker updates)

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store WebSocket connections
  const clients = new Set<WebSocket>();
  
  wss.on('connection', (ws: WebSocket) => {
    clients.add(ws);
    console.log('New WebSocket client connected');
    
    ws.on('close', () => {
      clients.delete(ws);
      console.log('WebSocket client disconnected');
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });
  
  // Broadcast function for real-time updates
  function broadcast(data: any) {
    const message = JSON.stringify(data);
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // Helper function to fetch from Google Sheets dengan caching
  async function fetchFromGoogleSheets(url: string, params: Record<string, string> = {}) {
    try {
      const cacheKey = `${url}?${new URLSearchParams(params).toString()}`;
      
      // Check cache first
      if (dataCache.has(cacheKey)) {
        const cached = dataCache.get(cacheKey)!;
        if (Date.now() - cached.timestamp < CACHE_DURATION) {
          return cached.data;
        } else {
          dataCache.delete(cacheKey);
        }
      }
      
      const urlWithParams = new URL(url);
      Object.entries(params).forEach(([key, value]) => {
        urlWithParams.searchParams.append(key, value);
      });
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 detik timeout
      
      const response = await fetch(urlWithParams.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
        },
        signal: controller.signal,
        redirect: 'follow'
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Cache hasil untuk permintaan selanjutnya
      dataCache.set(cacheKey, { data, timestamp: Date.now() });
      
      return data;
    } catch (error) {
      console.error('Google Sheets API error:', error);
      throw new Error('Failed to fetch data from Google Sheets');
    }
  }

  // Helper function to update attendance in Google Sheets
  async function updateGoogleSheetsAttendance(athleteId: number, isPresent: boolean) {
    try {
      const athlete = await storage.getAthleteById(athleteId);
      if (!athlete) {
        throw new Error('Athlete not found');
      }

      console.log(`Attempting to update Google Sheets attendance for athlete ${athleteId} to ${isPresent}`);

      const postData = new URLSearchParams({
        action: 'updateAttendance',
        athleteId: athleteId.toString(),
        isPresent: isPresent.toString()
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 detik timeout

      const response = await fetch(GOOGLE_SHEETS_CONFIG.MANAGEMENT_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: postData.toString(),
        signal: controller.signal,
        redirect: 'follow'
      });

      clearTimeout(timeoutId);

      console.log(`Google Sheets response status: ${response.status}`);
      console.log(`Google Sheets response headers:`, Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const responseText = await response.text();
        console.error(`Google Sheets error response: ${responseText}`);
        throw new Error(`HTTP error! status: ${response.status}, body: ${responseText}`);
      }

      const responseText = await response.text();
      console.log(`Google Sheets raw response: ${responseText}`);

      try {
        const result = JSON.parse(responseText);
        console.log('Google Sheets attendance update result:', result);
        return result;
      } catch (parseError) {
        console.error('Failed to parse Google Sheets response as JSON:', parseError);
        // If it's not JSON, it might be HTML redirect, try to extract the actual URL
        if (responseText.includes('href=')) {
          const match = responseText.match(/href="([^"]*)">/);
          if (match) {
            const redirectUrl = match[1].replace(/&amp;/g, '&');
            console.log('Found redirect URL:', redirectUrl);
            
            // Try the redirect URL
            const redirectResponse = await fetch(redirectUrl, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
              }
            });
            
            const redirectResult = await redirectResponse.text();
            console.log('Redirect response:', redirectResult);
            
            try {
              return JSON.parse(redirectResult);
            } catch (redirectParseError) {
              console.error('Failed to parse redirect response:', redirectParseError);
              return { success: false, error: 'Invalid response format' };
            }
          }
        }
        return { success: false, error: 'Invalid response format' };
      }
    } catch (error) {
      console.error('Failed to update Google Sheets attendance:', error);
      throw error;
    }
  }

  // Helper function to update athlete data in Google Sheets
  async function updateGoogleSheetsAthlete(athleteId: number, athlete: any) {
    try {
      console.log(`Attempting to update Google Sheets athlete data for athlete ${athleteId}`);

      const postData = new URLSearchParams({
        action: 'updateAthlete',
        athleteId: athleteId.toString(),
        name: athlete.name || '',
        gender: athlete.gender || '',
        birthDate: athlete.birthDate || '',
        dojang: athlete.dojang || '',
        belt: athlete.belt || '',
        weight: athlete.weight?.toString() || '0',
        height: athlete.height?.toString() || '0',
        category: athlete.category || '',
        class: athlete.class || '',
        status: athlete.status || 'available'
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(GOOGLE_SHEETS_CONFIG.MANAGEMENT_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: postData.toString(),
        signal: controller.signal,
        redirect: 'follow'
      });

      clearTimeout(timeoutId);

      console.log(`Google Sheets athlete update response status: ${response.status}`);

      if (!response.ok) {
        const responseText = await response.text();
        console.error(`Google Sheets athlete update error: ${responseText}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      console.log(`Google Sheets athlete update response: ${responseText}`);

      try {
        const result = JSON.parse(responseText);
        console.log('Google Sheets athlete update result:', result);
        return result;
      } catch (parseError) {
        console.error('Failed to parse Google Sheets response:', parseError);
        return { success: false, error: 'Invalid response format' };
      }
    } catch (error) {
      console.error('Failed to update Google Sheets athlete:', error);
      throw error;
    }
  }

  // Helper function to sync tournament data to Google Sheets
  async function syncTournamentToGoogleSheets(action: string, data: any) {
    try {
      console.log(`Syncing tournament data to Google Sheets: ${action}`);

      const postData = new URLSearchParams({
        action: action,
        ...data
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(GOOGLE_SHEETS_CONFIG.MANAGEMENT_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: postData.toString(),
        signal: controller.signal,
        redirect: 'follow'
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const responseText = await response.text();
        console.error(`Google Sheets tournament sync error: ${responseText}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      console.log(`Google Sheets tournament sync response: ${responseText}`);

      try {
        const result = JSON.parse(responseText);
        console.log('Google Sheets tournament sync result:', result);
        return result;
      } catch (parseError) {
        console.error('Failed to parse Google Sheets response:', parseError);
        return { success: false, error: 'Invalid response format' };
      }
    } catch (error) {
      console.error('Failed to sync tournament data to Google Sheets:', error);
      throw error;
    }
  }

  // Helper function to sync athlete to Google Sheets daftar_kelompok
  async function syncAthleteToGoogleSheets(groupAthlete: any, athlete: any) {
    try {
      console.log(`Syncing athlete to Google Sheets daftar_kelompok: ${athlete.name}`);

      const position = groupAthlete.position === 'red' ? 'merah' : 
                      groupAthlete.position === 'blue' ? 'biru' : '';

      const postData = new URLSearchParams({
        action: 'addAthleteToGroup',
        id: groupAthlete.id.toString(),
        groupId: groupAthlete.groupId.toString(),
        athleteName: athlete.name || '',
        weight: athlete.weight?.toString() || '0',
        height: athlete.height?.toString() || '0',
        belt: athlete.belt || '',
        age: calculateAge(athlete.birthDate) || '0',
        position: position,
        queueOrder: groupAthlete.queueOrder?.toString() || '1',
        hasMedal: groupAthlete.hasMedal ? 'true' : 'false'
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(GOOGLE_SHEETS_CONFIG.MANAGEMENT_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: postData.toString(),
        signal: controller.signal,
        redirect: 'follow'
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const responseText = await response.text();
        console.error(`Google Sheets athlete sync error: ${responseText}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      console.log(`Google Sheets athlete sync response: ${responseText}`);

      try {
        const result = JSON.parse(responseText);
        console.log('Google Sheets athlete sync result:', result);
        return result;
      } catch (parseError) {
        console.error('Failed to parse Google Sheets response:', parseError);
        return { success: false, error: 'Invalid response format' };
      }
    } catch (error) {
      console.error('Failed to sync athlete to Google Sheets:', error);
      throw error;
    }
  }

  // Helper function to calculate age from birth date
  function calculateAge(birthDate: string): string {
    if (!birthDate) return '0';
    
    try {
      const birth = new Date(birthDate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      
      return age.toString();
    } catch {
      return '0';
    }
  }

  // Dashboard routes
  app.get('/api/dashboard/stats', async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
  });

  app.get('/api/dashboard/active-matches', async (req, res) => {
    try {
      const activeMatches = await storage.getActiveMatches();
      res.json(activeMatches);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch active matches' });
    }
  });

  // Athletes routes
  app.get('/api/athletes', async (req, res) => {
    try {
      // Get modified athletes from local storage (these take priority)
      const localAthletes = await storage.getAllAthletes();
      const localAthleteMap = new Map();
      localAthletes.forEach(athlete => {
        localAthleteMap.set(athlete.id, athlete);
      });

      // First try to get from Google Sheets atlets sheet
      try {
        const data = await fetchFromGoogleSheets(GOOGLE_SHEETS_CONFIG.MANAGEMENT_API, {
          action: 'getAllData'
        });
        
        if (data && data.success && data.data && Array.isArray(data.data) && data.data.length > 1) {
          // Parse the sheet data (skip header row)
          const athletes = data.data.slice(1).map((row: any[], index: number) => {
            const athleteId = index + 1;
            
            // If athlete has been modified locally, use local data
            if (localAthleteMap.has(athleteId)) {
              const localAthlete = localAthleteMap.get(athleteId);
              localAthleteMap.delete(athleteId); // Remove to avoid duplicates
              return localAthlete;
            }
            
            // Ensure we have enough columns for Google Sheets data
            if (row.length < 13) {
              while (row.length < 13) {
                row.push('');
              }
            }
            
            try {
              return {
                id: athleteId, // Use row index as ID
                name: row[1] || '', // Nama Lengkap
                gender: row[2] || '', // Gender
                birthDate: row[3] || '', // Tanggal Lahir
                dojang: row[4] || '', // Dojang
                belt: row[5] || '', // Sabuk
                weight: parseFloat(row[6]) || 0, // Berat Badan
                height: parseFloat(row[7]) || 0, // Tinggi Badan
                category: row[8] || '', // Kategori
                class: row[9] || '', // Kelas
                isPresent: row[10] === 'TRUE' || row[10] === true || row[10] === 'true', // Hadir
                status: row[11] || 'available', // Status
                createdAt: row[12] ? String(row[12]) : new Date().toISOString() // Waktu Input sebagai string
              };
            } catch (parseError) {
              console.error('Error parsing athlete row:', row, parseError);
              return null;
            }
          }).filter(athlete => athlete !== null && athlete.name && athlete.name.trim() !== '');
          
          // Add any remaining local athletes that weren't in Google Sheets (newly created)
          localAthleteMap.forEach(athlete => {
            athletes.push(athlete);
          });
          
          return res.json(athletes);
        }
      } catch (sheetsError) {
        console.warn('Failed to fetch from Google Sheets, falling back to local storage:', sheetsError);
      }
      
      // Fallback to local storage only
      res.json(localAthletes);
    } catch (error) {
      console.error('Error fetching athletes:', error);
      res.status(500).json({ error: 'Failed to fetch athletes' });
    }
  });

  app.get('/api/athletes/sync', async (req, res) => {
    try {
      const competitionId = req.query.competitionId as string;
      
      // Fetch from Google Sheets API
      const data = await fetchFromGoogleSheets(GOOGLE_SHEETS_CONFIG.ATHLETES_API, {
        action: 'getAthletes',
        ...(competitionId && { competitionId })
      });
      
      // Sync athletes to local storage
      const syncedAthletes = [];
      if (data && Array.isArray(data)) {
        for (const googleAthlete of data) {
          try {
            const athlete = {
              nama_lengkap: googleAthlete.nama_lengkap || '',
              gender: googleAthlete.gender || '',
              dojang: googleAthlete.dojang || '',
              sabuk: googleAthlete.sabuk || '',
              berat_badan: parseInt(googleAthlete.berat_badan) || 0,
              tinggi_badan: parseInt(googleAthlete.tinggi_badan) || 0,
              kategori: googleAthlete.kategori || '',
              isPresent: false,
              status: 'available',
              competitionId: competitionId || ''
            };
            
            const validatedAthlete = insertAthleteSchema.parse(athlete);
            const created = await storage.createAthlete(validatedAthlete);
            syncedAthletes.push(created);
          } catch (validationError) {
            console.warn('Skipping invalid athlete data:', googleAthlete, validationError);
          }
        }
      }
      
      broadcast({ type: 'athletes_synced', data: syncedAthletes });
      res.json({ success: true, count: syncedAthletes.length, athletes: syncedAthletes });
    } catch (error) {
      console.error('Sync error:', error);
      res.status(500).json({ error: 'Failed to sync athletes from Google Sheets' });
    }
  });

  app.post('/api/athletes', async (req, res) => {
    try {
      const validatedData = insertAthleteSchema.parse(req.body);
      const athlete = await storage.createAthlete(validatedData);
      
      // Clear cache to force fresh data on next fetch
      dataCache.clear();
      
      broadcast({ type: 'athlete_created', data: athlete });
      res.json(athlete);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid athlete data', details: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to create athlete' });
      }
    }
  });

  app.put('/api/athletes/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertAthleteSchema.partial().parse(req.body);
      
      // First check if athlete exists in local storage
      let athlete = await storage.getAthleteById(id);
      
      if (!athlete) {
        // If not found, try to sync from Google Sheets first
        try {
          const data = await fetchFromGoogleSheets(GOOGLE_SHEETS_CONFIG.MANAGEMENT_API, {
            action: 'getAllData'
          });
          
          if (data && data.success && data.data && Array.isArray(data.data) && data.data.length > 1) {
            // Find the athlete in Google Sheets data - data[0] is header, data[1] is first athlete (ID 1)
            const athleteRow = data.data[id]; // Direct index access since Google Sheets data uses 1-based indexing
            if (athleteRow && athleteRow.length > 0) {
              // Create the athlete in local storage with original data
              const athleteData = {
                name: athleteRow[1] || '',
                gender: athleteRow[2] || '',
                birthDate: athleteRow[3] || '',
                dojang: athleteRow[4] || '',
                belt: athleteRow[5] || '',
                weight: parseFloat(athleteRow[6]) || 0,
                height: parseFloat(athleteRow[7]) || 0,
                category: athleteRow[8] || '',
                class: athleteRow[9] || '',
                isPresent: athleteRow[10] === 'TRUE' || athleteRow[10] === true || athleteRow[10] === 'true',
                status: athleteRow[11] || 'available'
              };
              
              athlete = await storage.createAthlete(athleteData);
            }
          }
        } catch (syncError) {
          console.error('Failed to sync athlete from Google Sheets:', syncError);
        }
      }
      
      if (!athlete) {
        return res.status(404).json({ error: 'Athlete not found' });
      }
      
      // Update athlete
      athlete = await storage.updateAthlete(id, validatedData);
      
      // Clear cache to force fresh data on next fetch
      dataCache.clear();
      
      broadcast({ type: 'athlete_updated', data: athlete });
      res.json(athlete);
      
      // Sync to Google Sheets asynchronously (don't wait for it)
      updateGoogleSheetsAthlete(id, athlete).catch(error => {
        console.error('Failed to sync athlete update to Google Sheets:', error);
      });
    } catch (error) {
      console.error('Update athlete error:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid athlete data', details: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to update athlete' });
      }
    }
  });

  app.patch('/api/athletes/:id/attendance', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { isPresent } = req.body;
      
      // First check if athlete exists in local storage
      let athlete = await storage.getAthleteById(id);
      
      if (!athlete) {
        // If not found, try to sync from Google Sheets first
        try {
          const data = await fetchFromGoogleSheets(GOOGLE_SHEETS_CONFIG.MANAGEMENT_API, {
            action: 'getAllData'
          });
          
          if (data && data.success && data.data && Array.isArray(data.data) && data.data.length > 1) {
            // Find the athlete in Google Sheets data - data[0] is header, data[1] is first athlete (ID 1)
            const athleteRow = data.data[id]; // Direct index access since Google Sheets data uses 1-based indexing
            if (athleteRow && athleteRow.length > 0) {
              // Create the athlete in local storage with original data
              const athleteData = {
                name: athleteRow[1] || '',
                gender: athleteRow[2] || '',
                birthDate: athleteRow[3] || '',
                dojang: athleteRow[4] || '',
                belt: athleteRow[5] || '',
                weight: parseFloat(athleteRow[6]) || 0,
                height: parseFloat(athleteRow[7]) || 0,
                category: athleteRow[8] || '',
                class: athleteRow[9] || '',
                isPresent: athleteRow[10] === 'TRUE' || athleteRow[10] === true || athleteRow[10] === 'true',
                status: athleteRow[11] || 'available'
              };
              
              athlete = await storage.createAthlete(athleteData);
            }
          }
        } catch (syncError) {
          console.error('Failed to sync athlete from Google Sheets:', syncError);
        }
      }
      
      if (!athlete) {
        return res.status(404).json({ error: 'Athlete not found' });
      }
      
      // Update attendance locally first for fast response
      athlete = await storage.updateAthleteAttendance(id, isPresent);
      
      // Send immediate response
      broadcast({ type: 'athlete_attendance_updated', data: athlete });
      res.json(athlete);
      
      // Sync to Google Sheets asynchronously (don't wait for it)
      updateGoogleSheetsAttendance(id, isPresent).catch(error => {
        console.error('Failed to sync attendance to Google Sheets:', error);
      });
      
      // Clear cache to force fresh data on next fetch
      dataCache.clear();
      
    } catch (error) {
      console.error('Attendance update error:', error);
      res.status(500).json({ error: 'Failed to update athlete attendance' });
    }
  });

  app.delete('/api/athletes/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteAthlete(id);
      broadcast({ type: 'athlete_deleted', data: { id } });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete athlete' });
    }
  });

  app.patch('/api/athletes/:id/status', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, ring } = req.body;
      
      const athlete = await storage.updateAthleteStatus(id, status, ring);
      broadcast({ type: 'athlete_status_updated', data: athlete });
      res.json(athlete);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update athlete status' });
    }
  });

  // Categories routes
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  });

  app.post('/api/categories', async (req, res) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      broadcast({ type: 'category_created', data: category });
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid category data', details: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to create category' });
      }
    }
  });

  app.get('/api/categories/:id/groups', async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      const groups = await storage.getGroupsByCategory(categoryId);
      res.json(groups);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch groups' });
    }
  });

  // Tournament Bracket API Routes
  // Main Categories (Kategori_utama)
  app.get('/api/tournament/main-categories', async (req, res) => {
    try {
      // Clear cache and fetch fresh data from Google Sheets
      dataCache.clear();
      
      // Always sync from Google Sheets to get the latest data
      try {
        await storage.syncMainCategoriesFromGoogleSheets();
      } catch (syncError) {
        console.warn('Failed to sync main categories from Google Sheets:', syncError);
      }
      
      const categories = await storage.getAllMainCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch main categories' });
    }
  });

  app.post('/api/tournament/main-categories', async (req, res) => {
    try {
      const validatedData = insertMainCategorySchema.parse(req.body);
      const category = await storage.createMainCategory(validatedData);
      
      // Clear cache to force fresh data on next fetch
      dataCache.clear();
      
      broadcast({ type: 'main_category_created', data: category });
      res.json(category);
      
      // Sync to Google Sheets asynchronously
      syncTournamentToGoogleSheets('createMainCategory', {
        id: category.id.toString(),
        name: category.name
      }).catch(error => {
        console.error('Failed to sync main category to Google Sheets:', error);
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid main category data', details: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to create main category' });
      }
    }
  });

  app.put('/api/tournament/main-categories/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertMainCategorySchema.partial().parse(req.body);
      const category = await storage.updateMainCategory(id, validatedData);
      
      // Clear cache to force fresh data on next fetch
      dataCache.clear();
      
      broadcast({ type: 'main_category_updated', data: category });
      res.json(category);
      
      // Sync to Google Sheets asynchronously
      syncTournamentToGoogleSheets('updateMainCategory', {
        id: category.id.toString(),
        name: category.name
      }).catch(error => {
        console.error('Failed to sync main category update to Google Sheets:', error);
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid main category data', details: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to update main category' });
      }
    }
  });

  app.delete('/api/tournament/main-categories/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteMainCategory(id);
      
      // Clear cache to force fresh data on next fetch
      dataCache.clear();
      
      broadcast({ type: 'main_category_deleted', data: { id } });
      res.json({ success: true });
      
      // Sync to Google Sheets asynchronously
      syncTournamentToGoogleSheets('deleteMainCategory', {
        id: id.toString()
      }).catch(error => {
        console.error('Failed to sync main category deletion to Google Sheets:', error);
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete main category' });
    }
  });

  // Sub Categories (SubKategori)
  app.get('/api/tournament/main-categories/:id/sub-categories', async (req, res) => {
    try {
      const mainCategoryId = parseInt(req.params.id);
      
      // Clear cache and fetch fresh data from Google Sheets
      dataCache.clear();
      
      // Always sync from Google Sheets to get the latest data
      try {
        await storage.syncSubCategoriesFromGoogleSheets(mainCategoryId);
      } catch (syncError) {
        console.warn('Failed to sync sub categories from Google Sheets:', syncError);
      }
      
      const subCategories = await storage.getSubCategoriesByMainCategory(mainCategoryId);
      res.json(subCategories);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch sub categories' });
    }
  });

  app.post('/api/tournament/sub-categories', async (req, res) => {
    try {
      const validatedData = insertSubCategorySchema.parse(req.body);
      const subCategory = await storage.createSubCategory(validatedData);
      
      // Clear cache to force fresh data on next fetch
      dataCache.clear();
      
      broadcast({ type: 'sub_category_created', data: subCategory });
      res.json(subCategory);
      
      // Sync to Google Sheets asynchronously
      syncTournamentToGoogleSheets('createSubCategory', {
        id: subCategory.id.toString(),
        mainCategoryId: subCategory.mainCategoryId.toString(),
        order: subCategory.order.toString(),
        name: subCategory.name
      }).catch(error => {
        console.error('Failed to sync sub category to Google Sheets:', error);
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid sub category data', details: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to create sub category' });
      }
    }
  });

  app.put('/api/tournament/sub-categories/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertSubCategorySchema.partial().parse(req.body);
      const subCategory = await storage.updateSubCategory(id, validatedData);
      
      // Clear cache to force fresh data on next fetch
      dataCache.clear();
      
      broadcast({ type: 'sub_category_updated', data: subCategory });
      res.json(subCategory);
      
      // Sync to Google Sheets asynchronously
      syncTournamentToGoogleSheets('updateSubCategory', {
        id: subCategory.id.toString(),
        mainCategoryId: subCategory.mainCategoryId.toString(),
        order: subCategory.order.toString(),
        name: subCategory.name
      }).catch(error => {
        console.error('Failed to sync sub category update to Google Sheets:', error);
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid sub category data', details: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to update sub category' });
      }
    }
  });

  app.delete('/api/tournament/sub-categories/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSubCategory(id);
      
      // Clear cache to force fresh data on next fetch
      dataCache.clear();
      
      broadcast({ type: 'sub_category_deleted', data: { id } });
      res.json({ success: true });
      
      // Sync to Google Sheets asynchronously
      syncTournamentToGoogleSheets('deleteSubCategory', {
        id: id.toString()
      }).catch(error => {
        console.error('Failed to sync sub category deletion to Google Sheets:', error);
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete sub category' });
    }
  });

  // Athlete Groups (Kelompok_Atlet)
  app.get('/api/tournament/sub-categories/:id/athlete-groups', async (req, res) => {
    try {
      const subCategoryId = parseInt(req.params.id);
      
      // First try to sync from Google Sheets to get latest data
      try {
        await storage.syncAthleteGroupsFromGoogleSheets(subCategoryId);
      } catch (syncError) {
        console.warn('Failed to sync athlete groups from Google Sheets:', syncError);
      }
      
      const athleteGroups = await storage.getAthleteGroupsBySubCategory(subCategoryId);
      res.json(athleteGroups);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch athlete groups' });
    }
  });

  app.post('/api/tournament/athlete-groups', async (req, res) => {
    try {
      const validatedData = insertAthleteGroupSchema.parse(req.body);
      const athleteGroup = await storage.createAthleteGroup(validatedData);
      broadcast({ type: 'athlete_group_created', data: athleteGroup });
      res.json(athleteGroup);
      
      // Sync to Google Sheets asynchronously
      syncTournamentToGoogleSheets('createAthleteGroup', {
        id: athleteGroup.id.toString(),
        subCategoryId: athleteGroup.subCategoryId.toString(),
        name: athleteGroup.name,
        description: athleteGroup.description || '',
        matchNumber: athleteGroup.matchNumber?.toString() || '1'
      }).catch(error => {
        console.error('Failed to sync athlete group to Google Sheets:', error);
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid athlete group data', details: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to create athlete group' });
      }
    }
  });

  app.put('/api/tournament/athlete-groups/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertAthleteGroupSchema.partial().parse(req.body);
      const athleteGroup = await storage.updateAthleteGroup(id, validatedData);
      broadcast({ type: 'athlete_group_updated', data: athleteGroup });
      res.json(athleteGroup);
      
      // Sync update to Google Sheets asynchronously
      syncTournamentToGoogleSheets('updateAthleteGroup', {
        id: id.toString(),
        name: athleteGroup.name,
        description: athleteGroup.description || '',
        matchNumber: athleteGroup.matchNumber?.toString() || '1'
      }).catch(error => {
        console.error('Failed to sync athlete group update to Google Sheets:', error);
      });
      
      // Clear cache to force fresh data on next fetch
      dataCache.clear();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid athlete group data', details: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to update athlete group' });
      }
    }
  });

  app.delete('/api/tournament/athlete-groups/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteAthleteGroup(id);
      broadcast({ type: 'athlete_group_deleted', data: { id } });
      res.json({ success: true });
      
      // Sync delete to Google Sheets asynchronously
      syncTournamentToGoogleSheets('deleteAthleteGroup', {
        id: id.toString()
      }).catch(error => {
        console.error('Failed to sync athlete group deletion to Google Sheets:', error);
      });
      
      // Clear cache to force fresh data on next fetch
      dataCache.clear();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete athlete group' });
    }
  });

  // Group Athletes (daftar_kelompok)
  app.get('/api/tournament/athlete-groups/:id/athletes', async (req, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const groupAthletes = await storage.getGroupAthletesByGroup(groupId);
      res.json(groupAthletes);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch group athletes' });
    }
  });

  app.post('/api/tournament/athlete-groups/:id/athletes', async (req, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const validatedData = insertGroupAthleteSchema.parse({
        ...req.body,
        groupId
      });
      const groupAthlete = await storage.addAthleteToGroup(validatedData);
      broadcast({ type: 'group_athlete_added', data: groupAthlete });
      res.json(groupAthlete);
      
      // Sync to Google Sheets asynchronously
      console.log('About to sync athlete to Google Sheets for groupAthlete:', groupAthlete);
      const athlete = await storage.getAthleteById(groupAthlete.athleteId);
      console.log('Found athlete for sync:', athlete);
      if (athlete) {
        console.log('Triggering sync to Google Sheets...');
        syncAthleteToGoogleSheets(groupAthlete, athlete).catch(error => {
          console.error('Failed to sync athlete to Google Sheets:', error);
        });
      } else {
        console.log('No athlete found with ID:', groupAthlete.athleteId);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid group athlete data', details: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to add athlete to group' });
      }
    }
  });

  app.delete('/api/tournament/athlete-groups/:groupId/athletes/:athleteId', async (req, res) => {
    try {
      const groupId = parseInt(req.params.groupId);
      const athleteId = parseInt(req.params.athleteId);
      await storage.removeAthleteFromGroup(groupId, athleteId);
      broadcast({ type: 'group_athlete_removed', data: { groupId, athleteId } });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to remove athlete from group' });
    }
  });

  app.patch('/api/tournament/athlete-groups/:groupId/athletes/:athleteId/position', async (req, res) => {
    try {
      const groupId = parseInt(req.params.groupId);
      const athleteId = parseInt(req.params.athleteId);
      const { position, queueOrder } = req.body;
      
      const groupAthlete = await storage.updateAthletePosition(groupId, athleteId, position, queueOrder);
      broadcast({ type: 'athlete_position_updated', data: groupAthlete });
      res.json(groupAthlete);
      
      // Sync position update to Google Sheets asynchronously
      const positionMB = position === 'red' ? 'merah' : 
                        position === 'blue' ? 'biru' : position;
      
      syncTournamentToGoogleSheets('updateAthleteInGroup', {
        id: groupAthlete.id.toString(),
        position: positionMB,
        queueOrder: queueOrder?.toString() || groupAthlete.queueOrder?.toString() || '1'
      }).catch(error => {
        console.error('Failed to sync position update to Google Sheets:', error);
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update athlete position' });
    }
  });

  app.patch('/api/tournament/athlete-groups/:groupId/athletes/:athleteId/eliminate', async (req, res) => {
    try {
      const groupId = parseInt(req.params.groupId);
      const athleteId = parseInt(req.params.athleteId);
      
      const groupAthlete = await storage.eliminateAthlete(groupId, athleteId);
      broadcast({ type: 'athlete_eliminated', data: groupAthlete });
      res.json(groupAthlete);
    } catch (error) {
      res.status(500).json({ error: 'Failed to eliminate athlete' });
    }
  });

  app.patch('/api/tournament/athlete-groups/:groupId/athletes/:athleteId/medal', async (req, res) => {
    try {
      const groupId = parseInt(req.params.groupId);
      const athleteId = parseInt(req.params.athleteId);
      const { hasMedal } = req.body;
      
      const groupAthlete = await storage.updateAthleteMedal(groupId, athleteId, hasMedal);
      broadcast({ type: 'athlete_medal_updated', data: groupAthlete });
      res.json(groupAthlete);
      
      // Sync medal update to Google Sheets asynchronously
      syncTournamentToGoogleSheets('updateAthleteInGroup', {
        id: groupAthlete.id.toString(),
        hasMedal: hasMedal ? 'true' : 'false'
      }).catch(error => {
        console.error('Failed to sync medal update to Google Sheets:', error);
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update athlete medal status' });
    }
  });

  // Matches routes
  app.get('/api/matches', async (req, res) => {
    try {
      const matches = await storage.getAllMatches();
      res.json(matches);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch matches' });
    }
  });

  app.post('/api/matches', async (req, res) => {
    try {
      const validatedData = insertMatchSchema.parse(req.body);
      const match = await storage.createMatch(validatedData);
      
      // Update athlete statuses to competing
      if (match.redCornerAthleteId) {
        await storage.updateAthleteStatus(match.redCornerAthleteId, 'competing', match.ring || undefined);
      }
      if (match.blueCornerAthleteId) {
        await storage.updateAthleteStatus(match.blueCornerAthleteId, 'competing', match.ring || undefined);
      }
      
      broadcast({ type: 'match_created', data: match });
      res.json(match);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid match data', details: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to create match' });
      }
    }
  });

  app.patch('/api/matches/:id/winner', async (req, res) => {
    try {
      const matchId = parseInt(req.params.id);
      const { winnerId } = req.body;
      
      if (!winnerId) {
        return res.status(400).json({ error: 'winnerId is required' });
      }
      
      const match = await storage.declareWinner(matchId, winnerId);
      broadcast({ type: 'winner_declared', data: match });
      res.json(match);
    } catch (error) {
      res.status(500).json({ error: 'Failed to declare winner' });
    }
  });

  // Anti-clash routes
  app.get('/api/anti-clash/competing', async (req, res) => {
    try {
      const competing = await storage.getCompetingAthletes();
      res.json(competing);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch competing athletes' });
    }
  });

  app.get('/api/anti-clash/available', async (req, res) => {
    try {
      const available = await storage.getAvailableAthletes();
      res.json(available);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch available athletes' });
    }
  });

  // Tournament results routes
  app.get('/api/results', async (req, res) => {
    try {
      const results = await storage.getTournamentResults();
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch tournament results' });
    }
  });

  // Export routes
  app.get('/api/export/athletes', async (req, res) => {
    try {
      const format = req.query.format as string;
      const athletes = await storage.getAllAthletes();
      
      if (format === 'excel') {
        // TODO: Implement Excel export
        res.json({ message: 'Excel export not yet implemented', data: athletes });
      } else if (format === 'pdf') {
        // TODO: Implement PDF export
        res.json({ message: 'PDF export not yet implemented', data: athletes });
      } else {
        res.json(athletes);
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to export athletes' });
    }
  });

  app.get('/api/export/results', async (req, res) => {
    try {
      const format = req.query.format as string;
      const results = await storage.getTournamentResults();
      
      if (format === 'excel') {
        // TODO: Implement Excel export
        res.json({ message: 'Excel export not yet implemented', data: results });
      } else if (format === 'pdf') {
        // TODO: Implement PDF export
        res.json({ message: 'PDF export not yet implemented', data: results });
      } else {
        res.json(results);
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to export results' });
    }
  });

  // Google Sheets competition and athlete management routes
  app.get('/api/google-sheets/competitions', async (req, res) => {
    try {
      const competitions = await storage.getCompetitionsFromGoogleSheets();
      res.json(competitions);
    } catch (error) {
      console.error('Error fetching competitions:', error);
      res.status(500).json({ error: 'Failed to fetch competitions from Google Sheets' });
    }
  });

  app.get('/api/google-sheets/athletes/:competitionId', async (req, res) => {
    try {
      const { competitionId } = req.params;
      const athletes = await storage.getAthletesFromCompetition(competitionId);
      res.json(athletes);
    } catch (error) {
      console.error('Error fetching athletes:', error);
      res.status(500).json({ error: 'Failed to fetch athletes from Google Sheets' });
    }
  });

  app.post('/api/google-sheets/transfer-athletes', async (req, res) => {
    try {
      const { athletes } = req.body;
      
      if (!athletes || !Array.isArray(athletes)) {
        return res.status(400).json({ error: 'Athletes array is required' });
      }

      await storage.transferAthletesToManagement(athletes);
      broadcast({ type: 'athletes_transferred', data: { count: athletes.length } });
      
      res.json({ 
        message: 'Athletes transferred successfully', 
        count: athletes.length 
      });
    } catch (error) {
      console.error('Error transferring athletes:', error);
      res.status(500).json({ error: 'Failed to transfer athletes to management spreadsheet' });
    }
  });

  // Google Sheets integration routes
  app.post('/api/sheets/sync', async (req, res) => {
    try {
      const { data, action } = req.body;
      
      // Send data to Google Sheets management API
      const response = await fetch(GOOGLE_SHEETS_CONFIG.MANAGEMENT_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          data
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      broadcast({ type: 'sheets_sync_complete', data: result });
      
      res.json(result);
    } catch (error) {
      console.error('Error syncing with Google Sheets:', error);
      res.status(500).json({ error: 'Failed to sync with Google Sheets' });
    }
  });

  // Real-time data endpoint untuk polling
  app.get('/api/realtime/athletes', async (req, res) => {
    try {
      const athletes = await storage.getAllAthletes();
      res.json({
        timestamp: Date.now(),
        athletes
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch real-time athletes data' });
    }
  });

  // Endpoint untuk force refresh cache
  app.post('/api/cache/clear', async (req, res) => {
    try {
      dataCache.clear();
      res.json({ message: 'Cache cleared successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to clear cache' });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      connections: clients.size,
      cacheSize: dataCache.size
    });
  });

  return httpServer;
}
