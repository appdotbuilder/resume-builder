import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, resumesTable, workExperiencesTable } from '../db/schema';
import { type GetResumeWorkExperiencesInput } from '../schema';
import { getResumeWorkExperiences } from '../handlers/get_resume_work_experiences';

describe('getResumeWorkExperiences', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return work experiences for a resume ordered by order_index', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe'
      })
      .returning()
      .execute();

    // Create test resume
    const resumeResult = await db.insert(resumesTable)
      .values({
        user_id: userResult[0].id,
        title: 'Test Resume',
        is_public: false
      })
      .returning()
      .execute();

    const resumeId = resumeResult[0].id;

    // Create multiple work experiences with different order_index
    await db.insert(workExperiencesTable)
      .values([
        {
          resume_id: resumeId,
          company_name: 'Company B',
          job_title: 'Developer',
          start_date: new Date('2020-01-01'),
          is_current: false,
          order_index: 2
        },
        {
          resume_id: resumeId,
          company_name: 'Company A',
          job_title: 'Senior Developer',
          start_date: new Date('2021-01-01'),
          is_current: true,
          order_index: 1
        },
        {
          resume_id: resumeId,
          company_name: 'Company C',
          job_title: 'Junior Developer',
          start_date: new Date('2019-01-01'),
          end_date: new Date('2019-12-31'),
          is_current: false,
          order_index: 3
        }
      ])
      .execute();

    const input: GetResumeWorkExperiencesInput = {
      resume_id: resumeId
    };

    const result = await getResumeWorkExperiences(input);

    expect(result).toHaveLength(3);
    
    // Verify ordering by order_index
    expect(result[0].company_name).toEqual('Company A'); // order_index: 1
    expect(result[0].job_title).toEqual('Senior Developer');
    expect(result[0].order_index).toEqual(1);
    expect(result[0].is_current).toBe(true);

    expect(result[1].company_name).toEqual('Company B'); // order_index: 2
    expect(result[1].job_title).toEqual('Developer');
    expect(result[1].order_index).toEqual(2);
    expect(result[1].is_current).toBe(false);

    expect(result[2].company_name).toEqual('Company C'); // order_index: 3
    expect(result[2].job_title).toEqual('Junior Developer');
    expect(result[2].order_index).toEqual(3);
    expect(result[2].is_current).toBe(false);

    // Verify all required fields are present
    result.forEach(workExp => {
      expect(workExp.id).toBeDefined();
      expect(workExp.resume_id).toEqual(resumeId);
      expect(workExp.company_name).toBeDefined();
      expect(workExp.job_title).toBeDefined();
      expect(workExp.start_date).toBeInstanceOf(Date);
      expect(workExp.created_at).toBeInstanceOf(Date);
      expect(typeof workExp.is_current).toBe('boolean');
      expect(typeof workExp.order_index).toBe('number');
    });
  });

  it('should return empty array when resume has no work experiences', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        first_name: 'Jane',
        last_name: 'Smith'
      })
      .returning()
      .execute();

    // Create test resume with no work experiences
    const resumeResult = await db.insert(resumesTable)
      .values({
        user_id: userResult[0].id,
        title: 'Empty Resume',
        is_public: false
      })
      .returning()
      .execute();

    const input: GetResumeWorkExperiencesInput = {
      resume_id: resumeResult[0].id
    };

    const result = await getResumeWorkExperiences(input);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should return empty array for non-existent resume', async () => {
    const input: GetResumeWorkExperiencesInput = {
      resume_id: 99999 // Non-existent resume ID
    };

    const result = await getResumeWorkExperiences(input);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should handle work experiences with all optional fields', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        first_name: 'Bob',
        last_name: 'Johnson'
      })
      .returning()
      .execute();

    // Create test resume
    const resumeResult = await db.insert(resumesTable)
      .values({
        user_id: userResult[0].id,
        title: 'Detailed Resume',
        is_public: true
      })
      .returning()
      .execute();

    const resumeId = resumeResult[0].id;

    // Create work experience with all optional fields populated
    await db.insert(workExperiencesTable)
      .values({
        resume_id: resumeId,
        company_name: 'Tech Corp',
        job_title: 'Full Stack Developer',
        location: 'San Francisco, CA',
        start_date: new Date('2022-01-01'),
        end_date: new Date('2023-12-31'),
        is_current: false,
        description: 'Developed web applications using React and Node.js',
        order_index: 1
      })
      .execute();

    const input: GetResumeWorkExperiencesInput = {
      resume_id: resumeId
    };

    const result = await getResumeWorkExperiences(input);

    expect(result).toHaveLength(1);
    
    const workExp = result[0];
    expect(workExp.company_name).toEqual('Tech Corp');
    expect(workExp.job_title).toEqual('Full Stack Developer');
    expect(workExp.location).toEqual('San Francisco, CA');
    expect(workExp.start_date).toEqual(new Date('2022-01-01'));
    expect(workExp.end_date).toEqual(new Date('2023-12-31'));
    expect(workExp.is_current).toBe(false);
    expect(workExp.description).toEqual('Developed web applications using React and Node.js');
    expect(workExp.order_index).toEqual(1);
  });

  it('should only return work experiences for specified resume', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        first_name: 'Alice',
        last_name: 'Wilson'
      })
      .returning()
      .execute();

    // Create two different resumes
    const resumeResults = await db.insert(resumesTable)
      .values([
        {
          user_id: userResult[0].id,
          title: 'Resume 1',
          is_public: false
        },
        {
          user_id: userResult[0].id,
          title: 'Resume 2',
          is_public: false
        }
      ])
      .returning()
      .execute();

    const resumeId1 = resumeResults[0].id;
    const resumeId2 = resumeResults[1].id;

    // Add work experiences to both resumes
    await db.insert(workExperiencesTable)
      .values([
        {
          resume_id: resumeId1,
          company_name: 'Company 1',
          job_title: 'Role 1',
          start_date: new Date('2020-01-01'),
          is_current: false,
          order_index: 1
        },
        {
          resume_id: resumeId2,
          company_name: 'Company 2',
          job_title: 'Role 2',
          start_date: new Date('2021-01-01'),
          is_current: true,
          order_index: 1
        }
      ])
      .execute();

    // Query for resume 1 work experiences
    const input1: GetResumeWorkExperiencesInput = {
      resume_id: resumeId1
    };

    const result1 = await getResumeWorkExperiences(input1);

    expect(result1).toHaveLength(1);
    expect(result1[0].company_name).toEqual('Company 1');
    expect(result1[0].resume_id).toEqual(resumeId1);

    // Query for resume 2 work experiences
    const input2: GetResumeWorkExperiencesInput = {
      resume_id: resumeId2
    };

    const result2 = await getResumeWorkExperiences(input2);

    expect(result2).toHaveLength(1);
    expect(result2[0].company_name).toEqual('Company 2');
    expect(result2[0].resume_id).toEqual(resumeId2);
  });
});