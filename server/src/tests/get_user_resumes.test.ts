import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, resumesTable, resumeTemplatesTable } from '../db/schema';
import { type GetUserResumesInput } from '../schema';
import { getUserResumes } from '../handlers/get_user_resumes';
import { eq } from 'drizzle-orm';

describe('getUserResumes', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all resumes for a specific user', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create multiple resumes for the user
    const resume1 = await db.insert(resumesTable)
      .values({
        user_id: userId,
        title: 'Software Engineer Resume',
        summary: 'Experienced software engineer',
        is_public: true
      })
      .returning()
      .execute();

    const resume2 = await db.insert(resumesTable)
      .values({
        user_id: userId,
        title: 'Data Scientist Resume',
        summary: 'Data science specialist',
        is_public: false
      })
      .returning()
      .execute();

    const input: GetUserResumesInput = {
      user_id: userId
    };

    const result = await getUserResumes(input);

    // Should return both resumes
    expect(result).toHaveLength(2);
    
    // Check that all returned resumes belong to the correct user
    result.forEach(resume => {
      expect(resume.user_id).toEqual(userId);
    });

    // Verify resume titles are present
    const resumeTitles = result.map(r => r.title);
    expect(resumeTitles).toContain('Software Engineer Resume');
    expect(resumeTitles).toContain('Data Scientist Resume');
  });

  it('should return empty array for user with no resumes', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'noResumes@example.com',
        first_name: 'Jane',
        last_name: 'Smith'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    const input: GetUserResumesInput = {
      user_id: userId
    };

    const result = await getUserResumes(input);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return empty array for non-existent user', async () => {
    const input: GetUserResumesInput = {
      user_id: 99999 // Non-existent user ID
    };

    const result = await getUserResumes(input);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return resumes with correct data structure', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'structure@example.com',
        first_name: 'Test',
        last_name: 'User'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create resume template for testing
    const templateResult = await db.insert(resumeTemplatesTable)
      .values({
        name: 'Test Template',
        css_styles: 'body { color: black; }',
        html_template: '<div>{{content}}</div>',
        is_active: true
      })
      .returning()
      .execute();

    const templateId = templateResult[0].id;

    // Create resume with template
    await db.insert(resumesTable)
      .values({
        user_id: userId,
        title: 'Full Stack Developer',
        summary: 'Full stack development experience',
        template_id: templateId,
        is_public: true
      })
      .returning()
      .execute();

    const input: GetUserResumesInput = {
      user_id: userId
    };

    const result = await getUserResumes(input);

    expect(result).toHaveLength(1);
    
    const resume = result[0];
    expect(resume.id).toBeDefined();
    expect(resume.user_id).toEqual(userId);
    expect(resume.title).toEqual('Full Stack Developer');
    expect(resume.summary).toEqual('Full stack development experience');
    expect(resume.template_id).toEqual(templateId);
    expect(resume.is_public).toBe(true);
    expect(resume.created_at).toBeInstanceOf(Date);
    expect(resume.updated_at).toBeInstanceOf(Date);
  });

  it('should only return resumes for the specified user', async () => {
    // Create two different users
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        first_name: 'User',
        last_name: 'One'
      })
      .returning()
      .execute();

    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        first_name: 'User',
        last_name: 'Two'
      })
      .returning()
      .execute();

    const user1Id = user1Result[0].id;
    const user2Id = user2Result[0].id;

    // Create resumes for both users
    await db.insert(resumesTable)
      .values({
        user_id: user1Id,
        title: 'User 1 Resume',
        summary: 'First user resume',
        is_public: true
      })
      .execute();

    await db.insert(resumesTable)
      .values({
        user_id: user2Id,
        title: 'User 2 Resume',
        summary: 'Second user resume',
        is_public: false
      })
      .execute();

    // Query resumes for user 1
    const input: GetUserResumesInput = {
      user_id: user1Id
    };

    const result = await getUserResumes(input);

    // Should only return user 1's resume
    expect(result).toHaveLength(1);
    expect(result[0].user_id).toEqual(user1Id);
    expect(result[0].title).toEqual('User 1 Resume');
    
    // Verify no resumes from other users are returned
    const userIds = result.map(r => r.user_id);
    expect(userIds).not.toContain(user2Id);
  });

  it('should save resumes to database correctly', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'dbtest@example.com',
        first_name: 'Database',
        last_name: 'Test'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create resume
    const resumeResult = await db.insert(resumesTable)
      .values({
        user_id: userId,
        title: 'Database Test Resume',
        summary: 'Testing database operations',
        is_public: false
      })
      .returning()
      .execute();

    // Verify resume exists in database
    const savedResumes = await db.select()
      .from(resumesTable)
      .where(eq(resumesTable.id, resumeResult[0].id))
      .execute();

    expect(savedResumes).toHaveLength(1);
    expect(savedResumes[0].title).toEqual('Database Test Resume');
    expect(savedResumes[0].user_id).toEqual(userId);

    // Test our handler
    const input: GetUserResumesInput = {
      user_id: userId
    };

    const result = await getUserResumes(input);
    
    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(resumeResult[0].id);
    expect(result[0].title).toEqual('Database Test Resume');
  });
});