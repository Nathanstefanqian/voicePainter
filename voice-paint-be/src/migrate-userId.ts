import { NestFactory } from "@nestjs/core";
import { getModelToken } from "@nestjs/mongoose";
import { AppModule } from "./app.module";
import { User } from "./auth/schemas/user.schema";
import { v4 as uuidv4 } from "uuid";

async function migrate() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userModel = app.get(getModelToken(User.name));

  // 1. 给没有 userId 的用户补上
  const noUserId = await userModel.find({ userId: { $exists: false } });
  console.log(`Users without userId: ${noUserId.length}`);
  for (const user of noUserId) {
    const newId = uuidv4();
    await userModel.updateOne({ _id: user._id }, { $set: { userId: newId } });
    console.log(`  Added userId ${newId} to ${user.email || user._id}`);
  }

  // 2. 确保有 isActive
  await userModel.updateMany(
    { isActive: { $exists: false } },
    { $set: { isActive: true } },
  );
  console.log("Ensured isActive field");

  console.log("Migration complete");
  await app.close();
}

migrate();
