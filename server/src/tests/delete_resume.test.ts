import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  usersTable, 
  resumesTable, 
  workExperiencesTable, 
  educationTable, 
  skillsTable,
  resumeTemplatesTable
} from '../db/schema';
import { type DeleteInput } from '../schema';
import { deleteResume } from '../handlers/delete_resume';
import { eq } from 'drizzle-orm';

describe('deleteResume', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let userId: number;
  let templateId: number;
  let resumeId: number;

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe'
      })
      .returning()
      .execute();
    userId = userResult[0].id;

    // Create test template
    const templateResult = await db.insert(resumeTemplatesTable)
      .values({
        name: 'Test Template',
        description: 'A test template',
        css_styles: 'body { font-family: Arial; }',
        html_template: '<div>{{content}}</div>',
        is_active: true
      })
      .returning()
      .execute();
    templateId = templateResult[0].id;

    // Create test resume
    const resumeResult = await db.insert(resumesTable)
      .values({
        user_id: userId,
        title: 'Test Resume',
        summary: 'A test resume',
        template_id: templateId,
        is_public: false
      })
      .returning()
      .execute();
    resumeId = resumeResult[0].id;
  });

  it('should delete a resume successfully', async () => {
    const input: DeleteInput = { id: resumeId };
    
    const result = await deleteResume(input);
    
    expect(result).toBe(true);
    
    // Verify resume is deleted
    const resumes = await db.select()
      .from(resumesTable)
      .where(eq(resumesTable.id, resumeId))
      .execute();
    
    expect(resumes).toHaveLength(0);
  });

  it('should return false when resume does not exist', async () => {
    const nonExistentId = 99999;
    const input: DeleteInput = { id: nonExistentId };
    
    const result = await deleteResume(input);
    
    expect(result).toBe(false);
  });

  it('should cascade delete all related work experiences', async () => {
    // Create work experiences for the resume
    await db.insert(workExperiencesTable)
      .values([
        {
          resume_id: resumeId,
          company_name: 'Tech Corp',
          job_title: 'Developer',
          location: 'San Francisco, CA',
          start_date: new Date('2020-01-01'),
          end_date: new Date('2021-01-01'),
          is_current: false,
          description: 'Developed web applications',
          order_index: 1
        },
        {
          resume_id: resumeId,
          company_name: 'StartupCo',
          job_title: 'Senior Developer',
          location: 'New York, NY',
          start_date: new Date('2021-02-01'),
          end_date: null,
          is_current: true,
          description: 'Lead development team',
          order_index: 2
        }
      ])
      .execute();

    const input: DeleteInput = { id: resumeId };
    
    const result = await deleteResume(input);
    
    expect(result).toBe(true);
    
    // Verify work experiences are deleted
    const workExperiences = await db.select()
      .from(workExperiencesTable)
      .where(eq(workExperiencesTable.resume_id, resumeId))
      .execute();
    
    expect(workExperiences).toHaveLength(0);
  });

  it('should cascade delete all related education records', async () => {
    // Create education records for the resume
    await db.insert(educationTable)
      .values([
        {
          resume_id: resumeId,
          institution_name: 'University of California',
          degree: 'Bachelor of Science',
          field_of_study: 'Computer Science',
          location: 'Berkeley, CA',
          start_date: new Date('2015-09-01'),
          end_date: new Date('2019-05-01'),
          is_current: false,
          gpa: 3.8,
          description: 'Computer Science degree with focus on software engineering',
          order_index: 1
        },
        {
          resume_id: resumeId,
          institution_name: 'Stanford University',
          degree: 'Master of Science',
          field_of_study: 'Software Engineering',
          location: 'Stanford, CA',
          start_date: new Date('2019-09-01'),
          end_date: null,
          is_current: true,
          gpa: null,
          description: 'Advanced software engineering studies',
          order_index: 2
        }
      ])
      .execute();

    const input: DeleteInput = { id: resumeId };
    
    const result = await deleteResume(input);
    
    expect(result).toBe(true);
    
    // Verify education records are deleted
    const educationRecords = await db.select()
      .from(educationTable)
      .where(eq(educationTable.resume_id, resumeId))
      .execute();
    
    expect(educationRecords).toHaveLength(0);
  });

  it('should cascade delete all related skills', async () => {
    // Create skills for the resume
    await db.insert(skillsTable)
      .values([
        {
          resume_id: resumeId,
          name: 'JavaScript',
          category: 'Programming Languages',
          proficiency_level: 'advanced',
          order_index: 1
        },
        {
          resume_id: resumeId,
          name: 'React',
          category: 'Frameworks',
          proficiency_level: 'expert',
          order_index: 2
        },
        {
          resume_id: resumeId,
          name: 'Node.js',
          category: 'Runtime',
          proficiency_level: 'intermediate',
          order_index: 3
        }
      ])
      .execute();

    const input: DeleteInput = { id: resumeId };
    
    const result = await deleteResume(input);
    
    expect(result).toBe(true);
    
    // Verify skills are deleted
    const skills = await db.select()
      .from(skillsTable)
      .where(eq(skillsTable.resume_id, resumeId))
      .execute();
    
    expect(skills).toHaveLength(0);
  });

  it('should cascade delete all related data when resume has comprehensive content', async () => {
    // Create comprehensive resume data
    await db.insert(workExperiencesTable)
      .values({
        resume_id: resumeId,
        company_name: 'Tech Corp',
        job_title: 'Developer',
        location: 'San Francisco, CA',
        start_date: new Date('2020-01-01'),
        end_date: new Date('2021-01-01'),
        is_current: false,
        description: 'Developed web applications',
        order_index: 1
      })
      .execute();

    await db.insert(educationTable)
      .values({
        resume_id: resumeId,
        institution_name: 'University of California',
        degree: 'Bachelor of Science',
        field_of_study: 'Computer Science',
        location: 'Berkeley, CA',
        start_date: new Date('2015-09-01'),
        end_date: new Date('2019-05-01'),
        is_current: false,
        gpa: 3.8,
        description: 'Computer Science degree',
        order_index: 1
      })
      .execute();

    await db.insert(skillsTable)
      .values({
        resume_id: resumeId,
        name: 'JavaScript',
        category: 'Programming Languages',
        proficiency_level: 'advanced',
        order_index: 1
      })
      .execute();

    const input: DeleteInput = { id: resumeId };
    
    const result = await deleteResume(input);
    
    expect(result).toBe(true);
    
    // Verify all related data is deleted
    const [resumes, workExperiences, educationRecords, skills] = await Promise.all([
      db.select().from(resumesTable).where(eq(resumesTable.id, resumeId)).execute(),
      db.select().from(workExperiencesTable).where(eq(workExperiencesTable.resume_id, resumeId)).execute(),
      db.select().from(educationTable).where(eq(educationTable.resume_id, resumeId)).execute(),
      db.select().from(skillsTable).where(eq(skillsTable.resume_id, resumeId)).execute()
    ]);
    
    expect(resumes).toHaveLength(0);
    expect(workExperiences).toHaveLength(0);
    expect(educationRecords).toHaveLength(0);
    expect(skills).toHaveLength(0);
  });

  it('should not affect other resumes when deleting one resume', async () => {
    // Create another resume for the same user
    const anotherResumeResult = await db.insert(resumesTable)
      .values({
        user_id: userId,
        title: 'Another Resume',
        summary: 'Another test resume',
        template_id: templateId,
        is_public: true
      })
      .returning()
      .execute();
    const anotherResumeId = anotherResumeResult[0].id;

    // Add content to both resumes
    await db.insert(skillsTable)
      .values([
        {
          resume_id: resumeId,
          name: 'JavaScript',
          category: 'Programming',
          proficiency_level: 'advanced',
          order_index: 1
        },
        {
          resume_id: anotherResumeId,
          name: 'Python',
          category: 'Programming',
          proficiency_level: 'expert',
          order_index: 1
        }
      ])
      .execute();

    const input: DeleteInput = { id: resumeId };
    
    const result = await deleteResume(input);
    
    expect(result).toBe(true);
    
    // Verify first resume and its skills are deleted
    const deletedResumes = await db.select()
      .from(resumesTable)
      .where(eq(resumesTable.id, resumeId))
      .execute();
    
    const deletedSkills = await db.select()
      .from(skillsTable)
      .where(eq(skillsTable.resume_id, resumeId))
      .execute();
    
    expect(deletedResumes).toHaveLength(0);
    expect(deletedSkills).toHaveLength(0);
    
    // Verify second resume and its skills still exist
    const remainingResumes = await db.select()
      .from(resumesTable)
      .where(eq(resumesTable.id, anotherResumeId))
      .execute();
    
    const remainingSkills = await db.select()
      .from(skillsTable)
      .where(eq(skillsTable.resume_id, anotherResumeId))
      .execute();
    
    expect(remainingResumes).toHaveLength(1);
    expect(remainingResumes[0].title).toBe('Another Resume');
    expect(remainingSkills).toHaveLength(1);
    expect(remainingSkills[0].name).toBe('Python');
  });
});