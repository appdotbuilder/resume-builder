import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, resumesTable, resumeTemplatesTable } from '../db/schema';
import { type GetResumeByIdInput } from '../schema';
import { getResumeById } from '../handlers/get_resume_by_id';

describe('getResumeById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return resume when found', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe'
      })
      .returning()
      .execute();

    const user = userResult[0];

    // Create a test resume
    const resumeResult = await db.insert(resumesTable)
      .values({
        user_id: user.id,
        title: 'Software Engineer Resume',
        summary: 'Experienced software engineer with 5 years of experience',
        is_public: true
      })
      .returning()
      .execute();

    const createdResume = resumeResult[0];

    // Test the handler
    const input: GetResumeByIdInput = {
      id: createdResume.id
    };

    const result = await getResumeById(input);

    // Validate the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdResume.id);
    expect(result!.user_id).toEqual(user.id);
    expect(result!.title).toEqual('Software Engineer Resume');
    expect(result!.summary).toEqual('Experienced software engineer with 5 years of experience');
    expect(result!.is_public).toEqual(true);
    expect(result!.template_id).toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when resume not found', async () => {
    const input: GetResumeByIdInput = {
      id: 99999 // Non-existent ID
    };

    const result = await getResumeById(input);

    expect(result).toBeNull();
  });

  it('should return resume with template_id when template is assigned', async () => {
    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'template-test@example.com',
        first_name: 'Jane',
        last_name: 'Smith'
      })
      .returning()
      .execute();

    const user = userResult[0];

    // Create a test template first
    const templateResult = await db.insert(resumeTemplatesTable)
      .values({
        name: 'Test Template',
        description: 'A template for testing',
        css_styles: 'body { font-family: Arial; }',
        html_template: '<html><body>{{content}}</body></html>',
        is_active: true
      })
      .returning()
      .execute();

    const template = templateResult[0];

    // Create a test resume with template_id
    const resumeResult = await db.insert(resumesTable)
      .values({
        user_id: user.id,
        title: 'Resume with Template',
        summary: 'A resume using a template',
        template_id: template.id,
        is_public: false
      })
      .returning()
      .execute();

    const createdResume = resumeResult[0];

    const input: GetResumeByIdInput = {
      id: createdResume.id
    };

    const result = await getResumeById(input);

    // Validate the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdResume.id);
    expect(result!.title).toEqual('Resume with Template');
    expect(result!.template_id).toEqual(template.id);
    expect(result!.is_public).toEqual(false);
  });

  it('should return resume with all nullable fields as null', async () => {
    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'minimal@example.com',
        first_name: 'Min',
        last_name: 'Test'
      })
      .returning()
      .execute();

    const user = userResult[0];

    // Create a minimal resume with only required fields
    const resumeResult = await db.insert(resumesTable)
      .values({
        user_id: user.id,
        title: 'Minimal Resume'
        // summary and template_id will be null
        // is_public will default to false
      })
      .returning()
      .execute();

    const createdResume = resumeResult[0];

    const input: GetResumeByIdInput = {
      id: createdResume.id
    };

    const result = await getResumeById(input);

    // Validate the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdResume.id);
    expect(result!.title).toEqual('Minimal Resume');
    expect(result!.summary).toBeNull();
    expect(result!.template_id).toBeNull();
    expect(result!.is_public).toEqual(false);
  });
});