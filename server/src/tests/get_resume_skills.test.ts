import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, resumesTable, skillsTable } from '../db/schema';
import { type GetResumeSkillsInput } from '../schema';
import { getResumeSkills } from '../handlers/get_resume_skills';

// Test data
const testUser = {
  email: 'test@example.com',
  first_name: 'John',
  last_name: 'Doe',
  phone: '555-1234',
  address: '123 Main St',
  city: 'Anytown',
  state: 'CA',
  zip_code: '12345',
  country: 'USA'
};

const testResume = {
  user_id: 1,
  title: 'Software Developer Resume',
  summary: 'Experienced developer',
  is_public: false
};

const testSkills = [
  {
    resume_id: 1,
    name: 'JavaScript',
    category: 'Programming Languages',
    proficiency_level: 'expert' as const,
    order_index: 2
  },
  {
    resume_id: 1,
    name: 'React',
    category: 'Frameworks',
    proficiency_level: 'advanced' as const,
    order_index: 1
  },
  {
    resume_id: 1,
    name: 'Node.js',
    category: 'Runtime',
    proficiency_level: 'intermediate' as const,
    order_index: 3
  }
];

describe('getResumeSkills', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return skills for a resume ordered by order_index', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const resumeResult = await db.insert(resumesTable)
      .values({
        ...testResume,
        user_id: userResult[0].id
      })
      .returning()
      .execute();

    // Insert skills in random order
    await db.insert(skillsTable)
      .values(testSkills.map(skill => ({
        ...skill,
        resume_id: resumeResult[0].id
      })))
      .execute();

    const input: GetResumeSkillsInput = {
      resume_id: resumeResult[0].id
    };

    const result = await getResumeSkills(input);

    // Should return 3 skills
    expect(result).toHaveLength(3);

    // Should be ordered by order_index (React=1, JavaScript=2, Node.js=3)
    expect(result[0].name).toEqual('React');
    expect(result[0].order_index).toEqual(1);
    expect(result[1].name).toEqual('JavaScript');
    expect(result[1].order_index).toEqual(2);
    expect(result[2].name).toEqual('Node.js');
    expect(result[2].order_index).toEqual(3);

    // Verify all fields are present
    result.forEach(skill => {
      expect(skill.id).toBeDefined();
      expect(skill.resume_id).toEqual(resumeResult[0].id);
      expect(skill.name).toBeDefined();
      expect(skill.created_at).toBeInstanceOf(Date);
      expect(typeof skill.order_index).toBe('number');
    });
  });

  it('should return empty array when no skills exist for resume', async () => {
    // Create prerequisite data without skills
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const resumeResult = await db.insert(resumesTable)
      .values({
        ...testResume,
        user_id: userResult[0].id
      })
      .returning()
      .execute();

    const input: GetResumeSkillsInput = {
      resume_id: resumeResult[0].id
    };

    const result = await getResumeSkills(input);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return skills only for the specified resume', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create two resumes
    const resume1Result = await db.insert(resumesTable)
      .values({
        ...testResume,
        user_id: userResult[0].id,
        title: 'Resume 1'
      })
      .returning()
      .execute();

    const resume2Result = await db.insert(resumesTable)
      .values({
        ...testResume,
        user_id: userResult[0].id,
        title: 'Resume 2'
      })
      .returning()
      .execute();

    // Add skills to both resumes
    await db.insert(skillsTable)
      .values([
        {
          resume_id: resume1Result[0].id,
          name: 'JavaScript',
          category: 'Programming',
          proficiency_level: 'expert' as const,
          order_index: 1
        },
        {
          resume_id: resume2Result[0].id,
          name: 'Python',
          category: 'Programming',
          proficiency_level: 'advanced' as const,
          order_index: 1
        }
      ])
      .execute();

    const input: GetResumeSkillsInput = {
      resume_id: resume1Result[0].id
    };

    const result = await getResumeSkills(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('JavaScript');
    expect(result[0].resume_id).toEqual(resume1Result[0].id);
  });

  it('should handle skills with various proficiency levels and categories', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const resumeResult = await db.insert(resumesTable)
      .values({
        ...testResume,
        user_id: userResult[0].id
      })
      .returning()
      .execute();

    // Insert skills with different attributes
    await db.insert(skillsTable)
      .values([
        {
          resume_id: resumeResult[0].id,
          name: 'Communication',
          category: null, // No category
          proficiency_level: null, // No proficiency level
          order_index: 1
        },
        {
          resume_id: resumeResult[0].id,
          name: 'TypeScript',
          category: 'Programming Languages',
          proficiency_level: 'beginner' as const,
          order_index: 2
        }
      ])
      .execute();

    const input: GetResumeSkillsInput = {
      resume_id: resumeResult[0].id
    };

    const result = await getResumeSkills(input);

    expect(result).toHaveLength(2);
    
    // First skill (Communication)
    expect(result[0].name).toEqual('Communication');
    expect(result[0].category).toBeNull();
    expect(result[0].proficiency_level).toBeNull();
    
    // Second skill (TypeScript)
    expect(result[1].name).toEqual('TypeScript');
    expect(result[1].category).toEqual('Programming Languages');
    expect(result[1].proficiency_level).toEqual('beginner');
  });

  it('should return empty array for non-existent resume', async () => {
    const input: GetResumeSkillsInput = {
      resume_id: 99999 // Non-existent resume ID
    };

    const result = await getResumeSkills(input);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });
});