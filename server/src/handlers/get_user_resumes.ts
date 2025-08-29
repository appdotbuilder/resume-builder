import { db } from '../db';
import { resumesTable } from '../db/schema';
import { type GetUserResumesInput, type Resume } from '../schema';
import { eq } from 'drizzle-orm';

export const getUserResumes = async (input: GetUserResumesInput): Promise<Resume[]> => {
  try {
    // Query resumes for the specific user
    const results = await db.select()
      .from(resumesTable)
      .where(eq(resumesTable.user_id, input.user_id))
      .execute();

    // Return the results as Resume[] - no numeric conversions needed for this table
    return results;
  } catch (error) {
    console.error('Failed to fetch user resumes:', error);
    throw error;
  }
};