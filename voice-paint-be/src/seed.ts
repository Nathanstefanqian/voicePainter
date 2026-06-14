import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { getModelToken } from "@nestjs/mongoose";
import { User } from "./auth/schemas/user.schema";
import * as bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userModel = app.get(getModelToken(User.name));

  const demoUsers = [
    {
      email: "fungleo@example.com",
      password: "Password123!",
      username: "fungleo",
      role: "admin"
    },
    {
      email: "demo@example.com",
      password: "DemoPassword123!",
      username: "演示账号",
      role: "user"
    }
  ];

  for (const userData of demoUsers) {
    const existing = await userModel.findOne({ email: userData.email });
    if (existing) {
      console.log(`User ${userData.email} already exists, updating password...`);
      existing.password = userData.password;
      await existing.save();
      continue;
    }

    await userModel.create({
      userId: uuidv4(),
      username: userData.username,
      email: userData.email,
      password: userData.password,
      role: userData.role,
      isActive: true,
      usageStats: {
        totalImages: 0,
        totalTokens: 0,
        dailyImageCount: 0,
        lastResetAt: new Date(),
      },
    });
    console.log(`Created user: ${userData.email} / ${userData.password}`);
  }

  await app.close();
}

seed();
