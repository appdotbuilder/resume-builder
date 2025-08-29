import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, resumesTable, skillsTable } from '../db/schema';
import { type CreateSkillInput } from '../schema';
import { createSkill } from '../handlers/create_skill';
import { eq } from 'drizzle-orm';

describe('createSkill', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testResumeId: number;

  // Helper to create prerequisite data
  const createTestData = async () => {
    // Create user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create resume
    const resumeResult = await db.insert(resumesTable)
      .values({
        user_id: testUserId,
        title: 'Test Resume'
      })
      .returning()
      .execute();
    testResumeId = resumeResult[0].id;
  };

  it('should create a skill with all fields', async () => {
    await createTestData();

    const testInput: CreateSkillInput = {
      resume_id: testResumeId,
      name: 'JavaScript',
      category: 'Programming Languages',
      proficiency_level: 'advanced',
      order_index: 1
    };

    const result = await createSkill(testInput);

    expect(result.name).toEqual('JavaScript');
    expect(result.category).toEqual('Programming Languages');
    expect(result.proficiency_level).toEqual('advanced');
    expect(result.resume_id).toEqual(testResumeId);
    expect(result.order_index).toEqual(1);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a skill with minimal required fields', async () => {
    await createTestData();

    const testInput: CreateSkillInput = {
      resume_id: testResumeId,
      name: 'Python',
      category: null,
      proficiency_level: null
    };

    const result = await createSkill(testInput);

    expect(result.name).toEqual('Python');
    expect(result.category).toBeNull();
    expect(result.proficiency_level).toBeNull();
    expect(result.resume_id).toEqual(testResumeId);
    expect(result.order_index).toEqual(0); // Should default to 0
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save skill to database', async () => {
    await createTestData();

    const testInput: CreateSkillInput = {
      resume_id: testResumeId,
      name: 'React',
      category: 'Frameworks',
      proficiency_level: 'expert',
      order_index: 2
    };

    const result = await createSkill(testInput);

    // Query database to verify skill was saved
    const skills = await db.select()
      .from(skillsTable)
      .where(eq(skillsTable.id, result.id))
      .execute();

    expect(skills).toHaveLength(1);
    expect(skills[0].name).toEqual('React');
    expect(skills[0].category).toEqual('Frameworks');
    expect(skills[0].proficiency_level).toEqual('expert');
    expect(skills[0].resume_id).toEqual(testResumeId);
    expect(skills[0].order_index).toEqual(2);
    expect(skills[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle different proficiency levels', async () => {
    await createTestData();

    const proficiencyLevels = ['beginner', 'intermediate', 'advanced', 'expert'] as const;

    for (const level of proficiencyLevels) {
      const testInput: CreateSkillInput = {
        resume_id: testResumeId,
        name: `Skill-${level}`,
        category: 'Test Category',
        proficiency_level: level,
        order_index: 0
      };

      const result = await createSkill(testInput);
      expect(result.proficiency_level).toEqual(level);
    }
  });

  it('should throw error when resume does not exist', async () => {
    const testInput: CreateSkillInput = {
      resume_id: 99999, // Non-existent resume ID
      name: 'Invalid Skill',
      category: null,
      proficiency_level: null,
      order_index: 0
    };

    await expect(createSkill(testInput)).rejects.toThrow(/violates foreign key constraint/i);
  });
});