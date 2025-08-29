import { db } from '../db';
import { resumeTemplatesTable } from '../db/schema';
import { type ResumeTemplate } from '../schema';
import { eq } from 'drizzle-orm';

export const getResumeTemplates = async (): Promise<ResumeTemplate[]> => {
  try {
    // Fetch only active resume templates
    const result = await db.select()
      .from(resumeTemplatesTable)
      .where(eq(resumeTemplatesTable.is_active, true))
      .execute();

    return result;
  } catch (error) {
    console.error('Failed to fetch resume templates:', error);
    throw error;
  }
};