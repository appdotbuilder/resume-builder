import { db } from '../db';
import { workExperiencesTable } from '../db/schema';
import { type UpdateWorkExperienceInput, type WorkExperience } from '../schema';
import { eq } from 'drizzle-orm';

export const updateWorkExperience = async (input: UpdateWorkExperienceInput): Promise<WorkExperience> => {
  try {
    // Build update object with only provided fields
    const updateData: Partial<typeof workExperiencesTable.$inferInsert> = {};
    
    if (input.company_name !== undefined) {
      updateData.company_name = input.company_name;
    }
    if (input.job_title !== undefined) {
      updateData.job_title = input.job_title;
    }
    if (input.location !== undefined) {
      updateData.location = input.location;
    }
    if (input.start_date !== undefined) {
      updateData.start_date = input.start_date;
    }
    if (input.end_date !== undefined) {
      updateData.end_date = input.end_date;
    }
    if (input.is_current !== undefined) {
      updateData.is_current = input.is_current;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.order_index !== undefined) {
      updateData.order_index = input.order_index;
    }

    // Always update the updated_at timestamp (Note: no updated_at in work_experiences table)
    
    // Update the work experience record
    const result = await db.update(workExperiencesTable)
      .set(updateData)
      .where(eq(workExperiencesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Work experience with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Work experience update failed:', error);
    throw error;
  }
};