import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, resumesTable, workExperiencesTable, educationTable, skillsTable, resumeTemplatesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type GetResumeByIdInput } from '../schema';
import { getFullResume } from '../handlers/get_full_resume';

describe('getFullResume', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null for non-existent resume', async () => {
    const input: GetResumeByIdInput = { id: 999 };
    const result = await getFullResume(input);
    expect(result).toBeNull();
  });

  it('should return full resume with all related data', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create template
    const templateResult = await db.insert(resumeTemplatesTable)
      .values({
        name: 'Modern Template',
        description: 'A modern resume template',
        css_styles: 'body { font-family: Arial; }',
        html_template: '<div>{{name}}</div>',
        is_active: true
      })
      .returning()
      .execute();
    const templateId = templateResult[0].id;

    // Create resume
    const resumeResult = await db.insert(resumesTable)
      .values({
        user_id: userId,
        title: 'Software Engineer Resume',
        summary: 'Experienced software engineer',
        template_id: templateId,
        is_public: true
      })
      .returning()
      .execute();
    const resumeId = resumeResult[0].id;

    // Create work experiences
    await db.insert(workExperiencesTable)
      .values([
        {
          resume_id: resumeId,
          company_name: 'Tech Corp',
          job_title: 'Senior Developer',
          location: 'San Francisco, CA',
          start_date: new Date('2020-01-01'),
          end_date: new Date('2023-01-01'),
          is_current: false,
          description: 'Developed web applications',
          order_index: 1
        },
        {
          resume_id: resumeId,
          company_name: 'StartUp Inc',
          job_title: 'Lead Developer',
          location: 'Austin, TX',
          start_date: new Date('2023-02-01'),
          end_date: null,
          is_current: true,
          description: 'Leading development team',
          order_index: 0
        }
      ])
      .execute();

    // Create education records
    await db.insert(educationTable)
      .values([
        {
          resume_id: resumeId,
          institution_name: 'University of California',
          degree: 'Bachelor of Science',
          field_of_study: 'Computer Science',
          location: 'Berkeley, CA',
          start_date: new Date('2014-09-01'),
          end_date: new Date('2018-05-01'),
          is_current: false,
          gpa: 3.8,
          description: 'Summa Cum Laude',
          order_index: 0
        },
        {
          resume_id: resumeId,
          institution_name: 'Stanford University',
          degree: 'Master of Science',
          field_of_study: 'Software Engineering',
          location: 'Stanford, CA',
          start_date: new Date('2018-09-01'),
          end_date: new Date('2020-06-01'),
          is_current: false,
          gpa: 3.9,
          description: null,
          order_index: 1
        }
      ])
      .execute();

    // Create skills
    await db.insert(skillsTable)
      .values([
        {
          resume_id: resumeId,
          name: 'JavaScript',
          category: 'Programming Languages',
          proficiency_level: 'expert',
          order_index: 0
        },
        {
          resume_id: resumeId,
          name: 'React',
          category: 'Frameworks',
          proficiency_level: 'advanced',
          order_index: 1
        },
        {
          resume_id: resumeId,
          name: 'Node.js',
          category: 'Backend',
          proficiency_level: 'advanced',
          order_index: 2
        }
      ])
      .execute();

    // Test the handler
    const input: GetResumeByIdInput = { id: resumeId };
    const result = await getFullResume(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(resumeId);
    expect(result!.title).toEqual('Software Engineer Resume');
    expect(result!.summary).toEqual('Experienced software engineer');
    expect(result!.is_public).toEqual(true);
    expect(result!.template_id).toEqual(templateId);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);

    // Check template
    expect(result!.template).not.toBeNull();
    expect(result!.template!.name).toEqual('Modern Template');
    expect(result!.template!.description).toEqual('A modern resume template');
    expect(result!.template!.is_active).toEqual(true);

    // Check work experiences (should be ordered by order_index)
    expect(result!.work_experiences).toHaveLength(2);
    expect(result!.work_experiences[0].company_name).toEqual('StartUp Inc'); // order_index 0
    expect(result!.work_experiences[0].job_title).toEqual('Lead Developer');
    expect(result!.work_experiences[0].is_current).toEqual(true);
    expect(result!.work_experiences[0].start_date).toBeInstanceOf(Date);
    expect(result!.work_experiences[0].end_date).toBeNull();
    
    expect(result!.work_experiences[1].company_name).toEqual('Tech Corp'); // order_index 1
    expect(result!.work_experiences[1].job_title).toEqual('Senior Developer');
    expect(result!.work_experiences[1].is_current).toEqual(false);
    expect(result!.work_experiences[1].end_date).toBeInstanceOf(Date);

    // Check education (should be ordered by order_index)
    expect(result!.education).toHaveLength(2);
    expect(result!.education[0].institution_name).toEqual('University of California'); // order_index 0
    expect(result!.education[0].degree).toEqual('Bachelor of Science');
    expect(result!.education[0].field_of_study).toEqual('Computer Science');
    expect(result!.education[0].gpa).toEqual(3.8);
    expect(typeof result!.education[0].gpa).toEqual('number');
    expect(result!.education[0].description).toEqual('Summa Cum Laude');
    
    expect(result!.education[1].institution_name).toEqual('Stanford University'); // order_index 1
    expect(result!.education[1].degree).toEqual('Master of Science');
    expect(result!.education[1].gpa).toEqual(3.9);
    expect(typeof result!.education[1].gpa).toEqual('number');
    expect(result!.education[1].description).toBeNull();

    // Check skills (should be ordered by order_index)
    expect(result!.skills).toHaveLength(3);
    expect(result!.skills[0].name).toEqual('JavaScript'); // order_index 0
    expect(result!.skills[0].category).toEqual('Programming Languages');
    expect(result!.skills[0].proficiency_level).toEqual('expert');
    
    expect(result!.skills[1].name).toEqual('React'); // order_index 1
    expect(result!.skills[1].proficiency_level).toEqual('advanced');
    
    expect(result!.skills[2].name).toEqual('Node.js'); // order_index 2
    expect(result!.skills[2].category).toEqual('Backend');
  });

  it('should return resume with empty arrays when no related data exists', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test2@example.com',
        first_name: 'Jane',
        last_name: 'Smith'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create resume without template
    const resumeResult = await db.insert(resumesTable)
      .values({
        user_id: userId,
        title: 'Basic Resume',
        summary: null,
        template_id: null,
        is_public: false
      })
      .returning()
      .execute();
    const resumeId = resumeResult[0].id;

    const input: GetResumeByIdInput = { id: resumeId };
    const result = await getFullResume(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(resumeId);
    expect(result!.title).toEqual('Basic Resume');
    expect(result!.summary).toBeNull();
    expect(result!.template_id).toBeNull();
    expect(result!.is_public).toEqual(false);
    expect(result!.template).toBeNull();
    expect(result!.work_experiences).toHaveLength(0);
    expect(result!.education).toHaveLength(0);
    expect(result!.skills).toHaveLength(0);
  });

  it('should properly handle resume with valid template reference', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test3@example.com',
        first_name: 'Bob',
        last_name: 'Johnson'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create template
    const templateResult = await db.insert(resumeTemplatesTable)
      .values({
        name: 'Clean Template',
        description: 'A clean professional template',
        css_styles: 'body { font-family: serif; }',
        html_template: '<div class="resume">{{content}}</div>',
        is_active: true
      })
      .returning()
      .execute();
    const templateId = templateResult[0].id;

    // Create resume with template
    const resumeResult = await db.insert(resumesTable)
      .values({
        user_id: userId,
        title: 'Professional Resume',
        summary: 'A well-structured resume',
        template_id: templateId,
        is_public: true
      })
      .returning()
      .execute();
    const resumeId = resumeResult[0].id;

    const input: GetResumeByIdInput = { id: resumeId };
    const result = await getFullResume(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(resumeId);
    expect(result!.title).toEqual('Professional Resume');
    expect(result!.template_id).toEqual(templateId);
    expect(result!.template).not.toBeNull();
    expect(result!.template!.name).toEqual('Clean Template');
    expect(result!.template!.description).toEqual('A clean professional template');
    expect(result!.template!.is_active).toEqual(true);
    expect(result!.template!.css_styles).toEqual('body { font-family: serif; }');
    expect(result!.template!.html_template).toEqual('<div class="resume">{{content}}</div>');
  });

  it('should handle education with null gpa correctly', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test4@example.com',
        first_name: 'Alice',
        last_name: 'Wilson'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create resume
    const resumeResult = await db.insert(resumesTable)
      .values({
        user_id: userId,
        title: 'Test Resume',
        summary: 'Test',
        template_id: null,
        is_public: false
      })
      .returning()
      .execute();
    const resumeId = resumeResult[0].id;

    // Create education record with null gpa
    await db.insert(educationTable)
      .values({
        resume_id: resumeId,
        institution_name: 'Community College',
        degree: 'Associate Degree',
        field_of_study: 'General Studies',
        location: 'Local City',
        start_date: new Date('2020-01-01'),
        end_date: new Date('2022-05-01'),
        is_current: false,
        gpa: null, // Null GPA
        description: null,
        order_index: 0
      })
      .execute();

    const input: GetResumeByIdInput = { id: resumeId };
    const result = await getFullResume(input);

    expect(result).not.toBeNull();
    expect(result!.education).toHaveLength(1);
    expect(result!.education[0].gpa).toBeNull();
    expect(result!.education[0].institution_name).toEqual('Community College');
  });
});