import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertAthleteSchema, insertCategorySchema, insertMatchSchema } from "@shared/schema";
import { z } from "zod";

const GOOGLE_SHEETS_CONFIG = {
  ATHLETES_API: process.env.ATHLETES_API || 'https://script.google.com/macros/s/AKfycbxBdFaCAXRAVjZYoEnWlJ7He7yeXjZrTYY11YsCjOLTmB-Ewe58jEKh97iXRdthIGhiMA/exec',
  MANAGEMENT_API: process.env.MANAGEMENT_API || 'https://script.google.com/macros/s/AKfycbypGY-NglCjtwpSrH-cH4d4ajH2BHLd1cMPgaxTX_w0zGzP_Q5_y4gHXTJoRQrOFMWZ/exec'
};

// Cache untuk mempercepat pengambilan data
const dataCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_DURATION = 30000; // 30 detik

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
        signal: controller.signal
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
      const athletes = await storage.getAllAthletes();
      res.json(athletes);
    } catch (error) {
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

  app.patch('/api/athletes/:id/attendance', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { isPresent } = req.body;
      
      if (typeof isPresent !== 'boolean') {
        return res.status(400).json({ error: 'isPresent must be a boolean' });
      }
      
      const athlete = await storage.updateAthleteAttendance(id, isPresent);
      broadcast({ type: 'attendance_updated', data: athlete });
      res.json(athlete);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update attendance' });
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
