import { db } from '../db';
import { educationTable } from '../db/schema';
import { eq, asc } from 'drizzle-orm';
import { type GetResumeEducationsInput, type Education } from '../schema';

export async function getResumeEducations(input: GetResumeEducationsInput): Promise<Education[]> {
  try {
    const results = await db.select()
      .from(educationTable)
      .where(eq(educationTable.resume_id, input.resume_id))
      .orderBy(asc(educationTable.order_index))
      .execute();

    // Convert numeric fields (gpa is a real/numeric column) back to numbers
    return results.map(education => ({
      ...education,
      gpa: education.gpa !== null ? parseFloat(education.gpa.toString()) : null
    }));
  } catch (error) {
    console.error('Get resume educations failed:', error);
    throw error;
  }
}