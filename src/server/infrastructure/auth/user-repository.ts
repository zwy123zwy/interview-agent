import { getDataSource } from "@/server/infrastructure/database/data-source";
import { UserEntity } from "@/server/infrastructure/database/entities/user.entity";

export async function findUserById(userId: string) {
  const dataSource = await getDataSource();
  return dataSource.getRepository(UserEntity).findOne({ where: { userId } });
}

export async function insertUser(userId: string, passwordHash: string) {
  const dataSource = await getDataSource();
  const repo = dataSource.getRepository(UserEntity);
  const entity = repo.create({ userId, passwordHash });
  await repo.insert(entity);
  return entity;
}

