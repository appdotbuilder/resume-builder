import { type CreateWorkExperienceInput, type WorkExperience } from '../schema';

export async function createWorkExperience(input: CreateWorkExperienceInput): Promise<WorkExperience> {
  // This is a placeholder declaration! Real code should be implemented here.
  // The goal of this handler is creating a new work experience entry for a resume and persisting it in the database.
  return Promise.resolve({
    id: 0, // Placeholder ID
    resume_id: input.resume_id,
    company_name: input.company_name,
    job_title: input.job_title,
    location: input.location || null,
    start_date: input.start_date,
    end_date: input.end_date || null,
    is_current: input.is_current || false,
    description: input.description || null,
    order_index: input.order_index || 0,
    created_at: new Date(),
  } as WorkExperience);
}