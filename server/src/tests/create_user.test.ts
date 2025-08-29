import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Complete test input with all fields
const completeTestInput: CreateUserInput = {
  email: 'john.doe@example.com',
  first_name: 'John',
  last_name: 'Doe',
  phone: '+1-555-0123',
  address: '123 Main Street',
  city: 'Anytown',
  state: 'CA',
  zip_code: '90210',
  country: 'USA',
};

// Minimal test input with required fields only
const minimalTestInput: CreateUserInput = {
  email: 'jane.smith@example.com',
  first_name: 'Jane',
  last_name: 'Smith',
  phone: null,
  address: null,
  city: null,
  state: null,
  zip_code: null,
  country: null,
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user with all fields populated', async () => {
    const result = await createUser(completeTestInput);

    // Verify all field values
    expect(result.email).toEqual('john.doe@example.com');
    expect(result.first_name).toEqual('John');
    expect(result.last_name).toEqual('Doe');
    expect(result.phone).toEqual('+1-555-0123');
    expect(result.address).toEqual('123 Main Street');
    expect(result.city).toEqual('Anytown');
    expect(result.state).toEqual('CA');
    expect(result.zip_code).toEqual('90210');
    expect(result.country).toEqual('USA');
    
    // Verify auto-generated fields
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a user with only required fields', async () => {
    const result = await createUser(minimalTestInput);

    // Verify required fields
    expect(result.email).toEqual('jane.smith@example.com');
    expect(result.first_name).toEqual('Jane');
    expect(result.last_name).toEqual('Smith');
    
    // Verify optional fields are null
    expect(result.phone).toBeNull();
    expect(result.address).toBeNull();
    expect(result.city).toBeNull();
    expect(result.state).toBeNull();
    expect(result.zip_code).toBeNull();
    expect(result.country).toBeNull();
    
    // Verify auto-generated fields
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save user to database correctly', async () => {
    const result = await createUser(completeTestInput);

    // Query database to verify user was saved
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    const savedUser = users[0];
    
    expect(savedUser.email).toEqual('john.doe@example.com');
    expect(savedUser.first_name).toEqual('John');
    expect(savedUser.last_name).toEqual('Doe');
    expect(savedUser.phone).toEqual('+1-555-0123');
    expect(savedUser.address).toEqual('123 Main Street');
    expect(savedUser.city).toEqual('Anytown');
    expect(savedUser.state).toEqual('CA');
    expect(savedUser.zip_code).toEqual('90210');
    expect(savedUser.country).toEqual('USA');
    expect(savedUser.created_at).toBeInstanceOf(Date);
    expect(savedUser.updated_at).toBeInstanceOf(Date);
  });

  it('should enforce email uniqueness', async () => {
    // Create first user
    await createUser(completeTestInput);

    // Attempt to create second user with same email
    const duplicateEmailInput: CreateUserInput = {
      email: 'john.doe@example.com', // Same email
      first_name: 'Different',
      last_name: 'Person',
      phone: null,
      address: null,
      city: null,
      state: null,
      zip_code: null,
      country: null,
    };

    // Should throw error due to unique constraint
    await expect(createUser(duplicateEmailInput)).rejects.toThrow(/duplicate key value violates unique constraint/i);
  });

  it('should handle mixed null and non-null optional fields', async () => {
    const mixedInput: CreateUserInput = {
      email: 'mixed.user@example.com',
      first_name: 'Mixed',
      last_name: 'User',
      phone: '+1-555-9999',
      address: null, // null
      city: 'Some City',
      state: null, // null
      zip_code: '12345',
      country: null, // null
    };

    const result = await createUser(mixedInput);

    expect(result.email).toEqual('mixed.user@example.com');
    expect(result.first_name).toEqual('Mixed');
    expect(result.last_name).toEqual('User');
    expect(result.phone).toEqual('+1-555-9999');
    expect(result.address).toBeNull();
    expect(result.city).toEqual('Some City');
    expect(result.state).toBeNull();
    expect(result.zip_code).toEqual('12345');
    expect(result.country).toBeNull();
  });

  it('should set created_at and updated_at timestamps', async () => {
    const beforeCreation = new Date();
    const result = await createUser(completeTestInput);
    const afterCreation = new Date();

    // Verify timestamps are within reasonable range
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
  });
});