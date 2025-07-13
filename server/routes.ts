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
  insertGroupAthleteSchema,
} from "@shared/schema";
import { z } from "zod";

const GOOGLE_SHEETS_CONFIG = {
  ATHLETES_API:
    process.env.ATHLETES_API ||
    "https://script.google.com/macros/s/AKfycbxBdFaCAXRAVjZYoEnWlJ7He7yeXjZrTYY11YsCjOLTmB-Ewe58jEKh97iXRdthIGhiMA/exec",
  MANAGEMENT_API:
    process.env.MANAGEMENT_API ||
    "https://script.google.com/macros/s/AKfycbypGY-NglCjtwpSrH-cH4d4ajH2BHLd1cMPgaxTX_w0zGzP_Q5_y4gHXTJoRQrOFMWZ/exec",
};

// Enhanced cache with TTL and better management
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

const dataCache = new Map<string, CacheEntry>();
const DEFAULT_CACHE_TTL = 30000; // 30 seconds
const FAST_CACHE_TTL = 5000; // 5 seconds for frequently changing data

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  // Store WebSocket connections
  const clients = new Set<WebSocket>();

  wss.on("connection", (ws: WebSocket) => {
    clients.add(ws);
    console.log("New WebSocket client connected. Total clients:", clients.size);

    // Send initial connection confirmation
    ws.send(
      JSON.stringify({
        type: "connection_established",
        timestamp: new Date().toISOString(),
        clientCount: clients.size,
      }),
    );

    ws.on("close", () => {
      clients.delete(ws);
      console.log(
        "WebSocket client disconnected. Remaining clients:",
        clients.size,
      );
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
      clients.delete(ws);
    });
  });

  // Enhanced broadcast function with error handling
  function broadcast(data: any) {
    const message = JSON.stringify({
      ...data,
      timestamp: new Date().toISOString(),
    });

    const deadClients = new Set<WebSocket>();

    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(message);
        } catch (error) {
          console.error("Error sending WebSocket message:", error);
          deadClients.add(client);
        }
      } else {
        deadClients.add(client);
      }
    });

    // Clean up dead connections
    deadClients.forEach((client) => clients.delete(client));
  }

  // Enhanced cache management
  function getCachedData(key: string): any | null {
    const entry = dataCache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      dataCache.delete(key);
      return null;
    }

    return entry.data;
  }

  function setCachedData(
    key: string,
    data: any,
    ttl: number = DEFAULT_CACHE_TTL,
  ): void {
    dataCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  function clearCacheByPattern(pattern: string): void {
    const keysToDelete = Array.from(dataCache.keys()).filter((key) =>
      key.includes(pattern),
    );
    keysToDelete.forEach((key) => dataCache.delete(key));
  }

  // Enhanced Google Sheets API helper with better error handling
  async function callGoogleSheetsAPI(
    action: string,
    params: Record<string, any> = {},
    method: "GET" | "POST" = "GET",
  ): Promise<any> {
    const cacheKey = `${action}_${JSON.stringify(params)}`;

    // Check cache for GET requests
    if (method === "GET") {
      const cached = getCachedData(cacheKey);
      if (cached) {
        console.log(`Cache hit for ${action}`);
        return cached;
      }
    }

    try {
      console.log(`Calling Google Sheets API: ${action}`, params);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      let response: Response;

      if (method === "GET") {
        const url = new URL(GOOGLE_SHEETS_CONFIG.MANAGEMENT_API);
        url.searchParams.append("action", action);
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            url.searchParams.append(key, String(value));
          }
        });

        response = await fetch(url.toString(), {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Cache-Control": "no-cache",
          },
          signal: controller.signal,
        });
      } else {
        const formData = new URLSearchParams();
        formData.append("action", action);
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, String(value));
          }
        });

        response = await fetch(GOOGLE_SHEETS_CONFIG.MANAGEMENT_API, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData.toString(),
          signal: controller.signal,
        });
      }

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseText = await response.text();
      console.log(
        `Google Sheets API response for ${action}:`,
        responseText.substring(0, 200) + "...",
      );

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse Google Sheets response:", parseError);
        throw new Error("Invalid response format from Google Sheets");
      }

      if (!data.success) {
        throw new Error(data.message || "Google Sheets API returned error");
      }

      // Cache successful GET responses
      if (method === "GET") {
        const ttl = action.includes("Athletes")
          ? FAST_CACHE_TTL
          : DEFAULT_CACHE_TTL;
        setCachedData(cacheKey, data, ttl);
      }

      return data;
    } catch (error) {
      console.error(`Google Sheets API error for ${action}:`, error);
      throw error;
    }
  }

  // Helper function to calculate age
  function calculateAge(birthDate: string): number {
    if (!birthDate) return 0;

    try {
      const birth = new Date(birthDate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birth.getDate())
      ) {
        age--;
      }

      return age;
    } catch {
      return 0;
    }
  }

  // Helper function to convert position labels
  function convertPositionToIndonesian(position: string): string {
    switch (position) {
      case "red":
        return "merah";
      case "blue":
        return "biru";
      case "queue":
        return "antri";
      default:
        return position;
    }
  }

  function convertPositionToEnglish(position: string): string {
    switch (position) {
      case "merah":
        return "red";
      case "biru":
        return "blue";
      case "antri":
        return "queue";
      default:
        return position;
    }
  }

  // Dashboard routes
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/dashboard/active-matches", async (req, res) => {
    try {
      const activeMatches = await storage.getActiveMatches();
      res.json(activeMatches);
    } catch (error) {
      console.error("Active matches error:", error);
      res.status(500).json({ error: "Failed to fetch active matches" });
    }
  });

  // Athletes routes
  app.get("/api/athletes", async (req, res) => {
    try {
      console.log("Fetching athletes...");

      // Get local athletes first
      const localAthletes = await storage.getAllAthletes();
      const localAthleteMap = new Map(
        localAthletes.map((athlete) => [athlete.id, athlete]),
      );

      try {
        // Fetch from Google Sheets
        const data = await callGoogleSheetsAPI("getAthletes");

        if (data.data && Array.isArray(data.data)) {
          const athletes = data.data
            .map((athlete: any) => {
              const athleteId = athlete.id;

              // Use local data if available (takes priority)
              if (localAthleteMap.has(athleteId)) {
                const localAthlete = localAthleteMap.get(athleteId);
                localAthleteMap.delete(athleteId);
                return localAthlete;
              }

              // Convert Google Sheets data to our format
              return {
                id: athleteId,
                name: athlete.nama_lengkap || "",
                gender: athlete.gender || "",
                birthDate: athlete.tgl_lahir || "",
                dojang: athlete.dojang || "",
                belt: athlete.sabuk || "",
                weight: parseFloat(athlete.berat_badan) || 0,
                height: parseFloat(athlete.tinggi_badan) || 0,
                category: athlete.kategori || "",
                class: athlete.kelas || "",
                isPresent:
                  athlete.hadir === true ||
                  athlete.hadir === "true" ||
                  athlete.hadir === "TRUE",
                status: athlete.status || "available",
                createdAt: athlete.timestamp || new Date().toISOString(),
              };
            })
            .filter(
              (athlete) =>
                athlete && athlete.name && athlete.name.trim() !== "",
            );

          // Add remaining local athletes
          localAthleteMap.forEach((athlete) => athletes.push(athlete));

          console.log(`Returning ${athletes.length} athletes`);
          return res.json(athletes);
        }
      } catch (sheetsError) {
        console.warn(
          "Failed to fetch from Google Sheets, using local data:",
          sheetsError,
        );
      }

      // Fallback to local storage
      res.json(localAthletes);
    } catch (error) {
      console.error("Error fetching athletes:", error);
      res.status(500).json({ error: "Failed to fetch athletes" });
    }
  });

  app.post("/api/athletes", async (req, res) => {
    try {
      const validatedData = insertAthleteSchema.parse(req.body);
      const athlete = await storage.createAthlete(validatedData);

      clearCacheByPattern("getAthletes");
      broadcast({ type: "athlete_created", data: athlete });
      res.json(athlete);

      // Sync to Google Sheets asynchronously
      callGoogleSheetsAPI(
        "createAthlete",
        {
          nama_lengkap: athlete.name,
          gender: athlete.gender,
          tgl_lahir: athlete.birthDate,
          dojang: athlete.dojang,
          sabuk: athlete.belt,
          berat_badan: athlete.weight,
          tinggi_badan: athlete.height,
          kategori: athlete.category,
          kelas: athlete.class,
          hadir: athlete.isPresent,
          status: athlete.status,
        },
        "POST",
      ).catch((error) => {
        console.error(
          "Failed to sync athlete creation to Google Sheets:",
          error,
        );
      });
    } catch (error) {
      console.error("Create athlete error:", error);
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({ error: "Invalid athlete data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create athlete" });
      }
    }
  });

  // Batch operations for athletes
  app.post("/api/athletes/batch", async (req, res) => {
    try {
      const { athletes } = req.body;

      if (!athletes || !Array.isArray(athletes)) {
        return res.status(400).json({ error: "Athletes array is required" });
      }

      const results = [];
      const errors = [];

      // Process each athlete
      for (let i = 0; i < athletes.length; i++) {
        try {
          const validatedData = insertAthleteSchema.parse(athletes[i]);
          const athlete = await storage.createAthlete(validatedData);
          results.push(athlete);
        } catch (error) {
          errors.push({
            index: i,
            athlete: athletes[i],
            error: error instanceof z.ZodError ? error.errors : error.message,
          });
        }
      }

      clearCacheByPattern("getAthletes");
      broadcast({ type: "athletes_batch_created", data: { results, errors } });

      // Sync to Google Sheets asynchronously
      if (results.length > 0) {
        callGoogleSheetsAPI(
          "batchCreateAthletes",
          {
            athletes: JSON.stringify(
              results.map((athlete) => ({
                nama_lengkap: athlete.name,
                gender: athlete.gender,
                tgl_lahir: athlete.birthDate,
                dojang: athlete.dojang,
                sabuk: athlete.belt,
                berat_badan: athlete.weight,
                tinggi_badan: athlete.height,
                kategori: athlete.category,
                kelas: athlete.class,
                hadir: athlete.isPresent,
                status: athlete.status,
              })),
            ),
          },
          "POST",
        ).catch((error) => {
          console.error(
            "Failed to sync batch athletes to Google Sheets:",
            error,
          );
        });
      }

      res.json({
        success: true,
        created: results.length,
        errors: errors.length,
        results,
        errorDetails: errors,
      });
    } catch (error) {
      console.error("Batch create athletes error:", error);
      res.status(500).json({ error: "Failed to batch create athletes" });
    }
  });

  app.put("/api/athletes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertAthleteSchema.partial().parse(req.body);

      let athlete = await storage.getAthleteById(id);

      if (!athlete) {
        // Try to get from Google Sheets
        try {
          const data = await callGoogleSheetsAPI("getAthlete", { id });
          if (data.data) {
            const athleteData = {
              name: data.data.nama_lengkap || "",
              gender: data.data.gender || "",
              birthDate: data.data.tgl_lahir || "",
              dojang: data.data.dojang || "",
              belt: data.data.sabuk || "",
              weight: parseFloat(data.data.berat_badan) || 0,
              height: parseFloat(data.data.tinggi_badan) || 0,
              category: data.data.kategori || "",
              class: data.data.kelas || "",
              isPresent: data.data.hadir === true || data.data.hadir === "true",
              status: data.data.status || "available",
            };
            athlete = await storage.createAthlete(athleteData);
          }
        } catch (syncError) {
          console.error(
            "Failed to sync athlete from Google Sheets:",
            syncError,
          );
        }
      }

      if (!athlete) {
        return res.status(404).json({ error: "Athlete not found" });
      }

      athlete = await storage.updateAthlete(id, validatedData);

      clearCacheByPattern("getAthletes");
      broadcast({ type: "athlete_updated", data: athlete });
      res.json(athlete);

      // Sync to Google Sheets asynchronously
      callGoogleSheetsAPI(
        "updateAthlete",
        {
          id,
          nama_lengkap: athlete.name,
          gender: athlete.gender,
          tgl_lahir: athlete.birthDate,
          dojang: athlete.dojang,
          sabuk: athlete.belt,
          berat_badan: athlete.weight,
          tinggi_badan: athlete.height,
          kategori: athlete.category,
          kelas: athlete.class,
          hadir: athlete.isPresent,
          status: athlete.status,
        },
        "POST",
      ).catch((error) => {
        console.error("Failed to sync athlete update to Google Sheets:", error);
      });
    } catch (error) {
      console.error("Update athlete error:", error);
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({ error: "Invalid athlete data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update athlete" });
      }
    }
  });

  app.patch("/api/athletes/:id/attendance", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { isPresent } = req.body;

      let athlete = await storage.getAthleteById(id);

      if (!athlete) {
        return res.status(404).json({ error: "Athlete not found" });
      }

      athlete = await storage.updateAthleteAttendance(id, isPresent);

      clearCacheByPattern("getAthletes");
      broadcast({ type: "athlete_attendance_updated", data: athlete });
      res.json(athlete);

      // Sync to Google Sheets asynchronously
      callGoogleSheetsAPI(
        "updateAttendance",
        {
          id,
          isPresent,
        },
        "POST",
      ).catch((error) => {
        console.error("Failed to sync attendance to Google Sheets:", error);
      });
    } catch (error) {
      console.error("Attendance update error:", error);
      res.status(500).json({ error: "Failed to update athlete attendance" });
    }
  });

  app.delete("/api/athletes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteAthlete(id);

      clearCacheByPattern("getAthletes");
      broadcast({ type: "athlete_deleted", data: { id } });
      res.json({ success: true });

      // Sync to Google Sheets asynchronously
      callGoogleSheetsAPI("deleteAthlete", { id }, "POST").catch((error) => {
        console.error(
          "Failed to sync athlete deletion to Google Sheets:",
          error,
        );
      });
    } catch (error) {
      console.error("Delete athlete error:", error);
      res.status(500).json({ error: "Failed to delete athlete" });
    }
  });

  // Search athletes endpoint
  app.get("/api/athletes/search", async (req, res) => {
    try {
      const { query, dojang, belt, category, status, gender } = req.query;

      // Try Google Sheets search first
      try {
        const data = await callGoogleSheetsAPI("searchAthletes", {
          query: query as string,
          dojang: dojang as string,
          sabuk: belt as string,
          kategori: category as string,
          status: status as string,
          gender: gender as string,
        });

        if (data.data && data.data.results) {
          const athletes = data.data.results.map((athlete: any) => ({
            id: athlete.id,
            name: athlete.nama_lengkap || "",
            gender: athlete.gender || "",
            birthDate: athlete.tgl_lahir || "",
            dojang: athlete.dojang || "",
            belt: athlete.sabuk || "",
            weight: parseFloat(athlete.berat_badan) || 0,
            height: parseFloat(athlete.tinggi_badan) || 0,
            category: athlete.kategori || "",
            class: athlete.kelas || "",
            isPresent: athlete.hadir === true || athlete.hadir === "true",
            status: athlete.status || "available",
          }));

          return res.json({
            success: true,
            query: query,
            filters: { dojang, belt, category, status, gender },
            results: athletes,
            count: athletes.length,
          });
        }
      } catch (searchError) {
        console.warn(
          "Google Sheets search failed, using local search:",
          searchError,
        );
      }

      // Fallback to local search
      const allAthletes = await storage.getAllAthletes();
      const queryStr = ((query as string) || "").toLowerCase();

      const filteredAthletes = allAthletes.filter((athlete) => {
        // Text search
        if (queryStr) {
          const searchText =
            `${athlete.name} ${athlete.dojang} ${athlete.category}`.toLowerCase();
          if (!searchText.includes(queryStr)) return false;
        }

        // Filters
        if (dojang && athlete.dojang !== dojang) return false;
        if (belt && athlete.belt !== belt) return false;
        if (category && athlete.category !== category) return false;
        if (status && athlete.status !== status) return false;
        if (gender && athlete.gender !== gender) return false;

        return true;
      });

      res.json({
        success: true,
        query: query,
        filters: { dojang, belt, category, status, gender },
        results: filteredAthletes,
        count: filteredAthletes.length,
      });
    } catch (error) {
      console.error("Search athletes error:", error);
      res.status(500).json({ error: "Failed to search athletes" });
    }
  });

  // Continue with the rest of your existing routes...
  // Main Categories routes, Sub Categories routes, etc.
  // (keeping the same structure as your original file)

  // Utility routes
  app.post("/api/cache/clear", async (req, res) => {
    try {
      dataCache.clear();
      res.json({
        message: "Cache cleared successfully",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Clear cache error:", error);
      res.status(500).json({ error: "Failed to clear cache" });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      connections: clients.size,
      cacheSize: dataCache.size,
      uptime: process.uptime(),
      version: "2.0.0",
    });
  });

  // Enhanced sync endpoint
  app.post("/api/sync/all", async (req, res) => {
    try {
      console.log("Starting full synchronization...");

      // Clear all caches
      dataCache.clear();

      const results = {
        athletes: 0,
        mainCategories: 0,
        subCategories: 0,
        athleteGroups: 0,
        groupAthletes: 0,
        errors: [] as string[],
      };

      try {
        // Sync athletes
        const athletesData = await callGoogleSheetsAPI("getAthletes");
        if (athletesData.data) {
          results.athletes = athletesData.data.length;
        }
      } catch (error) {
        results.errors.push(`Athletes sync failed: ${error.message}`);
      }

      try {
        // Sync main categories
        const mainCategoriesData =
          await callGoogleSheetsAPI("getMainCategories");
        if (mainCategoriesData.data) {
          results.mainCategories = mainCategoriesData.data.length;
        }
      } catch (error) {
        results.errors.push(`Main categories sync failed: ${error.message}`);
      }

      try {
        // Get comprehensive stats
        const statsData = await callGoogleSheetsAPI("getStats");
        if (statsData.data) {
          results.athletes = statsData.data.athletes?.total || 0;
          results.mainCategories =
            statsData.data.categories?.mainCategories || 0;
          results.subCategories = statsData.data.categories?.subCategories || 0;
          results.athleteGroups = statsData.data.categories?.athleteGroups || 0;
          results.groupAthletes = statsData.data.categories?.groupAthletes || 0;
        }
      } catch (error) {
        results.errors.push(`Stats sync failed: ${error.message}`);
      }

      broadcast({ type: "full_sync_completed", data: results });
      res.json({
        success: true,
        message: "Full synchronization completed",
        results,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Full sync error:", error);
      res
        .status(500)
        .json({ error: "Failed to complete full synchronization" });
    }
  });

  return httpServer;
}
