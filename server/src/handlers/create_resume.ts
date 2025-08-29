import { db } from '../db';
import { resumesTable } from '../db/schema';
import { type CreateResumeInput, type Resume } from '../schema';

export const createResume = async (input: CreateResumeInput): Promise<Resume> => {
  try {
    // Insert resume record
    const result = await db.insert(resumesTable)
      .values({
        user_id: input.user_id,
        title: input.title,
        summary: input.summary || null,
        template_id: input.template_id || null,
        is_public: input.is_public || false
      })
      .returning()
      .execute();

    // Return the created resume
    const resume = result[0];
    return resume;
  } catch (error) {
    console.error('Resume creation failed:', error);
    throw error;
  }
};