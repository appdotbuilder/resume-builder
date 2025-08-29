import { db } from '../db';
import { resumesTable, workExperiencesTable, educationTable, skillsTable } from '../db/schema';
import { type DeleteInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteResume = async (input: DeleteInput): Promise<boolean> => {
  try {
    // First verify the resume exists
    const existingResume = await db.select()
      .from(resumesTable)
      .where(eq(resumesTable.id, input.id))
      .execute();

    if (existingResume.length === 0) {
      return false; // Resume not found
    }

    // Delete related records first (cascade delete)
    // Delete skills associated with the resume
    await db.delete(skillsTable)
      .where(eq(skillsTable.resume_id, input.id))
      .execute();

    // Delete education records associated with the resume
    await db.delete(educationTable)
      .where(eq(educationTable.resume_id, input.id))
      .execute();

    // Delete work experiences associated with the resume
    await db.delete(workExperiencesTable)
      .where(eq(workExperiencesTable.resume_id, input.id))
      .execute();

    // Finally delete the resume itself
    const result = await db.delete(resumesTable)
      .where(eq(resumesTable.id, input.id))
      .execute();

    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Resume deletion failed:', error);
    throw error;
  }
};