import { serial, text, pgTable, timestamp, boolean, integer, real, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enum for proficiency levels
export const proficiencyLevelEnum = pgEnum('proficiency_level', ['beginner', 'intermediate', 'advanced', 'expert']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  phone: text('phone'),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  zip_code: text('zip_code'),
  country: text('country'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Resume templates table
export const resumeTemplatesTable = pgTable('resume_templates', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  css_styles: text('css_styles').notNull(),
  html_template: text('html_template').notNull(),
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Resumes table
export const resumesTable = pgTable('resumes', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  title: text('title').notNull(),
  summary: text('summary'),
  template_id: integer('template_id').references(() => resumeTemplatesTable.id),
  is_public: boolean('is_public').default(false).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Work experiences table
export const workExperiencesTable = pgTable('work_experiences', {
  id: serial('id').primaryKey(),
  resume_id: integer('resume_id').notNull().references(() => resumesTable.id),
  company_name: text('company_name').notNull(),
  job_title: text('job_title').notNull(),
  location: text('location'),
  start_date: timestamp('start_date').notNull(),
  end_date: timestamp('end_date'),
  is_current: boolean('is_current').default(false).notNull(),
  description: text('description'),
  order_index: integer('order_index').default(0).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Education table
export const educationTable = pgTable('education', {
  id: serial('id').primaryKey(),
  resume_id: integer('resume_id').notNull().references(() => resumesTable.id),
  institution_name: text('institution_name').notNull(),
  degree: text('degree').notNull(),
  field_of_study: text('field_of_study'),
  location: text('location'),
  start_date: timestamp('start_date').notNull(),
  end_date: timestamp('end_date'),
  is_current: boolean('is_current').default(false).notNull(),
  gpa: real('gpa'),
  description: text('description'),
  order_index: integer('order_index').default(0).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Skills table
export const skillsTable = pgTable('skills', {
  id: serial('id').primaryKey(),
  resume_id: integer('resume_id').notNull().references(() => resumesTable.id),
  name: text('name').notNull(),
  category: text('category'),
  proficiency_level: proficiencyLevelEnum('proficiency_level'),
  order_index: integer('order_index').default(0).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Define relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  resumes: many(resumesTable),
}));

export const resumeTemplatesRelations = relations(resumeTemplatesTable, ({ many }) => ({
  resumes: many(resumesTable),
}));

export const resumesRelations = relations(resumesTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [resumesTable.user_id],
    references: [usersTable.id],
  }),
  template: one(resumeTemplatesTable, {
    fields: [resumesTable.template_id],
    references: [resumeTemplatesTable.id],
  }),
  workExperiences: many(workExperiencesTable),
  education: many(educationTable),
  skills: many(skillsTable),
}));

export const workExperiencesRelations = relations(workExperiencesTable, ({ one }) => ({
  resume: one(resumesTable, {
    fields: [workExperiencesTable.resume_id],
    references: [resumesTable.id],
  }),
}));

export const educationRelations = relations(educationTable, ({ one }) => ({
  resume: one(resumesTable, {
    fields: [educationTable.resume_id],
    references: [resumesTable.id],
  }),
}));

export const skillsRelations = relations(skillsTable, ({ one }) => ({
  resume: one(resumesTable, {
    fields: [skillsTable.resume_id],
    references: [resumesTable.id],
  }),
}));

// TypeScript types for the tables
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type Resume = typeof resumesTable.$inferSelect;
export type NewResume = typeof resumesTable.$inferInsert;

export type WorkExperience = typeof workExperiencesTable.$inferSelect;
export type NewWorkExperience = typeof workExperiencesTable.$inferInsert;

export type Education = typeof educationTable.$inferSelect;
export type NewEducation = typeof educationTable.$inferInsert;

export type Skill = typeof skillsTable.$inferSelect;
export type NewSkill = typeof skillsTable.$inferInsert;

export type ResumeTemplate = typeof resumeTemplatesTable.$inferSelect;
export type NewResumeTemplate = typeof resumeTemplatesTable.$inferInsert;

// Export all tables for proper query building
export const tables = {
  users: usersTable,
  resumes: resumesTable,
  workExperiences: workExperiencesTable,
  education: educationTable,
  skills: skillsTable,
  resumeTemplates: resumeTemplatesTable,
};