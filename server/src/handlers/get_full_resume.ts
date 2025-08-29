import { db } from '../db';
import { resumesTable, workExperiencesTable, educationTable, skillsTable, resumeTemplatesTable } from '../db/schema';
import { eq, asc } from 'drizzle-orm';
import { type GetResumeByIdInput, type Resume, type WorkExperience, type Education, type Skill, type ResumeTemplate } from '../schema';

// Type for complete resume data including all related entities
export type FullResume = Resume & {
  work_experiences: WorkExperience[];
  education: Education[];
  skills: Skill[];
  template?: ResumeTemplate | null;
};

export async function getFullResume(input: GetResumeByIdInput): Promise<FullResume | null> {
  try {
    // First, get the resume data
    const resumeResults = await db.select()
      .from(resumesTable)
      .where(eq(resumesTable.id, input.id))
      .execute();

    if (resumeResults.length === 0) {
      return null;
    }

    const resume = resumeResults[0];

    // Get work experiences ordered by order_index
    const workExperiences = await db.select()
      .from(workExperiencesTable)
      .where(eq(workExperiencesTable.resume_id, input.id))
      .orderBy(asc(workExperiencesTable.order_index))
      .execute();

    // Get education records ordered by order_index
    const educationRecords = await db.select()
      .from(educationTable)
      .where(eq(educationTable.resume_id, input.id))
      .orderBy(asc(educationTable.order_index))
      .execute();

    // Get skills ordered by order_index
    const skills = await db.select()
      .from(skillsTable)
      .where(eq(skillsTable.resume_id, input.id))
      .orderBy(asc(skillsTable.order_index))
      .execute();

    // Get template if template_id exists
    let template: ResumeTemplate | null = null;
    if (resume.template_id) {
      const templateResults = await db.select()
        .from(resumeTemplatesTable)
        .where(eq(resumeTemplatesTable.id, resume.template_id))
        .execute();

      if (templateResults.length > 0) {
        template = templateResults[0];
      }
    }

    // Convert education real fields (gpa) to numbers
    const educationWithNumbers = educationRecords.map(education => ({
      ...education,
      gpa: education.gpa ? parseFloat(education.gpa.toString()) : null
    }));

    return {
      ...resume,
      work_experiences: workExperiences,
      education: educationWithNumbers,
      skills: skills,
      template: template
    };
  } catch (error) {
    console.error('Get full resume failed:', error);
    throw error;
  }
}