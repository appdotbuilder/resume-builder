import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, resumesTable, educationTable } from '../db/schema';
import { type UpdateEducationInput, type CreateUserInput, type CreateResumeInput } from '../schema';
import { updateEducation } from '../handlers/update_education';
import { eq } from 'drizzle-orm';

// Test user data
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

// Test resume data
const testResume: CreateResumeInput = {
  user_id: 1,
  title: 'Software Engineer Resume',
  summary: null,
  template_id: null,
  is_public: false,
};

// Base education data for testing
const baseEducation = {
  resume_id: 1,
  institution_name: 'Test University',
  degree: 'Bachelor of Science',
  field_of_study: 'Computer Science',
  location: 'Test City, TS',
  start_date: new Date('2020-09-01'),
  end_date: new Date('2024-05-15'),
  is_current: false,
  gpa: 3.8,
  description: 'Relevant coursework: Data Structures, Algorithms',
  order_index: 0,
};

describe('updateEducation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update education with all fields', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable).values(testUser).returning().execute();
    const user = userResult[0];
    
    await db.insert(resumesTable).values({
      ...testResume,
      user_id: user.id,
    }).returning().execute();

    // Create education record
    const educationResult = await db.insert(educationTable)
      .values(baseEducation)
      .returning()
      .execute();
    const education = educationResult[0];

    // Test input with all updatable fields
    const updateInput: UpdateEducationInput = {
      id: education.id,
      institution_name: 'Updated University',
      degree: 'Master of Science',
      field_of_study: 'Software Engineering',
      location: 'New City, NC',
      start_date: new Date('2021-09-01'),
      end_date: new Date('2023-05-15'),
      is_current: false,
      gpa: 3.9,
      description: 'Updated description with advanced coursework',
      order_index: 1,
    };

    const result = await updateEducation(updateInput);

    // Verify all fields were updated
    expect(result.id).toEqual(education.id);
    expect(result.institution_name).toEqual('Updated University');
    expect(result.degree).toEqual('Master of Science');
    expect(result.field_of_study).toEqual('Software Engineering');
    expect(result.location).toEqual('New City, NC');
    expect(result.start_date).toEqual(new Date('2021-09-01'));
    expect(result.end_date).toEqual(new Date('2023-05-15'));
    expect(result.is_current).toEqual(false);
    expect(result.gpa).toEqual(3.9);
    expect(typeof result.gpa).toBe('number');
    expect(result.description).toEqual('Updated description with advanced coursework');
    expect(result.order_index).toEqual(1);
    expect(result.resume_id).toEqual(education.resume_id);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update only provided fields', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable).values(testUser).returning().execute();
    const user = userResult[0];
    
    await db.insert(resumesTable).values({
      ...testResume,
      user_id: user.id,
    }).returning().execute();

    // Create education record
    const educationResult = await db.insert(educationTable)
      .values(baseEducation)
      .returning()
      .execute();
    const education = educationResult[0];

    // Update only specific fields
    const updateInput: UpdateEducationInput = {
      id: education.id,
      institution_name: 'Partially Updated University',
      gpa: 4.0,
    };

    const result = await updateEducation(updateInput);

    // Verify only specified fields were updated
    expect(result.institution_name).toEqual('Partially Updated University');
    expect(result.gpa).toEqual(4.0);
    expect(typeof result.gpa).toBe('number');
    
    // Verify other fields remained unchanged
    expect(result.degree).toEqual(education.degree);
    expect(result.field_of_study).toEqual(education.field_of_study);
    expect(result.location).toEqual(education.location);
    expect(result.description).toEqual(education.description);
    expect(result.order_index).toEqual(education.order_index);
  });

  it('should handle null values correctly', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable).values(testUser).returning().execute();
    const user = userResult[0];
    
    await db.insert(resumesTable).values({
      ...testResume,
      user_id: user.id,
    }).returning().execute();

    // Create education record with non-null values
    const educationResult = await db.insert(educationTable)
      .values(baseEducation)
      .returning()
      .execute();
    const education = educationResult[0];

    // Update with null values
    const updateInput: UpdateEducationInput = {
      id: education.id,
      field_of_study: null,
      location: null,
      end_date: null,
      gpa: null,
      description: null,
    };

    const result = await updateEducation(updateInput);

    // Verify null values were set correctly
    expect(result.field_of_study).toBeNull();
    expect(result.location).toBeNull();
    expect(result.end_date).toBeNull();
    expect(result.gpa).toBeNull();
    expect(result.description).toBeNull();
    
    // Verify non-updated fields remained unchanged
    expect(result.institution_name).toEqual(education.institution_name);
    expect(result.degree).toEqual(education.degree);
  });

  it('should update is_current to true for current education', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable).values(testUser).returning().execute();
    const user = userResult[0];
    
    await db.insert(resumesTable).values({
      ...testResume,
      user_id: user.id,
    }).returning().execute();

    // Create education record
    const educationResult = await db.insert(educationTable)
      .values({
        ...baseEducation,
        is_current: false,
        end_date: new Date('2024-05-15'),
      })
      .returning()
      .execute();
    const education = educationResult[0];

    // Update to current education (no end date)
    const updateInput: UpdateEducationInput = {
      id: education.id,
      is_current: true,
      end_date: null,
    };

    const result = await updateEducation(updateInput);

    expect(result.is_current).toBe(true);
    expect(result.end_date).toBeNull();
  });

  it('should persist changes in database', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable).values(testUser).returning().execute();
    const user = userResult[0];
    
    await db.insert(resumesTable).values({
      ...testResume,
      user_id: user.id,
    }).returning().execute();

    // Create education record
    const educationResult = await db.insert(educationTable)
      .values(baseEducation)
      .returning()
      .execute();
    const education = educationResult[0];

    const updateInput: UpdateEducationInput = {
      id: education.id,
      institution_name: 'Database Test University',
      gpa: 3.95,
    };

    await updateEducation(updateInput);

    // Verify changes were persisted in database
    const educationRecords = await db.select()
      .from(educationTable)
      .where(eq(educationTable.id, education.id))
      .execute();

    expect(educationRecords).toHaveLength(1);
    const savedEducation = educationRecords[0];
    expect(savedEducation.institution_name).toEqual('Database Test University');
    expect(parseFloat(savedEducation.gpa!.toString())).toEqual(3.95);
  });

  it('should throw error when education not found', async () => {
    const updateInput: UpdateEducationInput = {
      id: 99999, // Non-existent ID
      institution_name: 'Non-existent University',
    };

    await expect(updateEducation(updateInput)).rejects.toThrow(/Education with id 99999 not found/);
  });

  it('should update order_index for reordering', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable).values(testUser).returning().execute();
    const user = userResult[0];
    
    await db.insert(resumesTable).values({
      ...testResume,
      user_id: user.id,
    }).returning().execute();

    // Create education record
    const educationResult = await db.insert(educationTable)
      .values({
        ...baseEducation,
        order_index: 0,
      })
      .returning()
      .execute();
    const education = educationResult[0];

    const updateInput: UpdateEducationInput = {
      id: education.id,
      order_index: 5,
    };

    const result = await updateEducation(updateInput);

    expect(result.order_index).toEqual(5);
  });

  it('should handle date updates correctly', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable).values(testUser).returning().execute();
    const user = userResult[0];
    
    await db.insert(resumesTable).values({
      ...testResume,
      user_id: user.id,
    }).returning().execute();

    // Create education record
    const educationResult = await db.insert(educationTable)
      .values(baseEducation)
      .returning()
      .execute();
    const education = educationResult[0];

    const newStartDate = new Date('2019-08-15');
    const newEndDate = new Date('2023-12-20');

    const updateInput: UpdateEducationInput = {
      id: education.id,
      start_date: newStartDate,
      end_date: newEndDate,
    };

    const result = await updateEducation(updateInput);

    expect(result.start_date).toEqual(newStartDate);
    expect(result.end_date).toEqual(newEndDate);
    expect(result.start_date).toBeInstanceOf(Date);
    expect(result.end_date).toBeInstanceOf(Date);
  });
});