import { db } from '../db';
import { workExperiencesTable } from '../db/schema';
import { type DeleteInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteWorkExperience = async (input: DeleteInput): Promise<boolean> => {
  try {
    // Delete the work experience record
    const result = await db.delete(workExperiencesTable)
      .where(eq(workExperiencesTable.id, input.id))
      .execute();

    // Return true if a record was deleted, false if no record was found
    return result.rowCount !== null && result.rowCount > 0;
  } catch (error) {
    console.error('Work experience deletion failed:', error);
    throw error;
  }
};