import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { educationTable, usersTable, resumesTable } from '../db/schema';
import { type CreateEducationInput } from '../schema';
import { createEducation } from '../handlers/create_education';
import { eq } from 'drizzle-orm';

// Test data setup
const testUser = {
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

const testResume = {
  title: 'Test Resume',
  summary: null,
  template_id: null,
  is_public: false,
};

// Simple test input
const testEducationInput: CreateEducationInput = {
  resume_id: 0, // Will be set dynamically in tests
  institution_name: 'University of Technology',
  degree: 'Bachelor of Science',
  field_of_study: 'Computer Science',
  location: 'San Francisco, CA',
  start_date: new Date('2018-09-01'),
  end_date: new Date('2022-05-15'),
  is_current: false,
  gpa: 3.8,
  description: 'Focused on software engineering and data structures',
  order_index: 1,
};

describe('createEducation', () => {
  let resumeId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test resume
    const resumeResult = await db.insert(resumesTable)
      .values({
        ...testResume,
        user_id: userId,
      })
      .returning()
      .execute();
    resumeId = resumeResult[0].id;
  });

  afterEach(resetDB);

  it('should create an education entry', async () => {
    const input = { ...testEducationInput, resume_id: resumeId };
    const result = await createEducation(input);

    // Basic field validation
    expect(result.institution_name).toEqual('University of Technology');
    expect(result.degree).toEqual('Bachelor of Science');
    expect(result.field_of_study).toEqual('Computer Science');
    expect(result.location).toEqual('San Francisco, CA');
    expect(result.start_date).toBeInstanceOf(Date);
    expect(result.end_date).toBeInstanceOf(Date);
    expect(result.is_current).toEqual(false);
    expect(result.gpa).toEqual(3.8);
    expect(result.description).toEqual('Focused on software engineering and data structures');
    expect(result.order_index).toEqual(1);
    expect(result.resume_id).toEqual(resumeId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save education to database', async () => {
    const input = { ...testEducationInput, resume_id: resumeId };
    const result = await createEducation(input);

    // Query database to verify persistence
    const educations = await db.select()
      .from(educationTable)
      .where(eq(educationTable.id, result.id))
      .execute();

    expect(educations).toHaveLength(1);
    const savedEducation = educations[0];
    expect(savedEducation.institution_name).toEqual('University of Technology');
    expect(savedEducation.degree).toEqual('Bachelor of Science');
    expect(savedEducation.field_of_study).toEqual('Computer Science');
    expect(savedEducation.location).toEqual('San Francisco, CA');
    expect(savedEducation.is_current).toEqual(false);
    expect(savedEducation.gpa).toEqual(3.8);
    expect(savedEducation.order_index).toEqual(1);
    expect(savedEducation.resume_id).toEqual(resumeId);
    expect(savedEducation.created_at).toBeInstanceOf(Date);
  });

  it('should handle optional fields correctly', async () => {
    const minimalInput: CreateEducationInput = {
      resume_id: resumeId,
      institution_name: 'Simple College',
      degree: 'Associate Degree',
      field_of_study: null,
      location: null,
      start_date: new Date('2020-01-01'),
      end_date: null,
      is_current: undefined, // Should default to false
      gpa: null,
      description: null,
      order_index: undefined, // Should default to 0
    };

    const result = await createEducation(minimalInput);

    expect(result.institution_name).toEqual('Simple College');
    expect(result.degree).toEqual('Associate Degree');
    expect(result.field_of_study).toBeNull();
    expect(result.location).toBeNull();
    expect(result.end_date).toBeNull();
    expect(result.is_current).toEqual(false);
    expect(result.gpa).toBeNull();
    expect(result.description).toBeNull();
    expect(result.order_index).toEqual(0);
    expect(result.id).toBeDefined();
  });

  it('should handle current education (no end date)', async () => {
    const currentEducationInput: CreateEducationInput = {
      resume_id: resumeId,
      institution_name: 'Graduate School',
      degree: 'Master of Science',
      field_of_study: 'Data Science',
      location: 'Boston, MA',
      start_date: new Date('2022-09-01'),
      end_date: null,
      is_current: true,
      gpa: 3.9,
      description: 'Currently pursuing advanced degree',
      order_index: 2,
    };

    const result = await createEducation(currentEducationInput);

    expect(result.institution_name).toEqual('Graduate School');
    expect(result.degree).toEqual('Master of Science');
    expect(result.is_current).toEqual(true);
    expect(result.end_date).toBeNull();
    expect(result.gpa).toEqual(3.9);
    expect(result.order_index).toEqual(2);
  });

  it('should fail with invalid resume_id', async () => {
    const invalidInput = { 
      ...testEducationInput, 
      resume_id: 99999 // Non-existent resume ID
    };

    await expect(createEducation(invalidInput)).rejects.toThrow(/violates foreign key constraint|FOREIGN KEY constraint failed/i);
  });
});