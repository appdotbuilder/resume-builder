import { db } from '../db';
import { resumesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdateResumeInput, type Resume } from '../schema';

export const updateResume = async (input: UpdateResumeInput): Promise<Resume> => {
  try {
    // Build update object with only provided fields
    const updateData: any = {};
    
    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    
    if (input.summary !== undefined) {
      updateData.summary = input.summary;
    }
    
    if (input.template_id !== undefined) {
      updateData.template_id = input.template_id;
    }
    
    if (input.is_public !== undefined) {
      updateData.is_public = input.is_public;
    }
    
    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    // Update the resume record
    const result = await db.update(resumesTable)
      .set(updateData)
      .where(eq(resumesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Resume with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Resume update failed:', error);
    throw error;
  }
};