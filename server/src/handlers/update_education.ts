import { db } from '../db';
import { educationTable } from '../db/schema';
import { type UpdateEducationInput, type Education } from '../schema';
import { eq } from 'drizzle-orm';

export const updateEducation = async (input: UpdateEducationInput): Promise<Education> => {
  try {
    // Build update object with only provided fields
    const updateData: Partial<typeof educationTable.$inferInsert> = {};
    
    if (input.institution_name !== undefined) {
      updateData.institution_name = input.institution_name;
    }
    
    if (input.degree !== undefined) {
      updateData.degree = input.degree;
    }
    
    if (input.field_of_study !== undefined) {
      updateData.field_of_study = input.field_of_study;
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
    
    if (input.gpa !== undefined) {
      updateData.gpa = input.gpa;
    }
    
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    
    if (input.order_index !== undefined) {
      updateData.order_index = input.order_index;
    }
    
    // Update the education record
    const result = await db.update(educationTable)
      .set(updateData)
      .where(eq(educationTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Education with id ${input.id} not found`);
    }

    const education = result[0];
    
    // Return with proper type conversion for numeric fields
    return {
      ...education,
      gpa: education.gpa !== null ? parseFloat(education.gpa.toString()) : null, // Convert numeric field
    };
  } catch (error) {
    console.error('Education update failed:', error);
    throw error;
  }
};