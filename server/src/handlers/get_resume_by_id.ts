import { db } from '../db';
import { resumesTable } from '../db/schema';
import { type GetResumeByIdInput, type Resume } from '../schema';
import { eq } from 'drizzle-orm';

export const getResumeById = async (input: GetResumeByIdInput): Promise<Resume | null> => {
  try {
    // Query resume by ID
    const results = await db.select()
      .from(resumesTable)
      .where(eq(resumesTable.id, input.id))
      .execute();

    // Return null if no resume found
    if (results.length === 0) {
      return null;
    }

    // Return the first (and should be only) result
    const resume = results[0];
    return {
      ...resume,
    };
  } catch (error) {
    console.error('Failed to get resume by ID:', error);
    throw error;
  }
};