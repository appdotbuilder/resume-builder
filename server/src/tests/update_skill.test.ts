import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, resumesTable, skillsTable } from '../db/schema';
import { type UpdateSkillInput } from '../schema';
import { updateSkill } from '../handlers/update_skill';
import { eq } from 'drizzle-orm';

// Test helper function to create prerequisite data
const createTestData = async () => {
  // Create user
  const [user] = await db.insert(usersTable)
    .values({
      email: 'test@example.com',
      first_name: 'John',
      last_name: 'Doe'
    })
    .returning()
    .execute();

  // Create resume
  const [resume] = await db.insert(resumesTable)
    .values({
      user_id: user.id,
      title: 'Test Resume',
      is_public: false
    })
    .returning()
    .execute();

  // Create skill
  const [skill] = await db.insert(skillsTable)
    .values({
      resume_id: resume.id,
      name: 'JavaScript',
      category: 'Programming',
      proficiency_level: 'intermediate',
      order_index: 1
    })
    .returning()
    .execute();

  return { user, resume, skill };
};

describe('updateSkill', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update skill name', async () => {
    const { skill } = await createTestData();

    const input: UpdateSkillInput = {
      id: skill.id,
      name: 'TypeScript'
    };

    const result = await updateSkill(input);

    expect(result.id).toEqual(skill.id);
    expect(result.name).toEqual('TypeScript');
    expect(result.category).toEqual('Programming'); // Should remain unchanged
    expect(result.proficiency_level).toEqual('intermediate'); // Should remain unchanged
    expect(result.order_index).toEqual(1); // Should remain unchanged
  });

  it('should update skill category', async () => {
    const { skill } = await createTestData();

    const input: UpdateSkillInput = {
      id: skill.id,
      category: 'Web Development'
    };

    const result = await updateSkill(input);

    expect(result.id).toEqual(skill.id);
    expect(result.name).toEqual('JavaScript'); // Should remain unchanged
    expect(result.category).toEqual('Web Development');
    expect(result.proficiency_level).toEqual('intermediate'); // Should remain unchanged
    expect(result.order_index).toEqual(1); // Should remain unchanged
  });

  it('should update skill proficiency level', async () => {
    const { skill } = await createTestData();

    const input: UpdateSkillInput = {
      id: skill.id,
      proficiency_level: 'advanced'
    };

    const result = await updateSkill(input);

    expect(result.id).toEqual(skill.id);
    expect(result.name).toEqual('JavaScript'); // Should remain unchanged
    expect(result.category).toEqual('Programming'); // Should remain unchanged
    expect(result.proficiency_level).toEqual('advanced');
    expect(result.order_index).toEqual(1); // Should remain unchanged
  });

  it('should update skill order index', async () => {
    const { skill } = await createTestData();

    const input: UpdateSkillInput = {
      id: skill.id,
      order_index: 5
    };

    const result = await updateSkill(input);

    expect(result.id).toEqual(skill.id);
    expect(result.name).toEqual('JavaScript'); // Should remain unchanged
    expect(result.category).toEqual('Programming'); // Should remain unchanged
    expect(result.proficiency_level).toEqual('intermediate'); // Should remain unchanged
    expect(result.order_index).toEqual(5);
  });

  it('should update multiple fields at once', async () => {
    const { skill } = await createTestData();

    const input: UpdateSkillInput = {
      id: skill.id,
      name: 'React',
      category: 'Frontend Framework',
      proficiency_level: 'expert',
      order_index: 3
    };

    const result = await updateSkill(input);

    expect(result.id).toEqual(skill.id);
    expect(result.name).toEqual('React');
    expect(result.category).toEqual('Frontend Framework');
    expect(result.proficiency_level).toEqual('expert');
    expect(result.order_index).toEqual(3);
    expect(result.resume_id).toEqual(skill.resume_id); // Should remain unchanged
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should set nullable fields to null', async () => {
    const { skill } = await createTestData();

    const input: UpdateSkillInput = {
      id: skill.id,
      category: null,
      proficiency_level: null
    };

    const result = await updateSkill(input);

    expect(result.id).toEqual(skill.id);
    expect(result.name).toEqual('JavaScript'); // Should remain unchanged
    expect(result.category).toBeNull();
    expect(result.proficiency_level).toBeNull();
    expect(result.order_index).toEqual(1); // Should remain unchanged
  });

  it('should persist changes in database', async () => {
    const { skill } = await createTestData();

    const input: UpdateSkillInput = {
      id: skill.id,
      name: 'Python',
      category: 'Backend Language'
    };

    await updateSkill(input);

    // Verify changes persisted in database
    const updatedSkills = await db.select()
      .from(skillsTable)
      .where(eq(skillsTable.id, skill.id))
      .execute();

    expect(updatedSkills).toHaveLength(1);
    expect(updatedSkills[0].name).toEqual('Python');
    expect(updatedSkills[0].category).toEqual('Backend Language');
    expect(updatedSkills[0].proficiency_level).toEqual('intermediate'); // Should remain unchanged
  });

  it('should throw error when skill not found', async () => {
    const input: UpdateSkillInput = {
      id: 99999,
      name: 'Nonexistent Skill'
    };

    await expect(updateSkill(input)).rejects.toThrow(/Skill with id 99999 not found/);
  });

  it('should handle proficiency level validation', async () => {
    const { skill } = await createTestData();

    const input: UpdateSkillInput = {
      id: skill.id,
      proficiency_level: 'beginner'
    };

    const result = await updateSkill(input);

    expect(result.proficiency_level).toEqual('beginner');
  });

  it('should update only provided fields when some are undefined', async () => {
    const { skill } = await createTestData();

    // Update with only name, leaving others undefined (not null)
    const input: UpdateSkillInput = {
      id: skill.id,
      name: 'Vue.js'
      // category, proficiency_level, order_index are undefined
    };

    const result = await updateSkill(input);

    expect(result.name).toEqual('Vue.js');
    expect(result.category).toEqual('Programming'); // Original value preserved
    expect(result.proficiency_level).toEqual('intermediate'); // Original value preserved
    expect(result.order_index).toEqual(1); // Original value preserved
  });
});