import { db } from '../db';
import { usersTable } from '../db/schema';
import { type UpdateUserInput, type User } from '../schema';
import { eq } from 'drizzle-orm';

export const updateUser = async (input: UpdateUserInput): Promise<User> => {
  try {
    // Build update object with only provided fields
    const updateData: Partial<typeof usersTable.$inferInsert> = {
      updated_at: new Date(),
    };

    if (input.email !== undefined) updateData.email = input.email;
    if (input.first_name !== undefined) updateData.first_name = input.first_name;
    if (input.last_name !== undefined) updateData.last_name = input.last_name;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.address !== undefined) updateData.address = input.address;
    if (input.city !== undefined) updateData.city = input.city;
    if (input.state !== undefined) updateData.state = input.state;
    if (input.zip_code !== undefined) updateData.zip_code = input.zip_code;
    if (input.country !== undefined) updateData.country = input.country;

    // Update user record
    const result = await db.update(usersTable)
      .set(updateData)
      .where(eq(usersTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error('User not found');
    }

    return result[0];
  } catch (error) {
    console.error('User update failed:', error);
    throw error;
  }
};