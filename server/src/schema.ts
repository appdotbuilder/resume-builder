import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  zip_code: z.string().nullable(),
  country: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type User = z.infer<typeof userSchema>;

// Resume schema
export const resumeSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  title: z.string(),
  summary: z.string().nullable(),
  template_id: z.number().nullable(),
  is_public: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type Resume = z.infer<typeof resumeSchema>;

// Work experience schema
export const workExperienceSchema = z.object({
  id: z.number(),
  resume_id: z.number(),
  company_name: z.string(),
  job_title: z.string(),
  location: z.string().nullable(),
  start_date: z.coerce.date(),
  end_date: z.coerce.date().nullable(),
  is_current: z.boolean(),
  description: z.string().nullable(),
  order_index: z.number().int(),
  created_at: z.coerce.date(),
});

export type WorkExperience = z.infer<typeof workExperienceSchema>;

// Education schema
export const educationSchema = z.object({
  id: z.number(),
  resume_id: z.number(),
  institution_name: z.string(),
  degree: z.string(),
  field_of_study: z.string().nullable(),
  location: z.string().nullable(),
  start_date: z.coerce.date(),
  end_date: z.coerce.date().nullable(),
  is_current: z.boolean(),
  gpa: z.number().nullable(),
  description: z.string().nullable(),
  order_index: z.number().int(),
  created_at: z.coerce.date(),
});

export type Education = z.infer<typeof educationSchema>;

// Skill schema
export const skillSchema = z.object({
  id: z.number(),
  resume_id: z.number(),
  name: z.string(),
  category: z.string().nullable(),
  proficiency_level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).nullable(),
  order_index: z.number().int(),
  created_at: z.coerce.date(),
});

export type Skill = z.infer<typeof skillSchema>;

// Resume template schema
export const resumeTemplateSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  css_styles: z.string(),
  html_template: z.string(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
});

export type ResumeTemplate = z.infer<typeof resumeTemplateSchema>;

// Input schemas for creating/updating

// User input schemas
export const createUserInputSchema = z.object({
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  zip_code: z.string().nullable(),
  country: z.string().nullable(),
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const updateUserInputSchema = z.object({
  id: z.number(),
  email: z.string().email().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  zip_code: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

// Resume input schemas
export const createResumeInputSchema = z.object({
  user_id: z.number(),
  title: z.string(),
  summary: z.string().nullable(),
  template_id: z.number().nullable(),
  is_public: z.boolean().optional(),
});

export type CreateResumeInput = z.infer<typeof createResumeInputSchema>;

export const updateResumeInputSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  summary: z.string().nullable().optional(),
  template_id: z.number().nullable().optional(),
  is_public: z.boolean().optional(),
});

export type UpdateResumeInput = z.infer<typeof updateResumeInputSchema>;

// Work experience input schemas
export const createWorkExperienceInputSchema = z.object({
  resume_id: z.number(),
  company_name: z.string(),
  job_title: z.string(),
  location: z.string().nullable(),
  start_date: z.coerce.date(),
  end_date: z.coerce.date().nullable(),
  is_current: z.boolean().optional(),
  description: z.string().nullable(),
  order_index: z.number().int().optional(),
});

export type CreateWorkExperienceInput = z.infer<typeof createWorkExperienceInputSchema>;

export const updateWorkExperienceInputSchema = z.object({
  id: z.number(),
  company_name: z.string().optional(),
  job_title: z.string().optional(),
  location: z.string().nullable().optional(),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().nullable().optional(),
  is_current: z.boolean().optional(),
  description: z.string().nullable().optional(),
  order_index: z.number().int().optional(),
});

export type UpdateWorkExperienceInput = z.infer<typeof updateWorkExperienceInputSchema>;

// Education input schemas
export const createEducationInputSchema = z.object({
  resume_id: z.number(),
  institution_name: z.string(),
  degree: z.string(),
  field_of_study: z.string().nullable(),
  location: z.string().nullable(),
  start_date: z.coerce.date(),
  end_date: z.coerce.date().nullable(),
  is_current: z.boolean().optional(),
  gpa: z.number().nullable(),
  description: z.string().nullable(),
  order_index: z.number().int().optional(),
});

export type CreateEducationInput = z.infer<typeof createEducationInputSchema>;

export const updateEducationInputSchema = z.object({
  id: z.number(),
  institution_name: z.string().optional(),
  degree: z.string().optional(),
  field_of_study: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().nullable().optional(),
  is_current: z.boolean().optional(),
  gpa: z.number().nullable().optional(),
  description: z.string().nullable().optional(),
  order_index: z.number().int().optional(),
});

export type UpdateEducationInput = z.infer<typeof updateEducationInputSchema>;

// Skill input schemas
export const createSkillInputSchema = z.object({
  resume_id: z.number(),
  name: z.string(),
  category: z.string().nullable(),
  proficiency_level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).nullable(),
  order_index: z.number().int().optional(),
});

export type CreateSkillInput = z.infer<typeof createSkillInputSchema>;

export const updateSkillInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  category: z.string().nullable().optional(),
  proficiency_level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).nullable().optional(),
  order_index: z.number().int().optional(),
});

export type UpdateSkillInput = z.infer<typeof updateSkillInputSchema>;

// Resume template input schemas
export const createResumeTemplateInputSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  css_styles: z.string(),
  html_template: z.string(),
  is_active: z.boolean().optional(),
});

export type CreateResumeTemplateInput = z.infer<typeof createResumeTemplateInputSchema>;

export const updateResumeTemplateInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  description: z.string().nullable().optional(),
  css_styles: z.string().optional(),
  html_template: z.string().optional(),
  is_active: z.boolean().optional(),
});

export type UpdateResumeTemplateInput = z.infer<typeof updateResumeTemplateInputSchema>;

// Query input schemas
export const getResumeByIdInputSchema = z.object({
  id: z.number(),
});

export type GetResumeByIdInput = z.infer<typeof getResumeByIdInputSchema>;

export const getUserResumesInputSchema = z.object({
  user_id: z.number(),
});

export type GetUserResumesInput = z.infer<typeof getUserResumesInputSchema>;

export const getResumeWorkExperiencesInputSchema = z.object({
  resume_id: z.number(),
});

export type GetResumeWorkExperiencesInput = z.infer<typeof getResumeWorkExperiencesInputSchema>;

export const getResumeEducationsInputSchema = z.object({
  resume_id: z.number(),
});

export type GetResumeEducationsInput = z.infer<typeof getResumeEducationsInputSchema>;

export const getResumeSkillsInputSchema = z.object({
  resume_id: z.number(),
});

export type GetResumeSkillsInput = z.infer<typeof getResumeSkillsInputSchema>;

export const deleteInputSchema = z.object({
  id: z.number(),
});

export type DeleteInput = z.infer<typeof deleteInputSchema>;