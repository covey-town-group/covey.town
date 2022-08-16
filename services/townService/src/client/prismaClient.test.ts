import { createUser, deleteUser, updateUser } from './prismaFunctions';
import prismaMock from './singleton';

it('should create new user ', async () => {
  const user = {
    id: 243790057,
    user_name: 'Vitor',
    email: 'vitor@vitor.io',
    hash_password: 'afdjfkhanf[owh',
    banned: false,
  };

  prismaMock.user.create.mockResolvedValue(user);

  await expect(createUser(user)).resolves.toEqual({
    id: 243790057,
    user_name: 'Vitor',
    email: 'vitor@vitor.io',
    hash_password: 'afdjfkhanf[owh',
    banned: false,
  });
});

it('should update a users name ', async () => {
  const user = {
    id: 243790057,
    user_name: 'Victor',
    email: 'victor@victor.io',
    hash_password: 'afdjfkhanf[owh',
    banned: false,
  };

  prismaMock.user.update.mockResolvedValue(user);

  await expect(updateUser(user)).resolves.toEqual({
    id: 243790057,
    user_name: 'Victor',
    email: 'victor@victor.io',
    hash_password: 'afdjfkhanf[owh',
    banned: false,
  });
});

it('should fail if user exists', async () => {
  const user = {
    id: 243790056,
    user_name: 'Victor',
    email: 'victor.@victor.io',
    hash_password: 'afdjfkhanf[owh',
    banned: false,
  };

  prismaMock.user.create.mockRejectedValue(new Error('User already exists!'));

  await expect(createUser(user)).rejects.toEqual(new Error('User already exists!'));
});

it('should delete a user', async () => {
  const user = {
    id: 243790057,
    user_name: 'Victor',
    email: 'victor@victor.io',
    hash_password: 'afdjfkhanf[owh',
    banned: false,
  };

  prismaMock.user.delete.mockResolvedValue(user);
  await expect(deleteUser(user)).resolves.toEqual({
    id: 243790057,
    user_name: 'Victor',
    email: 'victor@victor.io',
    hash_password: 'afdjfkhanf[owh',
    banned: false,
  });
});
