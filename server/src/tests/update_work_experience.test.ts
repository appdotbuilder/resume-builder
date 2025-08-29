import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, resumesTable, workExperiencesTable } from '../db/schema';
import { type UpdateWorkExperienceInput } from '../schema';
import { updateWorkExperience } from '../handlers/update_work_experience';
import { eq } from 'drizzle-orm';

describe('updateWorkExperience', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let userId: number;
  let resumeId: number;
  let workExperienceId: number;

  beforeEach(async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User'
      })
      .returning()
      .execute();
    
    userId = userResult[0].id;

    // Create prerequisite resume
    const resumeResult = await db.insert(resumesTable)
      .values({
        user_id: userId,
        title: 'Test Resume'
      })
      .returning()
      .execute();

    resumeId = resumeResult[0].id;

    // Create prerequisite work experience
    const workExpResult = await db.insert(workExperiencesTable)
      .values({
        resume_id: resumeId,
        company_name: 'Original Company',
        job_title: 'Original Title',
        location: 'Original Location',
        start_date: new Date('2020-01-01'),
        end_date: new Date('2021-01-01'),
        is_current: false,
        description: 'Original description',
        order_index: 0
      })
      .returning()
      .execute();

    workExperienceId = workExpResult[0].id;
  });

  it('should update all fields of work experience', async () => {
    const updateInput: UpdateWorkExperienceInput = {
      id: workExperienceId,
      company_name: 'Updated Company',
      job_title: 'Updated Title',
      location: 'Updated Location',
      start_date: new Date('2022-01-01'),
      end_date: new Date('2023-01-01'),
      is_current: true,
      description: 'Updated description',
      order_index: 5
    };

    const result = await updateWorkExperience(updateInput);

    expect(result.id).toEqual(workExperienceId);
    expect(result.company_name).toEqual('Updated Company');
    expect(result.job_title).toEqual('Updated Title');
    expect(result.location).toEqual('Updated Location');
    expect(result.start_date).toEqual(new Date('2022-01-01'));
    expect(result.end_date).toEqual(new Date('2023-01-01'));
    expect(result.is_current).toEqual(true);
    expect(result.description).toEqual('Updated description');
    expect(result.order_index).toEqual(5);
    expect(result.resume_id).toEqual(resumeId);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update only specified fields', async () => {
    const updateInput: UpdateWorkExperienceInput = {
      id: workExperienceId,
      company_name: 'Partially Updated Company',
      is_current: true
    };

    const result = await updateWorkExperience(updateInput);

    // Updated fields
    expect(result.company_name).toEqual('Partially Updated Company');
    expect(result.is_current).toEqual(true);

    // Unchanged fields should retain original values
    expect(result.job_title).toEqual('Original Title');
    expect(result.location).toEqual('Original Location');
    expect(result.start_date).toEqual(new Date('2020-01-01'));
    expect(result.end_date).toEqual(new Date('2021-01-01'));
    expect(result.description).toEqual('Original description');
    expect(result.order_index).toEqual(0);
  });

  it('should update nullable fields to null', async () => {
    const updateInput: UpdateWorkExperienceInput = {
      id: workExperienceId,
      location: null,
      end_date: null,
      description: null
    };

    const result = await updateWorkExperience(updateInput);

    expect(result.location).toBeNull();
    expect(result.end_date).toBeNull();
    expect(result.description).toBeNull();
    
    // Non-nullable fields should remain unchanged
    expect(result.company_name).toEqual('Original Company');
    expect(result.job_title).toEqual('Original Title');
    expect(result.start_date).toEqual(new Date('2020-01-01'));
  });

  it('should persist updates to database', async () => {
    const updateInput: UpdateWorkExperienceInput = {
      id: workExperienceId,
      company_name: 'Database Updated Company',
      job_title: 'Database Updated Title'
    };

    await updateWorkExperience(updateInput);

    // Query database directly to verify persistence
    const workExperiences = await db.select()
      .from(workExperiencesTable)
      .where(eq(workExperiencesTable.id, workExperienceId))
      .execute();

    expect(workExperiences).toHaveLength(1);
    expect(workExperiences[0].company_name).toEqual('Database Updated Company');
    expect(workExperiences[0].job_title).toEqual('Database Updated Title');
    expect(workExperiences[0].location).toEqual('Original Location'); // unchanged
  });

  it('should throw error for non-existent work experience', async () => {
    const updateInput: UpdateWorkExperienceInput = {
      id: 99999,
      company_name: 'Non-existent Update'
    };

    await expect(updateWorkExperience(updateInput)).rejects.toThrow(/Work experience with id 99999 not found/i);
  });

  it('should handle date updates correctly', async () => {
    const newStartDate = new Date('2023-06-15');
    const newEndDate = new Date('2024-06-15');

    const updateInput: UpdateWorkExperienceInput = {
      id: workExperienceId,
      start_date: newStartDate,
      end_date: newEndDate
    };

    const result = await updateWorkExperience(updateInput);

    expect(result.start_date).toEqual(newStartDate);
    expect(result.end_date).toEqual(newEndDate);
    
    // Verify dates are properly stored as Date objects
    expect(result.start_date).toBeInstanceOf(Date);
    expect(result.end_date).toBeInstanceOf(Date);
  });

  it('should handle boolean field updates correctly', async () => {
    // Update from false to true
    const updateInput1: UpdateWorkExperienceInput = {
      id: workExperienceId,
      is_current: true
    };

    const result1 = await updateWorkExperience(updateInput1);
    expect(result1.is_current).toEqual(true);

    // Update from true to false
    const updateInput2: UpdateWorkExperienceInput = {
      id: workExperienceId,
      is_current: false
    };

    const result2 = await updateWorkExperience(updateInput2);
    expect(result2.is_current).toEqual(false);
  });
});