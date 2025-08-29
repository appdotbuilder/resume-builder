import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { resumesTable, usersTable, resumeTemplatesTable } from '../db/schema';
import { type CreateResumeInput } from '../schema';
import { createResume } from '../handlers/create_resume';
import { eq } from 'drizzle-orm';

describe('createResume', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUser: { id: number };
  let testTemplate: { id: number };

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
    testUser = userResult[0];

    // Create test resume template
    const templateResult = await db.insert(resumeTemplatesTable)
      .values({
        name: 'Test Template',
        description: 'A template for testing',
        css_styles: 'body { font-family: Arial; }',
        html_template: '<div>{{content}}</div>',
        is_active: true
      })
      .returning()
      .execute();
    testTemplate = templateResult[0];
  });

  it('should create a resume with minimal required fields', async () => {
    const testInput: CreateResumeInput = {
      user_id: testUser.id,
      title: 'Software Engineer Resume',
      summary: null,
      template_id: null
    };

    const result = await createResume(testInput);

    // Basic field validation
    expect(result.id).toBeDefined();
    expect(result.user_id).toEqual(testUser.id);
    expect(result.title).toEqual('Software Engineer Resume');
    expect(result.summary).toBeNull();
    expect(result.template_id).toBeNull();
    expect(result.is_public).toBe(false); // Default value
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a resume with all fields provided', async () => {
    const testInput: CreateResumeInput = {
      user_id: testUser.id,
      title: 'Full Stack Developer Resume',
      summary: 'Experienced developer with 5 years in web development',
      template_id: testTemplate.id,
      is_public: true
    };

    const result = await createResume(testInput);

    expect(result.id).toBeDefined();
    expect(result.user_id).toEqual(testUser.id);
    expect(result.title).toEqual('Full Stack Developer Resume');
    expect(result.summary).toEqual('Experienced developer with 5 years in web development');
    expect(result.template_id).toEqual(testTemplate.id);
    expect(result.is_public).toBe(true);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save resume to database', async () => {
    const testInput: CreateResumeInput = {
      user_id: testUser.id,
      title: 'Database Test Resume',
      summary: 'Testing database persistence',
      template_id: testTemplate.id,
      is_public: false
    };

    const result = await createResume(testInput);

    // Query the database to verify persistence
    const resumes = await db.select()
      .from(resumesTable)
      .where(eq(resumesTable.id, result.id))
      .execute();

    expect(resumes).toHaveLength(1);
    const savedResume = resumes[0];
    expect(savedResume.id).toEqual(result.id);
    expect(savedResume.user_id).toEqual(testUser.id);
    expect(savedResume.title).toEqual('Database Test Resume');
    expect(savedResume.summary).toEqual('Testing database persistence');
    expect(savedResume.template_id).toEqual(testTemplate.id);
    expect(savedResume.is_public).toBe(false);
    expect(savedResume.created_at).toBeInstanceOf(Date);
    expect(savedResume.updated_at).toBeInstanceOf(Date);
  });

  it('should handle default values correctly', async () => {
    const testInput: CreateResumeInput = {
      user_id: testUser.id,
      title: 'Default Values Test',
      summary: null,
      template_id: null
      // is_public not provided - should default to false
    };

    const result = await createResume(testInput);

    expect(result.is_public).toBe(false);
    expect(result.summary).toBeNull();
    expect(result.template_id).toBeNull();
  });

  it('should fail with invalid user_id', async () => {
    const testInput: CreateResumeInput = {
      user_id: 999999, // Non-existent user ID
      title: 'Invalid User Test',
      summary: null,
      template_id: null
    };

    await expect(createResume(testInput)).rejects.toThrow(/foreign key constraint/i);
  });

  it('should fail with invalid template_id', async () => {
    const testInput: CreateResumeInput = {
      user_id: testUser.id,
      title: 'Invalid Template Test',
      summary: null,
      template_id: 999999 // Non-existent template ID
    };

    await expect(createResume(testInput)).rejects.toThrow(/foreign key constraint/i);
  });

  it('should create multiple resumes for the same user', async () => {
    const testInput1: CreateResumeInput = {
      user_id: testUser.id,
      title: 'First Resume',
      summary: null,
      template_id: null
    };

    const testInput2: CreateResumeInput = {
      user_id: testUser.id,
      title: 'Second Resume',
      summary: 'Different resume for same user',
      template_id: testTemplate.id,
      is_public: true
    };

    const result1 = await createResume(testInput1);
    const result2 = await createResume(testInput2);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.user_id).toEqual(result2.user_id);
    expect(result1.title).toEqual('First Resume');
    expect(result2.title).toEqual('Second Resume');

    // Verify both are saved in database
    const resumes = await db.select()
      .from(resumesTable)
      .where(eq(resumesTable.user_id, testUser.id))
      .execute();

    expect(resumes).toHaveLength(2);
  });
});