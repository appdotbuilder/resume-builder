import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, resumesTable, resumeTemplatesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdateResumeInput } from '../schema';
import { updateResume } from '../handlers/update_resume';

describe('updateResume', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let userId: number;
  let resumeId: number;
  let templateId: number;

  beforeEach(async () => {
    // Create a user for testing
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User'
      })
      .returning()
      .execute();
    userId = userResult[0].id;

    // Create a resume template for testing
    const templateResult = await db.insert(resumeTemplatesTable)
      .values({
        name: 'Test Template',
        css_styles: 'body { color: black; }',
        html_template: '<html><body>{{content}}</body></html>'
      })
      .returning()
      .execute();
    templateId = templateResult[0].id;

    // Create a resume for testing
    const resumeResult = await db.insert(resumesTable)
      .values({
        user_id: userId,
        title: 'Original Title',
        summary: 'Original summary',
        template_id: null,
        is_public: false
      })
      .returning()
      .execute();
    resumeId = resumeResult[0].id;
  });

  it('should update resume title', async () => {
    const updateInput: UpdateResumeInput = {
      id: resumeId,
      title: 'Updated Title'
    };

    const result = await updateResume(updateInput);

    expect(result.id).toEqual(resumeId);
    expect(result.title).toEqual('Updated Title');
    expect(result.summary).toEqual('Original summary'); // Should remain unchanged
    expect(result.is_public).toEqual(false); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update resume summary', async () => {
    const updateInput: UpdateResumeInput = {
      id: resumeId,
      summary: 'New and improved summary'
    };

    const result = await updateResume(updateInput);

    expect(result.summary).toEqual('New and improved summary');
    expect(result.title).toEqual('Original Title'); // Should remain unchanged
  });

  it('should update template_id', async () => {
    const updateInput: UpdateResumeInput = {
      id: resumeId,
      template_id: templateId
    };

    const result = await updateResume(updateInput);

    expect(result.template_id).toEqual(templateId);
    expect(result.title).toEqual('Original Title'); // Should remain unchanged
  });

  it('should update is_public status', async () => {
    const updateInput: UpdateResumeInput = {
      id: resumeId,
      is_public: true
    };

    const result = await updateResume(updateInput);

    expect(result.is_public).toEqual(true);
    expect(result.title).toEqual('Original Title'); // Should remain unchanged
  });

  it('should update multiple fields at once', async () => {
    const updateInput: UpdateResumeInput = {
      id: resumeId,
      title: 'Multi-Update Title',
      summary: 'Multi-update summary',
      template_id: templateId,
      is_public: true
    };

    const result = await updateResume(updateInput);

    expect(result.title).toEqual('Multi-Update Title');
    expect(result.summary).toEqual('Multi-update summary');
    expect(result.template_id).toEqual(templateId);
    expect(result.is_public).toEqual(true);
    expect(result.user_id).toEqual(userId); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should set summary to null when explicitly provided', async () => {
    const updateInput: UpdateResumeInput = {
      id: resumeId,
      summary: null
    };

    const result = await updateResume(updateInput);

    expect(result.summary).toBeNull();
    expect(result.title).toEqual('Original Title'); // Should remain unchanged
  });

  it('should set template_id to null when explicitly provided', async () => {
    // First set a template
    await updateResume({
      id: resumeId,
      template_id: templateId
    });

    // Then remove it
    const updateInput: UpdateResumeInput = {
      id: resumeId,
      template_id: null
    };

    const result = await updateResume(updateInput);

    expect(result.template_id).toBeNull();
  });

  it('should update the updated_at timestamp', async () => {
    const beforeUpdate = new Date();
    
    const updateInput: UpdateResumeInput = {
      id: resumeId,
      title: 'Timestamp Test'
    };

    const result = await updateResume(updateInput);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
  });

  it('should persist changes to database', async () => {
    const updateInput: UpdateResumeInput = {
      id: resumeId,
      title: 'Database Persistence Test',
      summary: 'This should be saved',
      is_public: true
    };

    await updateResume(updateInput);

    // Verify changes were persisted by querying directly
    const savedResumes = await db.select()
      .from(resumesTable)
      .where(eq(resumesTable.id, resumeId))
      .execute();

    expect(savedResumes).toHaveLength(1);
    expect(savedResumes[0].title).toEqual('Database Persistence Test');
    expect(savedResumes[0].summary).toEqual('This should be saved');
    expect(savedResumes[0].is_public).toEqual(true);
    expect(savedResumes[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when resume does not exist', async () => {
    const updateInput: UpdateResumeInput = {
      id: 99999, // Non-existent ID
      title: 'This should fail'
    };

    await expect(updateResume(updateInput)).rejects.toThrow(/Resume with id 99999 not found/i);
  });

  it('should handle empty update (only updating timestamp)', async () => {
    const updateInput: UpdateResumeInput = {
      id: resumeId
    };

    const result = await updateResume(updateInput);

    // All original values should be preserved
    expect(result.title).toEqual('Original Title');
    expect(result.summary).toEqual('Original summary');
    expect(result.template_id).toBeNull();
    expect(result.is_public).toEqual(false);
    expect(result.user_id).toEqual(userId);
    expect(result.updated_at).toBeInstanceOf(Date);
  });
});