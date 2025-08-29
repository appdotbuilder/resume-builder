import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, resumesTable, educationTable } from '../db/schema';
import { type DeleteInput, type CreateUserInput, type CreateResumeInput } from '../schema';
import { deleteEducation } from '../handlers/delete_education';
import { eq } from 'drizzle-orm';

// Test input for deletion
const testDeleteInput: DeleteInput = {
  id: 1
};

// Setup data for testing
const testUser: CreateUserInput = {
  email: 'test@example.com',
  first_name: 'John',
  last_name: 'Doe',
  phone: null,
  address: null,
  city: null,
  state: null,
  zip_code: null,
  country: null,
};

const testResume: CreateResumeInput = {
  user_id: 1,
  title: 'Software Developer Resume',
  summary: 'Experienced developer',
  template_id: null,
  is_public: false,
};

describe('deleteEducation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing education entry', async () => {
    // Create prerequisite user
    await db.insert(usersTable)
      .values({
        email: testUser.email,
        first_name: testUser.first_name,
        last_name: testUser.last_name,
        phone: testUser.phone,
        address: testUser.address,
        city: testUser.city,
        state: testUser.state,
        zip_code: testUser.zip_code,
        country: testUser.country,
      })
      .execute();

    // Create prerequisite resume
    await db.insert(resumesTable)
      .values({
        user_id: testResume.user_id,
        title: testResume.title,
        summary: testResume.summary,
        template_id: testResume.template_id,
        is_public: testResume.is_public || false,
      })
      .execute();

    // Create education entry to delete
    const educationResult = await db.insert(educationTable)
      .values({
        resume_id: 1,
        institution_name: 'Test University',
        degree: 'Bachelor of Science',
        field_of_study: 'Computer Science',
        location: 'New York, NY',
        start_date: new Date('2018-09-01'),
        end_date: new Date('2022-05-01'),
        is_current: false,
        gpa: 3.8,
        description: 'Graduated magna cum laude',
        order_index: 1,
      })
      .returning()
      .execute();

    const educationId = educationResult[0].id;

    // Delete the education entry
    const result = await deleteEducation({ id: educationId });

    // Verify deletion was successful
    expect(result).toBe(true);

    // Verify education entry no longer exists in database
    const educationEntries = await db.select()
      .from(educationTable)
      .where(eq(educationTable.id, educationId))
      .execute();

    expect(educationEntries).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent education entry', async () => {
    // Attempt to delete education entry that doesn't exist
    const result = await deleteEducation({ id: 999 });

    // Should return false since no record was found
    expect(result).toBe(false);
  });

  it('should not affect other education entries when deleting one', async () => {
    // Create prerequisite user
    await db.insert(usersTable)
      .values({
        email: testUser.email,
        first_name: testUser.first_name,
        last_name: testUser.last_name,
        phone: testUser.phone,
        address: testUser.address,
        city: testUser.city,
        state: testUser.state,
        zip_code: testUser.zip_code,
        country: testUser.country,
      })
      .execute();

    // Create prerequisite resume
    await db.insert(resumesTable)
      .values({
        user_id: testResume.user_id,
        title: testResume.title,
        summary: testResume.summary,
        template_id: testResume.template_id,
        is_public: testResume.is_public || false,
      })
      .execute();

    // Create multiple education entries
    const educationEntries = await db.insert(educationTable)
      .values([
        {
          resume_id: 1,
          institution_name: 'Test University',
          degree: 'Bachelor of Science',
          field_of_study: 'Computer Science',
          location: 'New York, NY',
          start_date: new Date('2018-09-01'),
          end_date: new Date('2022-05-01'),
          is_current: false,
          gpa: 3.8,
          description: 'First education entry',
          order_index: 1,
        },
        {
          resume_id: 1,
          institution_name: 'Another University',
          degree: 'Master of Science',
          field_of_study: 'Software Engineering',
          location: 'Boston, MA',
          start_date: new Date('2022-09-01'),
          end_date: new Date('2024-05-01'),
          is_current: false,
          gpa: 3.9,
          description: 'Second education entry',
          order_index: 2,
        }
      ])
      .returning()
      .execute();

    const firstEducationId = educationEntries[0].id;
    const secondEducationId = educationEntries[1].id;

    // Delete only the first education entry
    const result = await deleteEducation({ id: firstEducationId });

    // Verify deletion was successful
    expect(result).toBe(true);

    // Verify first education entry was deleted
    const deletedEducation = await db.select()
      .from(educationTable)
      .where(eq(educationTable.id, firstEducationId))
      .execute();

    expect(deletedEducation).toHaveLength(0);

    // Verify second education entry still exists
    const remainingEducation = await db.select()
      .from(educationTable)
      .where(eq(educationTable.id, secondEducationId))
      .execute();

    expect(remainingEducation).toHaveLength(1);
    expect(remainingEducation[0].institution_name).toEqual('Another University');
  });

  it('should handle deletion with valid ID structure', async () => {
    // Create prerequisite user
    await db.insert(usersTable)
      .values({
        email: testUser.email,
        first_name: testUser.first_name,
        last_name: testUser.last_name,
        phone: testUser.phone,
        address: testUser.address,
        city: testUser.city,
        state: testUser.state,
        zip_code: testUser.zip_code,
        country: testUser.country,
      })
      .execute();

    // Create prerequisite resume
    await db.insert(resumesTable)
      .values({
        user_id: testResume.user_id,
        title: testResume.title,
        summary: testResume.summary,
        template_id: testResume.template_id,
        is_public: testResume.is_public || false,
      })
      .execute();

    // Create education entry
    const educationResult = await db.insert(educationTable)
      .values({
        resume_id: 1,
        institution_name: 'Test College',
        degree: 'Associate Degree',
        field_of_study: null,
        location: null,
        start_date: new Date('2016-09-01'),
        end_date: null,
        is_current: true,
        gpa: null,
        description: null,
        order_index: 0,
      })
      .returning()
      .execute();

    const educationId = educationResult[0].id;

    // Verify the education entry exists before deletion
    const beforeDeletion = await db.select()
      .from(educationTable)
      .where(eq(educationTable.id, educationId))
      .execute();

    expect(beforeDeletion).toHaveLength(1);
    expect(typeof beforeDeletion[0].id).toBe('number');

    // Delete using the ID
    const result = await deleteEducation({ id: educationId });

    // Verify successful deletion
    expect(result).toBe(true);

    // Verify education entry is gone
    const afterDeletion = await db.select()
      .from(educationTable)
      .where(eq(educationTable.id, educationId))
      .execute();

    expect(afterDeletion).toHaveLength(0);
  });
});