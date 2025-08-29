import { db } from '../db';
import { skillsTable } from '../db/schema';
import { type CreateSkillInput, type Skill } from '../schema';

export async function createSkill(input: CreateSkillInput): Promise<Skill> {
  try {
    // Insert skill record
    const result = await db.insert(skillsTable)
      .values({
        resume_id: input.resume_id,
        name: input.name,
        category: input.category,
        proficiency_level: input.proficiency_level,
        order_index: input.order_index || 0
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Skill creation failed:', error);
    throw error;
  }
}