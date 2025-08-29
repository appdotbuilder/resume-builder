import { db } from '../db';
import { educationTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type DeleteInput } from '../schema';

export const deleteEducation = async (input: DeleteInput): Promise<boolean> => {
  try {
    // Delete the education entry by ID
    const result = await db.delete(educationTable)
      .where(eq(educationTable.id, input.id))
      .execute();

    // Return true if a row was deleted, false if no matching record was found
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Education deletion failed:', error);
    throw error;
  }
};