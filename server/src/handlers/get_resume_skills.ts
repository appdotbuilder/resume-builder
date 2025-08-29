import { db } from '../db';
import { skillsTable } from '../db/schema';
import { type GetResumeSkillsInput, type Skill } from '../schema';
import { eq, asc } from 'drizzle-orm';

export async function getResumeSkills(input: GetResumeSkillsInput): Promise<Skill[]> {
  try {
    // Query skills for the specific resume, ordered by order_index
    const results = await db.select()
      .from(skillsTable)
      .where(eq(skillsTable.resume_id, input.resume_id))
      .orderBy(asc(skillsTable.order_index))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch resume skills:', error);
    throw error;
  }
}