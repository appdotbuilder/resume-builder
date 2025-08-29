import { db } from '../db';
import { resumeTemplatesTable } from '../db/schema';
import { type CreateResumeTemplateInput, type ResumeTemplate } from '../schema';

export const createResumeTemplate = async (input: CreateResumeTemplateInput): Promise<ResumeTemplate> => {
  try {
    // Insert resume template record
    const result = await db.insert(resumeTemplatesTable)
      .values({
        name: input.name,
        description: input.description,
        css_styles: input.css_styles,
        html_template: input.html_template,
        is_active: input.is_active ?? true // Use nullish coalescing for proper default handling
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Resume template creation failed:', error);
    throw error;
  }
};