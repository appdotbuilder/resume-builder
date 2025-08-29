import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, resumesTable, educationTable } from '../db/schema';
import { type GetResumeEducationsInput } from '../schema';
import { getResumeEducations } from '../handlers/get_resume_educations';

describe('getResumeEducations', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should fetch education entries for a resume ordered by order_index', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test resume
    const resumeResult = await db.insert(resumesTable)
      .values({
        user_id: userId,
        title: 'Test Resume'
      })
      .returning()
      .execute();

    const resumeId = resumeResult[0].id;

    // Create multiple education entries with different order_index values
    await db.insert(educationTable)
      .values([
        {
          resume_id: resumeId,
          institution_name: 'University B',
          degree: 'Bachelor of Arts',
          field_of_study: 'English',
          start_date: new Date('2015-09-01'),
          end_date: new Date('2019-05-01'),
          is_current: false,
          gpa: 3.8,
          order_index: 2
        },
        {
          resume_id: resumeId,
          institution_name: 'University A',
          degree: 'Master of Science',
          field_of_study: 'Computer Science',
          start_date: new Date('2019-09-01'),
          end_date: new Date('2021-05-01'),
          is_current: false,
          gpa: 3.9,
          order_index: 1
        },
        {
          resume_id: resumeId,
          institution_name: 'Community College',
          degree: 'Associate Degree',
          field_of_study: 'General Studies',
          start_date: new Date('2013-09-01'),
          end_date: new Date('2015-05-01'),
          is_current: false,
          gpa: 3.5,
          order_index: 3
        }
      ])
      .execute();

    const input: GetResumeEducationsInput = {
      resume_id: resumeId
    };

    const result = await getResumeEducations(input);

    // Verify results are ordered by order_index
    expect(result).toHaveLength(3);
    expect(result[0].institution_name).toBe('University A');
    expect(result[0].order_index).toBe(1);
    expect(result[1].institution_name).toBe('University B');
    expect(result[1].order_index).toBe(2);
    expect(result[2].institution_name).toBe('Community College');
    expect(result[2].order_index).toBe(3);

    // Verify numeric field conversion (gpa)
    expect(typeof result[0].gpa).toBe('number');
    expect(result[0].gpa).toBe(3.9);
    expect(typeof result[1].gpa).toBe('number');
    expect(result[1].gpa).toBe(3.8);
    expect(typeof result[2].gpa).toBe('number');
    expect(result[2].gpa).toBe(3.5);
  });

  it('should return empty array when resume has no education entries', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test resume (but no education entries)
    const resumeResult = await db.insert(resumesTable)
      .values({
        user_id: userId,
        title: 'Empty Resume'
      })
      .returning()
      .execute();

    const resumeId = resumeResult[0].id;

    const input: GetResumeEducationsInput = {
      resume_id: resumeId
    };

    const result = await getResumeEducations(input);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle education entries with null gpa values', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test resume
    const resumeResult = await db.insert(resumesTable)
      .values({
        user_id: userId,
        title: 'Test Resume'
      })
      .returning()
      .execute();

    const resumeId = resumeResult[0].id;

    // Create education entry with null gpa
    await db.insert(educationTable)
      .values({
        resume_id: resumeId,
        institution_name: 'Test University',
        degree: 'Bachelor of Science',
        field_of_study: 'Mathematics',
        start_date: new Date('2015-09-01'),
        end_date: new Date('2019-05-01'),
        is_current: false,
        gpa: null, // null gpa value
        order_index: 1
      })
      .execute();

    const input: GetResumeEducationsInput = {
      resume_id: resumeId
    };

    const result = await getResumeEducations(input);

    expect(result).toHaveLength(1);
    expect(result[0].gpa).toBeNull();
    expect(result[0].institution_name).toBe('Test University');
  });

  it('should handle education entries with all optional fields', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test resume
    const resumeResult = await db.insert(resumesTable)
      .values({
        user_id: userId,
        title: 'Test Resume'
      })
      .returning()
      .execute();

    const resumeId = resumeResult[0].id;

    // Create education entry with all optional fields populated
    await db.insert(educationTable)
      .values({
        resume_id: resumeId,
        institution_name: 'Full University',
        degree: 'Doctor of Philosophy',
        field_of_study: 'Physics',
        location: 'Boston, MA',
        start_date: new Date('2020-09-01'),
        end_date: new Date('2024-05-01'),
        is_current: false,
        gpa: 4.0,
        description: 'Specialized in quantum mechanics research',
        order_index: 1
      })
      .execute();

    const input: GetResumeEducationsInput = {
      resume_id: resumeId
    };

    const result = await getResumeEducations(input);

    expect(result).toHaveLength(1);
    const education = result[0];
    expect(education.institution_name).toBe('Full University');
    expect(education.degree).toBe('Doctor of Philosophy');
    expect(education.field_of_study).toBe('Physics');
    expect(education.location).toBe('Boston, MA');
    expect(education.description).toBe('Specialized in quantum mechanics research');
    expect(typeof education.gpa).toBe('number');
    expect(education.gpa).toBe(4.0);
    expect(education.created_at).toBeInstanceOf(Date);
  });

  it('should only return education entries for the specified resume', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create two test resumes
    const resumeResults = await db.insert(resumesTable)
      .values([
        {
          user_id: userId,
          title: 'Resume 1'
        },
        {
          user_id: userId,
          title: 'Resume 2'
        }
      ])
      .returning()
      .execute();

    const resume1Id = resumeResults[0].id;
    const resume2Id = resumeResults[1].id;

    // Create education entries for both resumes
    await db.insert(educationTable)
      .values([
        {
          resume_id: resume1Id,
          institution_name: 'University for Resume 1',
          degree: 'Bachelor Degree',
          start_date: new Date('2015-09-01'),
          end_date: new Date('2019-05-01'),
          is_current: false,
          order_index: 1
        },
        {
          resume_id: resume2Id,
          institution_name: 'University for Resume 2',
          degree: 'Master Degree',
          start_date: new Date('2019-09-01'),
          end_date: new Date('2021-05-01'),
          is_current: false,
          order_index: 1
        }
      ])
      .execute();

    const input: GetResumeEducationsInput = {
      resume_id: resume1Id
    };

    const result = await getResumeEducations(input);

    // Should only return education for resume 1
    expect(result).toHaveLength(1);
    expect(result[0].institution_name).toBe('University for Resume 1');
    expect(result[0].resume_id).toBe(resume1Id);
  });
});