import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type UpdateUserInput, type CreateUserInput } from '../schema';
import { updateUser } from '../handlers/update_user';
import { eq } from 'drizzle-orm';

// Helper function to create a test user
const createTestUser = async (): Promise<number> => {
  const testUser: CreateUserInput = {
    email: 'test@example.com',
    first_name: 'John',
    last_name: 'Doe',
    phone: '555-0123',
    address: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    zip_code: '12345',
    country: 'USA'
  };

  const result = await db.insert(usersTable)
    .values({
      ...testUser,
    })
    .returning()
    .execute();

  return result[0].id;
};

describe('updateUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update user with all fields', async () => {
    const userId = await createTestUser();

    const updateInput: UpdateUserInput = {
      id: userId,
      email: 'updated@example.com',
      first_name: 'Jane',
      last_name: 'Smith',
      phone: '555-9999',
      address: '456 Oak Ave',
      city: 'Newtown',
      state: 'NY',
      zip_code: '67890',
      country: 'Canada'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toBe(userId);
    expect(result.email).toBe('updated@example.com');
    expect(result.first_name).toBe('Jane');
    expect(result.last_name).toBe('Smith');
    expect(result.phone).toBe('555-9999');
    expect(result.address).toBe('456 Oak Ave');
    expect(result.city).toBe('Newtown');
    expect(result.state).toBe('NY');
    expect(result.zip_code).toBe('67890');
    expect(result.country).toBe('Canada');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update user with partial fields', async () => {
    const userId = await createTestUser();

    const updateInput: UpdateUserInput = {
      id: userId,
      email: 'partial@example.com',
      first_name: 'Updated'
    };

    const result = await updateUser(updateInput);

    // Updated fields
    expect(result.email).toBe('partial@example.com');
    expect(result.first_name).toBe('Updated');
    
    // Unchanged fields
    expect(result.last_name).toBe('Doe');
    expect(result.phone).toBe('555-0123');
    expect(result.address).toBe('123 Main St');
  });

  it('should update nullable fields to null', async () => {
    const userId = await createTestUser();

    const updateInput: UpdateUserInput = {
      id: userId,
      phone: null,
      address: null,
      city: null
    };

    const result = await updateUser(updateInput);

    expect(result.phone).toBeNull();
    expect(result.address).toBeNull();
    expect(result.city).toBeNull();
    
    // Unchanged fields
    expect(result.email).toBe('test@example.com');
    expect(result.first_name).toBe('John');
    expect(result.last_name).toBe('Doe');
  });

  it('should update user in database', async () => {
    const userId = await createTestUser();

    const updateInput: UpdateUserInput = {
      id: userId,
      email: 'database@example.com',
      first_name: 'Database'
    };

    await updateUser(updateInput);

    // Verify changes persisted in database
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].email).toBe('database@example.com');
    expect(users[0].first_name).toBe('Database');
    expect(users[0].last_name).toBe('Doe'); // unchanged
  });

  it('should update the updated_at timestamp', async () => {
    const userId = await createTestUser();

    // Get original timestamp
    const originalUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    const originalUpdatedAt = originalUser[0].updated_at;

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateUserInput = {
      id: userId,
      first_name: 'Updated'
    };

    const result = await updateUser(updateInput);

    expect(result.updated_at > originalUpdatedAt).toBe(true);
  });

  it('should throw error for non-existent user', async () => {
    const updateInput: UpdateUserInput = {
      id: 99999, // Non-existent ID
      email: 'notfound@example.com'
    };

    expect(updateUser(updateInput)).rejects.toThrow(/User not found/i);
  });

  it('should handle empty update gracefully', async () => {
    const userId = await createTestUser();

    const updateInput: UpdateUserInput = {
      id: userId
    };

    const result = await updateUser(updateInput);

    // Should return user with only updated_at changed
    expect(result.id).toBe(userId);
    expect(result.email).toBe('test@example.com');
    expect(result.first_name).toBe('John');
    expect(result.updated_at).toBeInstanceOf(Date);
  });
});