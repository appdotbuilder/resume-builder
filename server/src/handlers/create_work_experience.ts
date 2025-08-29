import { db } from '../db';
import { workExperiencesTable } from '../db/schema';
import { type CreateWorkExperienceInput, type WorkExperience } from '../schema';

export async function createWorkExperience(input: CreateWorkExperienceInput): Promise<WorkExperience> {
  try {
    // Insert work experience record
    const result = await db.insert(workExperiencesTable)
      .values({
        resume_id: input.resume_id,
        company_name: input.company_name,
        job_title: input.job_title,
        location: input.location,
        start_date: input.start_date,
        end_date: input.end_date,
        is_current: input.is_current ?? false,
        description: input.description,
        order_index: input.order_index ?? 0,
      })
      .returning()
      .execute();

    const workExperience = result[0];
    return workExperience;
  } catch (error) {
    console.error('Work experience creation failed:', error);
    throw error;
  }
}