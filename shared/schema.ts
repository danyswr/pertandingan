import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Athletes table
export const athletes = pgTable("athletes", {
  id: serial("id").primaryKey(),
  nama_lengkap: text("nama_lengkap").notNull(),
  gender: varchar("gender", { length: 10 }).notNull(),
  dojang: text("dojang").notNull(),
  sabuk: text("sabuk").notNull(),
  berat_badan: integer("berat_badan").notNull(),
  tinggi_badan: integer("tinggi_badan").notNull(),
  kategori: text("kategori").notNull(),
  isPresent: boolean("is_present").default(false),
  status: varchar("status", { length: 20 }).default("available"), // available, competing, eliminated
  competitionId: text("competition_id")
});

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: varchar("type", { length: 20 }).notNull(), // kyorugi, poomsae
  gender: varchar("gender", { length: 10 }),
  weightMin: integer("weight_min"),
  weightMax: integer("weight_max"),
  beltLevel: text("belt_level"),
  maxParticipants: integer("max_participants").default(8),
  minParticipants: integer("min_participants").default(4),
  isActive: boolean("is_active").default(true)
});

// Groups table for category subdivisions
export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").references(() => categories.id),
  name: text("name").notNull(),
  maxSize: integer("max_size").default(8),
  currentSize: integer("current_size").default(0),
  status: varchar("status", { length: 20 }).default("pending") // pending, active, completed
});

// Group members table
export const groupMembers = pgTable("group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => groups.id),
  athleteId: integer("athlete_id").references(() => athletes.id),
  position: integer("position"),
  isEliminated: boolean("is_eliminated").default(false)
});

// Matches table
export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => groups.id),
  redCornerAthleteId: integer("red_corner_athlete_id").references(() => athletes.id),
  blueCornerAthleteId: integer("blue_corner_athlete_id").references(() => athletes.id),
  winnerId: integer("winner_id").references(() => athletes.id),
  ring: varchar("ring", { length: 10 }),
  round: integer("round").default(1),
  status: varchar("status", { length: 20 }).default("pending"), // pending, active, completed
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  matchType: varchar("match_type", { length: 20 }).default("elimination") // elimination, final, semi-final
});

// Tournament results table
export const tournamentResults = pgTable("tournament_results", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").references(() => categories.id),
  firstPlace: integer("first_place").references(() => athletes.id),
  secondPlace: integer("second_place").references(() => athletes.id),
  thirdPlace1: integer("third_place_1").references(() => athletes.id),
  thirdPlace2: integer("third_place_2").references(() => athletes.id),
  completedAt: timestamp("completed_at").defaultNow()
});

// Real-time status tracking
export const athleteStatus = pgTable("athlete_status", {
  id: serial("id").primaryKey(),
  athleteId: integer("athlete_id").references(() => athletes.id),
  status: varchar("status", { length: 20 }).notNull(), // available, competing, break, eliminated
  ringAssignment: varchar("ring_assignment", { length: 10 }),
  lastUpdated: timestamp("last_updated").defaultNow()
});

// Insert schemas
export const insertAthleteSchema = createInsertSchema(athletes).omit({
  id: true
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true
});

export const insertGroupSchema = createInsertSchema(groups).omit({
  id: true
});

export const insertMatchSchema = createInsertSchema(matches).omit({
  id: true
});

export const insertTournamentResultSchema = createInsertSchema(tournamentResults).omit({
  id: true
});

// Types
export type Athlete = typeof athletes.$inferSelect;
export type InsertAthlete = z.infer<typeof insertAthleteSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Group = typeof groups.$inferSelect;
export type InsertGroup = z.infer<typeof insertGroupSchema>;

export type Match = typeof matches.$inferSelect;
export type InsertMatch = z.infer<typeof insertMatchSchema>;

export type TournamentResult = typeof tournamentResults.$inferSelect;
export type InsertTournamentResult = z.infer<typeof insertTournamentResultSchema>;

export type AthleteStatus = typeof athleteStatus.$inferSelect;

// API Response types
export interface DashboardStats {
  totalAthletes: number;
  activeCategories: number;
  activeMatches: number;
  completedMatches: number;
  presentAthletes: number;
  availableAthletes: number;
  competingAthletes: number;
}

export interface ActiveMatch {
  id: number;
  category: string;
  ring: string;
  round: number;
  redCorner: {
    id: number;
    name: string;
    dojang: string;
  };
  blueCorner: {
    id: number;
    name: string;
    dojang: string;
  };
  status: string;
}

export interface GoogleSheetsAthlete {
  rowIndex: number;
  timestamp: string;
  registrationId: string;
  idKejuaraan: string;
  nama: string;
  gender: string;
  sabuk: string;
  tempatTanggalLahir: string;
  dojang: string;
  berat: string;
  tinggi: string;
  kategori: string;
  kelas: string;
  orderJersey: string;
  jerseySize: string;
}

export interface GoogleSheetsCompetition {
  id: string;
  nama: string;
  deskripsi: string;
  poster: string;
  status: number;
}
