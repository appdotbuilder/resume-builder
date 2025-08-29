import { db } from '../db';
import { educationTable } from '../db/schema';
import { type CreateEducationInput, type Education } from '../schema';

export const createEducation = async (input: CreateEducationInput): Promise<Education> => {
  try {
    // Insert education record
    const result = await db.insert(educationTable)
      .values({
        resume_id: input.resume_id,
        institution_name: input.institution_name,
        degree: input.degree,
        field_of_study: input.field_of_study,
        location: input.location,
        start_date: input.start_date,
        end_date: input.end_date,
        is_current: input.is_current ?? false,
        gpa: input.gpa,
        description: input.description,
        order_index: input.order_index ?? 0,
      })
      .returning()
      .execute();

    const education = result[0];
    return education;
  } catch (error) {
    console.error('Education creation failed:', error);
    throw error;
  }
};