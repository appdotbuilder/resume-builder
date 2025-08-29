import { db } from '../db';
import { skillsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type DeleteInput } from '../schema';

export async function deleteSkill(input: DeleteInput): Promise<boolean> {
  try {
    const result = await db.delete(skillsTable)
      .where(eq(skillsTable.id, input.id))
      .execute();

    // Return true if a row was deleted, false if no row was found
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Skill deletion failed:', error);
    throw error;
  }
}