import { db } from '../db';
import { skillsTable } from '../db/schema';
import { type UpdateSkillInput, type Skill } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateSkill(input: UpdateSkillInput): Promise<Skill> {
  try {
    // Build update object with only provided fields
    const updateData: Partial<typeof skillsTable.$inferInsert> = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    
    if (input.category !== undefined) {
      updateData.category = input.category;
    }
    
    if (input.proficiency_level !== undefined) {
      updateData.proficiency_level = input.proficiency_level;
    }
    
    if (input.order_index !== undefined) {
      updateData.order_index = input.order_index;
    }

    // Update the skill record
    const result = await db.update(skillsTable)
      .set(updateData)
      .where(eq(skillsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Skill with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Skill update failed:', error);
    throw error;
  }
}