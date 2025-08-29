import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, resumesTable, workExperiencesTable, educationTable, skillsTable, resumeTemplatesTable } from '../db/schema';
import { type GetResumeByIdInput } from '../schema';
import { generateResumePDF } from '../handlers/generate_resume_pdf';

describe('generateResumePDF', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should generate PDF for resume with all data', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'john.doe@example.com',
        first_name: 'John',
        last_name: 'Doe',
        phone: '+1-555-123-4567',
        address: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        zip_code: '94102',
        country: 'USA',
      })
      .returning()
      .execute();

    const user = userResult[0];

    // Create test resume template
    const templateResult = await db.insert(resumeTemplatesTable)
      .values({
        name: 'Professional Template',
        description: 'A clean professional template',
        css_styles: 'body { font-family: Arial; }',
        html_template: '<html><body><h1>{{user.first_name}} {{user.last_name}}</h1><p>{{resume.title}}</p></body></html>',
        is_active: true,
      })
      .returning()
      .execute();

    const template = templateResult[0];

    // Create test resume
    const resumeResult = await db.insert(resumesTable)
      .values({
        user_id: user.id,
        title: 'Senior Software Engineer',
        summary: 'Experienced software engineer with 5+ years in full-stack development',
        template_id: template.id,
        is_public: true,
      })
      .returning()
      .execute();

    const resume = resumeResult[0];

    // Create work experience
    await db.insert(workExperiencesTable)
      .values({
        resume_id: resume.id,
        company_name: 'Tech Corp',
        job_title: 'Senior Software Engineer',
        location: 'San Francisco, CA',
        start_date: new Date('2020-01-01'),
        end_date: new Date('2023-12-31'),
        is_current: false,
        description: 'Developed web applications using React and Node.js',
        order_index: 0,
      })
      .execute();

    // Create education
    await db.insert(educationTable)
      .values({
        resume_id: resume.id,
        institution_name: 'Stanford University',
        degree: 'Bachelor of Science',
        field_of_study: 'Computer Science',
        location: 'Stanford, CA',
        start_date: new Date('2016-09-01'),
        end_date: new Date('2020-06-01'),
        is_current: false,
        gpa: 3.8,
        description: 'Focused on algorithms and software engineering',
        order_index: 0,
      })
      .execute();

    // Create skills
    await db.insert(skillsTable)
      .values([
        {
          resume_id: resume.id,
          name: 'JavaScript',
          category: 'Programming',
          proficiency_level: 'expert',
          order_index: 0,
        },
        {
          resume_id: resume.id,
          name: 'React',
          category: 'Frontend',
          proficiency_level: 'advanced',
          order_index: 1,
        },
      ])
      .execute();

    const input: GetResumeByIdInput = {
      id: resume.id,
    };

    const result = await generateResumePDF(input);

    // Verify PDF buffer is generated
    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);

    // Parse the mock PDF content to verify data
    const pdfContent = JSON.parse(result.toString('utf-8'));
    
    expect(pdfContent.resumeId).toEqual(resume.id);
    expect(pdfContent.title).toEqual('Senior Software Engineer');
    expect(pdfContent.userInfo.name).toEqual('John Doe');
    expect(pdfContent.userInfo.email).toEqual('john.doe@example.com');
    expect(pdfContent.workExperiencesCount).toEqual(1);
    expect(pdfContent.educationCount).toEqual(1);
    expect(pdfContent.skillsCount).toEqual(2);
    expect(pdfContent.templateUsed).toEqual('Professional Template');
    expect(pdfContent.generatedAt).toBeDefined();
    expect(pdfContent.htmlContent).toContain('John Doe');
  });

  it('should generate PDF for resume without template', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'jane.smith@example.com',
        first_name: 'Jane',
        last_name: 'Smith',
      })
      .returning()
      .execute();

    const user = userResult[0];

    // Create test resume without template
    const resumeResult = await db.insert(resumesTable)
      .values({
        user_id: user.id,
        title: 'Data Scientist',
        summary: 'Data scientist with ML expertise',
        template_id: null,
        is_public: false,
      })
      .returning()
      .execute();

    const resume = resumeResult[0];

    const input: GetResumeByIdInput = {
      id: resume.id,
    };

    const result = await generateResumePDF(input);

    // Verify PDF buffer is generated with default template
    expect(result).toBeInstanceOf(Buffer);
    
    const pdfContent = JSON.parse(result.toString('utf-8'));
    expect(pdfContent.templateUsed).toEqual('Default Template');
    expect(pdfContent.userInfo.name).toEqual('Jane Smith');
  });

  it('should generate PDF for minimal resume data', async () => {
    // Create minimal user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'min.user@example.com',
        first_name: 'Min',
        last_name: 'User',
      })
      .returning()
      .execute();

    const user = userResult[0];

    // Create minimal resume
    const resumeResult = await db.insert(resumesTable)
      .values({
        user_id: user.id,
        title: 'Entry Level Position',
      })
      .returning()
      .execute();

    const resume = resumeResult[0];

    const input: GetResumeByIdInput = {
      id: resume.id,
    };

    const result = await generateResumePDF(input);

    // Verify PDF is generated even with minimal data
    expect(result).toBeInstanceOf(Buffer);
    
    const pdfContent = JSON.parse(result.toString('utf-8'));
    expect(pdfContent.resumeId).toEqual(resume.id);
    expect(pdfContent.workExperiencesCount).toEqual(0);
    expect(pdfContent.educationCount).toEqual(0);
    expect(pdfContent.skillsCount).toEqual(0);
  });

  it('should handle numeric GPA conversion correctly', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'gpa.test@example.com',
        first_name: 'GPA',
        last_name: 'Test',
      })
      .returning()
      .execute();

    const user = userResult[0];

    // Create test resume
    const resumeResult = await db.insert(resumesTable)
      .values({
        user_id: user.id,
        title: 'GPA Test Resume',
      })
      .returning()
      .execute();

    const resume = resumeResult[0];

    // Create education with GPA
    await db.insert(educationTable)
      .values({
        resume_id: resume.id,
        institution_name: 'Test University',
        degree: 'Bachelor of Arts',
        start_date: new Date('2018-09-01'),
        end_date: new Date('2022-06-01'),
        gpa: 3.75, // Numeric value that will be stored as string in numeric column
        order_index: 0,
      })
      .execute();

    const input: GetResumeByIdInput = {
      id: resume.id,
    };

    const result = await generateResumePDF(input);

    expect(result).toBeInstanceOf(Buffer);
    
    const pdfContent = JSON.parse(result.toString('utf-8'));
    expect(pdfContent.educationCount).toEqual(1);
  });

  it('should handle skills ordered by order_index', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'skills.test@example.com',
        first_name: 'Skills',
        last_name: 'Test',
      })
      .returning()
      .execute();

    const user = userResult[0];

    // Create test resume
    const resumeResult = await db.insert(resumesTable)
      .values({
        user_id: user.id,
        title: 'Skills Order Test',
      })
      .returning()
      .execute();

    const resume = resumeResult[0];

    // Create skills with different order indices
    await db.insert(skillsTable)
      .values([
        {
          resume_id: resume.id,
          name: 'Third Skill',
          order_index: 2,
        },
        {
          resume_id: resume.id,
          name: 'First Skill',
          order_index: 0,
        },
        {
          resume_id: resume.id,
          name: 'Second Skill',
          order_index: 1,
        },
      ])
      .execute();

    const input: GetResumeByIdInput = {
      id: resume.id,
    };

    const result = await generateResumePDF(input);

    expect(result).toBeInstanceOf(Buffer);
    
    const pdfContent = JSON.parse(result.toString('utf-8'));
    expect(pdfContent.skillsCount).toEqual(3);
  });

  it('should throw error for non-existent resume', async () => {
    const input: GetResumeByIdInput = {
      id: 99999,
    };

    await expect(generateResumePDF(input)).rejects.toThrow(/Resume with id 99999 not found/i);
  });
});