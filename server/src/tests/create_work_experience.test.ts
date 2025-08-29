import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { workExperiencesTable, usersTable, resumesTable } from '../db/schema';
import { type CreateWorkExperienceInput } from '../schema';
import { createWorkExperience } from '../handlers/create_work_experience';
import { eq } from 'drizzle-orm';

describe('createWorkExperience', () => {
  let testUserId: number;
  let testResumeId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
      })
      .returning()
      .execute();
    
    testUserId = userResult[0].id;
    
    // Create test resume
    const resumeResult = await db.insert(resumesTable)
      .values({
        user_id: testUserId,
        title: 'Test Resume',
        is_public: false,
      })
      .returning()
      .execute();
    
    testResumeId = resumeResult[0].id;
  });

  afterEach(resetDB);

  it('should create a work experience with all fields', async () => {
    const testInput: CreateWorkExperienceInput = {
      resume_id: testResumeId,
      company_name: 'Tech Corp',
      job_title: 'Software Engineer',
      location: 'San Francisco, CA',
      start_date: new Date('2022-01-15'),
      end_date: new Date('2023-12-31'),
      is_current: false,
      description: 'Developed web applications using React and Node.js',
      order_index: 1,
    };

    const result = await createWorkExperience(testInput);

    // Basic field validation
    expect(result.resume_id).toEqual(testResumeId);
    expect(result.company_name).toEqual('Tech Corp');
    expect(result.job_title).toEqual('Software Engineer');
    expect(result.location).toEqual('San Francisco, CA');
    expect(result.start_date).toEqual(testInput.start_date);
    expect(result.end_date).toEqual(testInput.end_date);
    expect(result.is_current).toEqual(false);
    expect(result.description).toEqual('Developed web applications using React and Node.js');
    expect(result.order_index).toEqual(1);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a work experience with minimal required fields', async () => {
    const testInput: CreateWorkExperienceInput = {
      resume_id: testResumeId,
      company_name: 'Startup Inc',
      job_title: 'Developer',
      location: null,
      start_date: new Date('2023-06-01'),
      end_date: null,
      description: null,
    };

    const result = await createWorkExperience(testInput);

    expect(result.resume_id).toEqual(testResumeId);
    expect(result.company_name).toEqual('Startup Inc');
    expect(result.job_title).toEqual('Developer');
    expect(result.location).toBeNull();
    expect(result.start_date).toEqual(testInput.start_date);
    expect(result.end_date).toBeNull();
    expect(result.is_current).toEqual(false); // Default value
    expect(result.description).toBeNull();
    expect(result.order_index).toEqual(0); // Default value
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a current work experience', async () => {
    const testInput: CreateWorkExperienceInput = {
      resume_id: testResumeId,
      company_name: 'Current Corp',
      job_title: 'Senior Developer',
      location: 'Remote',
      start_date: new Date('2023-01-01'),
      end_date: null,
      is_current: true,
      description: 'Currently working on exciting projects',
      order_index: 2,
    };

    const result = await createWorkExperience(testInput);

    expect(result.is_current).toEqual(true);
    expect(result.end_date).toBeNull();
    expect(result.order_index).toEqual(2);
  });

  it('should save work experience to database', async () => {
    const testInput: CreateWorkExperienceInput = {
      resume_id: testResumeId,
      company_name: 'Database Test Corp',
      job_title: 'QA Engineer',
      location: 'New York, NY',
      start_date: new Date('2021-03-01'),
      end_date: new Date('2022-02-28'),
      is_current: false,
      description: 'Ensured quality through automated testing',
      order_index: 3,
    };

    const result = await createWorkExperience(testInput);

    // Query database to verify the work experience was saved
    const workExperiences = await db.select()
      .from(workExperiencesTable)
      .where(eq(workExperiencesTable.id, result.id))
      .execute();

    expect(workExperiences).toHaveLength(1);
    const savedWorkExperience = workExperiences[0];
    
    expect(savedWorkExperience.resume_id).toEqual(testResumeId);
    expect(savedWorkExperience.company_name).toEqual('Database Test Corp');
    expect(savedWorkExperience.job_title).toEqual('QA Engineer');
    expect(savedWorkExperience.location).toEqual('New York, NY');
    expect(savedWorkExperience.start_date).toEqual(testInput.start_date);
    expect(savedWorkExperience.end_date).toEqual(testInput.end_date);
    expect(savedWorkExperience.is_current).toEqual(false);
    expect(savedWorkExperience.description).toEqual('Ensured quality through automated testing');
    expect(savedWorkExperience.order_index).toEqual(3);
    expect(savedWorkExperience.created_at).toBeInstanceOf(Date);
  });

  it('should handle work experience with different order indices', async () => {
    // Create multiple work experiences with different order indices
    const inputs: CreateWorkExperienceInput[] = [
      {
        resume_id: testResumeId,
        company_name: 'Company A',
        job_title: 'Junior Dev',
        location: 'Boston, MA',
        start_date: new Date('2020-01-01'),
        end_date: new Date('2021-01-01'),
        description: 'Started career as junior developer',
        order_index: 0,
      },
      {
        resume_id: testResumeId,
        company_name: 'Company B',
        job_title: 'Mid Dev',
        location: 'Austin, TX',
        start_date: new Date('2021-02-01'),
        end_date: new Date('2022-02-01'),
        description: 'Grew skills as mid-level developer',
        order_index: 1,
      },
      {
        resume_id: testResumeId,
        company_name: 'Company C',
        job_title: 'Senior Dev',
        location: 'Seattle, WA',
        start_date: new Date('2022-03-01'),
        end_date: null,
        is_current: true,
        description: 'Leading development teams',
        order_index: 2,
      },
    ];

    const results = [];
    for (const input of inputs) {
      results.push(await createWorkExperience(input));
    }

    // Verify all were created with correct order indices
    expect(results[0].order_index).toEqual(0);
    expect(results[1].order_index).toEqual(1);
    expect(results[2].order_index).toEqual(2);
    expect(results[2].is_current).toEqual(true);
  });

  it('should throw error for non-existent resume', async () => {
    const testInput: CreateWorkExperienceInput = {
      resume_id: 99999, // Non-existent resume ID
      company_name: 'Test Company',
      job_title: 'Test Job',
      location: 'Test City',
      start_date: new Date('2023-01-01'),
      end_date: null,
      description: 'Test description',
    };

    await expect(createWorkExperience(testInput)).rejects.toThrow();
  });
});