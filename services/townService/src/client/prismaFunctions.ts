import prisma from './prismaClient';

interface CreateUser {
  email: string;
  user_name: string;
  hash_password: string;
  previous_town: number;
  banned: boolean;
  is_admin: boolean;
}

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

export async function deleteUser(user: DeleteUser): Promise<DeleteUser> {
  const result = await prisma.user.delete({
    where: { email: user.email },
  });
  return result;
}