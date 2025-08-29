import { db } from '../db';
import { workExperiencesTable } from '../db/schema';
import { eq, asc } from 'drizzle-orm';
import { type GetResumeWorkExperiencesInput, type WorkExperience } from '../schema';

export async function getResumeWorkExperiences(input: GetResumeWorkExperiencesInput): Promise<WorkExperience[]> {
  try {
    const results = await db.select()
      .from(workExperiencesTable)
      .where(eq(workExperiencesTable.resume_id, input.resume_id))
      .orderBy(asc(workExperiencesTable.order_index))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get resume work experiences:', error);
    throw error;
  }
}