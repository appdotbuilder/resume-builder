import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, resumesTable, skillsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type DeleteInput } from '../schema';
import { deleteSkill } from '../handlers/delete_skill';

describe('deleteSkill', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing skill and return true', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
      })
      .returning()
      .execute();

    const [resume] = await db.insert(resumesTable)
      .values({
        user_id: user.id,
        title: 'Test Resume',
        is_public: false,
      })
      .returning()
      .execute();

    // Create test skill
    const [skill] = await db.insert(skillsTable)
      .values({
        resume_id: resume.id,
        name: 'JavaScript',
        category: 'Programming',
        proficiency_level: 'advanced',
        order_index: 1,
      })
      .returning()
      .execute();

    const input: DeleteInput = {
      id: skill.id,
    };

    const result = await deleteSkill(input);

    // Should return true for successful deletion
    expect(result).toBe(true);

    // Verify skill was deleted from database
    const deletedSkill = await db.select()
      .from(skillsTable)
      .where(eq(skillsTable.id, skill.id))
      .execute();

    expect(deletedSkill).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent skill', async () => {
    const input: DeleteInput = {
      id: 999, // Non-existent ID
    };

    const result = await deleteSkill(input);

    // Should return false when no rows are affected
    expect(result).toBe(false);
  });

  it('should not affect other skills when deleting one skill', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
      })
      .returning()
      .execute();

    const [resume] = await db.insert(resumesTable)
      .values({
        user_id: user.id,
        title: 'Test Resume',
        is_public: false,
      })
      .returning()
      .execute();

    // Create multiple test skills
    const [skill1] = await db.insert(skillsTable)
      .values({
        resume_id: resume.id,
        name: 'JavaScript',
        category: 'Programming',
        proficiency_level: 'advanced',
        order_index: 1,
      })
      .returning()
      .execute();

    const [skill2] = await db.insert(skillsTable)
      .values({
        resume_id: resume.id,
        name: 'Python',
        category: 'Programming',
        proficiency_level: 'intermediate',
        order_index: 2,
      })
      .returning()
      .execute();

    const input: DeleteInput = {
      id: skill1.id,
    };

    const result = await deleteSkill(input);

    expect(result).toBe(true);

    // Verify only the targeted skill was deleted
    const remainingSkills = await db.select()
      .from(skillsTable)
      .where(eq(skillsTable.resume_id, resume.id))
      .execute();

    expect(remainingSkills).toHaveLength(1);
    expect(remainingSkills[0].id).toBe(skill2.id);
    expect(remainingSkills[0].name).toBe('Python');
  });

  it('should handle skills with minimal data correctly', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
      })
      .returning()
      .execute();

    const [resume] = await db.insert(resumesTable)
      .values({
        user_id: user.id,
        title: 'Test Resume',
        is_public: false,
      })
      .returning()
      .execute();

    // Create skill with minimal required fields only
    const [skill] = await db.insert(skillsTable)
      .values({
        resume_id: resume.id,
        name: 'Basic Skill',
        // category: null (optional)
        // proficiency_level: null (optional)
        order_index: 0, // default value
      })
      .returning()
      .execute();

    const input: DeleteInput = {
      id: skill.id,
    };

    const result = await deleteSkill(input);

    expect(result).toBe(true);

    // Verify skill was deleted
    const deletedSkill = await db.select()
      .from(skillsTable)
      .where(eq(skillsTable.id, skill.id))
      .execute();

    expect(deletedSkill).toHaveLength(0);
  });
});