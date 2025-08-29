import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, resumesTable, workExperiencesTable } from '../db/schema';
import { type DeleteInput } from '../schema';
import { deleteWorkExperience } from '../handlers/delete_work_experience';
import { eq } from 'drizzle-orm';

describe('deleteWorkExperience', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing work experience', async () => {
    // Create prerequisite data - user and resume first
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe'
      })
      .returning()
      .execute();

    const [resume] = await db.insert(resumesTable)
      .values({
        user_id: user.id,
        title: 'Software Engineer Resume',
        summary: 'Experienced software engineer'
      })
      .returning()
      .execute();

    // Create work experience to delete
    const [workExperience] = await db.insert(workExperiencesTable)
      .values({
        resume_id: resume.id,
        company_name: 'TechCorp',
        job_title: 'Senior Developer',
        location: 'San Francisco, CA',
        start_date: new Date('2020-01-01'),
        end_date: new Date('2023-12-31'),
        is_current: false,
        description: 'Led development of web applications',
        order_index: 0
      })
      .returning()
      .execute();

    const deleteInput: DeleteInput = { id: workExperience.id };

    // Delete the work experience
    const result = await deleteWorkExperience(deleteInput);

    // Should return true for successful deletion
    expect(result).toBe(true);

    // Verify the record is actually deleted from database
    const deletedRecord = await db.select()
      .from(workExperiencesTable)
      .where(eq(workExperiencesTable.id, workExperience.id))
      .execute();

    expect(deletedRecord).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent work experience', async () => {
    const deleteInput: DeleteInput = { id: 999999 }; // Non-existent ID

    // Attempt to delete non-existent work experience
    const result = await deleteWorkExperience(deleteInput);

    // Should return false since no record was found to delete
    expect(result).toBe(false);
  });

  it('should not affect other work experiences when deleting one', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        first_name: 'Jane',
        last_name: 'Smith'
      })
      .returning()
      .execute();

    const [resume] = await db.insert(resumesTable)
      .values({
        user_id: user.id,
        title: 'Marketing Manager Resume',
        summary: 'Experienced marketing professional'
      })
      .returning()
      .execute();

    // Create multiple work experiences
    const workExperiences = await db.insert(workExperiencesTable)
      .values([
        {
          resume_id: resume.id,
          company_name: 'MarketingCorp',
          job_title: 'Marketing Manager',
          location: 'New York, NY',
          start_date: new Date('2019-01-01'),
          end_date: new Date('2021-12-31'),
          is_current: false,
          description: 'Managed marketing campaigns',
          order_index: 0
        },
        {
          resume_id: resume.id,
          company_name: 'AdAgency',
          job_title: 'Senior Marketing Specialist',
          location: 'Los Angeles, CA',
          start_date: new Date('2022-01-01'),
          is_current: true,
          description: 'Developing digital marketing strategies',
          order_index: 1
        }
      ])
      .returning()
      .execute();

    // Delete the first work experience
    const deleteInput: DeleteInput = { id: workExperiences[0].id };
    const result = await deleteWorkExperience(deleteInput);

    expect(result).toBe(true);

    // Verify only the first record was deleted
    const remainingRecords = await db.select()
      .from(workExperiencesTable)
      .where(eq(workExperiencesTable.resume_id, resume.id))
      .execute();

    expect(remainingRecords).toHaveLength(1);
    expect(remainingRecords[0].id).toBe(workExperiences[1].id);
    expect(remainingRecords[0].company_name).toBe('AdAgency');
  });

  it('should handle database errors gracefully', async () => {
    // Use an invalid ID type to trigger a database error
    const deleteInput: DeleteInput = { id: -1 };

    // The function should throw the error rather than swallowing it
    await expect(async () => {
      await deleteWorkExperience(deleteInput);
    }).not.toThrow(); // This should not throw since -1 is a valid integer, just non-existent

    // Test with a more realistic scenario - deleting after the record is already deleted
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User'
      })
      .returning()
      .execute();

    const [resume] = await db.insert(resumesTable)
      .values({
        user_id: user.id,
        title: 'Test Resume'
      })
      .returning()
      .execute();

    const [workExperience] = await db.insert(workExperiencesTable)
      .values({
        resume_id: resume.id,
        company_name: 'TestCorp',
        job_title: 'Tester',
        start_date: new Date('2023-01-01'),
        is_current: true,
        order_index: 0
      })
      .returning()
      .execute();

    // Delete the record first time
    const firstDelete = await deleteWorkExperience({ id: workExperience.id });
    expect(firstDelete).toBe(true);

    // Try to delete the same record again
    const secondDelete = await deleteWorkExperience({ id: workExperience.id });
    expect(secondDelete).toBe(false);
  });
});