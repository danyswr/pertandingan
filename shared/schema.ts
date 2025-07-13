import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Athletes table
export const athletes = pgTable("athletes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  gender: varchar("gender", { length: 10 }).notNull(),
  dojang: text("dojang").notNull(),
  belt: text("belt").notNull(),
  weight: integer("weight").notNull(),
  height: integer("height").notNull(),
  category: text("category").notNull(),
  class: text("class"),
  birthDate: text("birth_date"),
  isPresent: boolean("is_present").default(false),
  status: varchar("status", { length: 20 }).default("available"), // available, competing, eliminated
  competitionId: text("competition_id")
});

// Main Categories (Kategori_utama) - Kyorugi, Poomsae, etc.
export const mainCategories = pgTable("main_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g., "Kyorugi", "Poomsae"
  isActive: boolean("is_active").default(true)
});

// Sub Categories (SubKategori) - Divisions within main categories
export const subCategories = pgTable("sub_categories", {
  id: serial("id").primaryKey(),
  mainCategoryId: integer("main_category_id").references(() => mainCategories.id),
  name: text("name").notNull(), // e.g., "Putra Junior", "Putri Senior"
  order: integer("order").notNull(), // For sorting
  isActive: boolean("is_active").default(true)
});

// Athlete Groups (Kelompok_Atlet) - Groups of athletes within sub categories
export const athleteGroups = pgTable("athlete_groups", {
  id: serial("id").primaryKey(),
  subCategoryId: integer("sub_category_id").references(() => subCategories.id),
  name: text("name").notNull(), // e.g., "Grup A", "Grup B"
  description: text("description"),
  matchNumber: integer("match_number").default(1),
  minAthletes: integer("min_athletes").default(2),
  maxAthletes: integer("max_athletes").default(8),
  currentCount: integer("current_count").default(0),
  status: varchar("status", { length: 20 }).default("pending") // pending, active, completed
});

// Group Athletes (daftar_kelompok) - Athletes assigned to groups
export const groupAthletes = pgTable("group_athletes", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => athleteGroups.id),
  athleteId: integer("athlete_id").references(() => athletes.id),
  position: varchar("position", { length: 10 }), // "red", "blue", "queue"
  queueOrder: integer("queue_order"), // For queuing system when >2 athletes
  isEliminated: boolean("is_eliminated").default(false),
  eliminatedAt: timestamp("eliminated_at"),
  hasMedal: boolean("has_medal").default(false) // Track if athlete has received medal
});

// Legacy Categories table (kept for backward compatibility)
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

export const insertMainCategorySchema = createInsertSchema(mainCategories).omit({
  id: true
});

export const insertSubCategorySchema = createInsertSchema(subCategories).omit({
  id: true
});

export const insertAthleteGroupSchema = createInsertSchema(athleteGroups).omit({
  id: true
});

export const insertGroupAthleteSchema = createInsertSchema(groupAthletes).omit({
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

export type MainCategory = typeof mainCategories.$inferSelect;
export type InsertMainCategory = z.infer<typeof insertMainCategorySchema>;

export type SubCategory = typeof subCategories.$inferSelect;
export type InsertSubCategory = z.infer<typeof insertSubCategorySchema>;

export type AthleteGroup = typeof athleteGroups.$inferSelect;
export type InsertAthleteGroup = z.infer<typeof insertAthleteGroupSchema>;

export type GroupAthlete = typeof groupAthletes.$inferSelect;
export type InsertGroupAthlete = z.infer<typeof insertGroupAthleteSchema>;

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
