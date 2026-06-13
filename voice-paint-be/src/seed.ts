import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { getModelToken } from "@nestjs/mongoose";
import { User } from "./auth/schemas/user.schema";
import * as bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userModel = app.get(getModelToken(User.name));

  const email = "fungleo@example.com";
  const password = "Password123!";
  const username = "fungleo";

  const existing = await userModel.findOne({ email });
  if (existing) {
    console.log(`User ${email} already exists, skipping.`);
    await app.close();
    return;
  }

  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);

  await userModel.create({
    userId: uuidv4(),
    username,
    email,
    password: hashedPassword,
    role: "user",
    isActive: true,
    usageStats: {
      totalImages: 0,
      totalTokens: 0,
      dailyImageCount: 0,
      lastResetAt: new Date(),
    },
  });

  console.log(`Created test user: ${email} / ${password}`);
  await app.close();
}

seed();
