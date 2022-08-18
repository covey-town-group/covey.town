import prisma from './prismaClient';

export interface CreateUser {
  email: string;
  user_name: string;
  hash_password: string;
  banned: boolean;
}

/**
 * Create user in the SQL database
 * @param user we need to create
 * @returns a promise that operation resutl
 */
export async function createUser(user: CreateUser): Promise<CreateUser> {
  try {
    const result = await prisma.user.create({
      data: user,
    });
    return result;
  } catch (err) {
    throw new Error('User already exists!');
  }
}

interface UpdateUser {
  id: number;
  user_name: string;
  email: string;
}

/**
 * Update the User that already in the database
 * @param user the update information
 * @returns the resul successfully or not
 */
export async function updateUser(user: UpdateUser): Promise<UpdateUser> {
  const result = await prisma.user.update({
    where: { id: user.id },
    data: user,
  });
  return result;
}

interface DeleteUser {
  email: string;
}

/**
 * Delete user from the database.
 * @param user we need to delete
 * @returns  the result whether is success or not
 */
export async function deleteUser(user: DeleteUser): Promise<DeleteUser> {
  const result = await prisma.user.delete({
    where: { email: user.email },
  });
  return result;
}

interface FindUser {
  email: string;
  password?: string;
}

interface FindUserResult {
  user_name: string;
  hash_password: string;
  banned: boolean;
}

/**
 * To find the user in our databse 
 * @param user we want to find in our database
 * @returns sccessfully or not
 */
export async function findUser(user: FindUser): Promise<FindUserResult> {
  const result = await prisma.user.findUnique({
    where: { email: user.email },
    select: {
      user_name: true,
      hash_password: true,
      banned: true,
    },
  });
  if (result) {
    return result;
  }
  throw new Error('User not found!');
}
