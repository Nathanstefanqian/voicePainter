import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { v4 as uuidv4 } from "uuid";
import * as bcrypt from "bcrypt";

import {
  User,
  UserDocument,
  RefreshToken,
  RefreshTokenDocument,
} from "./schemas";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import {
  JwtAccessPayload,
  JwtRefreshPayload,
} from "./interfaces/jwt-payload.interface";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly BCRYPT_ROUNDS = 12;
  private readonly ACCESS_TOKEN_TTL = 15 * 60;
  private readonly REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60;

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(RefreshToken.name)
    private tokenModel: Model<RefreshTokenDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userModel.findOne({
      $or: [{ email: dto.email }, { username: dto.username }],
    });

    if (existing) {
      throw new ConflictException("邮箱或用户名已被注册");
    }

    const userId = uuidv4();
    const user = await this.userModel.create({
      userId,
      username: dto.username,
      email: dto.email,
      password: dto.password,
      role: "user",
      isActive: true,
      usageStats: {
        totalImages: 0,
        totalTokens: 0,
        dailyImageCount: 0,
        lastResetAt: new Date(),
      },
    });

    return {
      userId: user.userId,
      username: user.username,
      email: user.email,
      createdAt: (user as any).createdAt,
    };
  }

  async login(dto: LoginDto, userAgent?: string) {
    const user = await this.userModel.findOne({ email: dto.email });

    if (!user) {
      throw new UnauthorizedException("邮箱或密码错误");
    }

    const isPasswordValid = await user.comparePassword(dto.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException("邮箱或密码错误");
    }

    await this.userModel.updateOne(
      { userId: user.userId },
      { lastLoginAt: new Date() },
    );

    const accessPayload: JwtAccessPayload = {
      sub: user.userId,
      username: user.username,
      role: user.role,
      type: "access",
    };

    const accessToken = this.jwtService.sign(accessPayload, {
      secret: this.configService.get<string>("jwt.accessSecret"),
      expiresIn: this.ACCESS_TOKEN_TTL,
    });

    const tokenId = uuidv4();
    const refreshPayload: JwtRefreshPayload = {
      sub: user.userId,
      tokenId,
      type: "refresh",
    };

    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.configService.get<string>("jwt.refreshSecret"),
      expiresIn: this.REFRESH_TOKEN_TTL,
    });

    const refreshTokenHash = await bcrypt.hash(refreshToken, 8);
    await this.tokenModel.create({
      tokenId,
      userId: user.userId,
      refreshToken: refreshTokenHash,
      expiresAt: new Date(Date.now() + this.REFRESH_TOKEN_TTL * 1000),
      userAgent: userAgent || "unknown",
      status: "valid",
    });

    return {
      accessToken,
      expiresIn: this.ACCESS_TOKEN_TTL,
      user: {
        userId: user.userId,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      refreshToken,
    };
  }

  async refreshTokens(refreshToken: string) {
    let payload: JwtRefreshPayload;

    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>("jwt.refreshSecret"),
      });
    } catch {
      throw new UnauthorizedException("Refresh Token 已过期");
    }

    const tokenRecord = await this.tokenModel.findOne({
      tokenId: payload.tokenId,
      status: "valid",
    });

    if (!tokenRecord) {
      throw new UnauthorizedException("Token 已失效");
    }

    const user = await this.userModel.findOne({ userId: payload.sub });
    if (!user || !user.isActive) {
      throw new UnauthorizedException("账户已禁用");
    }

    await this.tokenModel.updateOne(
      { tokenId: payload.tokenId },
      { status: "revoked", revokedAt: new Date() },
    );

    const newTokenId = uuidv4();
    const newAccessPayload: JwtAccessPayload = {
      sub: user.userId,
      username: user.username,
      role: user.role,
      type: "access",
    };

    const newAccessToken = this.jwtService.sign(newAccessPayload, {
      secret: this.configService.get<string>("jwt.accessSecret"),
      expiresIn: this.ACCESS_TOKEN_TTL,
    });

    const newRefreshPayload: JwtRefreshPayload = {
      sub: user.userId,
      tokenId: newTokenId,
      type: "refresh",
    };

    const newRefreshToken = this.jwtService.sign(newRefreshPayload, {
      secret: this.configService.get<string>("jwt.refreshSecret"),
      expiresIn: this.REFRESH_TOKEN_TTL,
    });

    await this.tokenModel.create({
      tokenId: newTokenId,
      userId: user.userId,
      refreshToken: await bcrypt.hash(newRefreshToken, 8),
      expiresAt: new Date(Date.now() + this.REFRESH_TOKEN_TTL * 1000),
      status: "valid",
    });

    return {
      accessToken: newAccessToken,
      expiresIn: this.ACCESS_TOKEN_TTL,
      refreshToken: newRefreshToken,
    };
  }

  async logout(userId: string) {
    await this.tokenModel.updateMany(
      { userId, status: "valid" },
      { status: "revoked", revokedAt: new Date() },
    );
  }

  async getUserById(userId: string) {
    const user = await this.userModel.findOne({ userId });
    if (!user) {
      return null;
    }
    return {
      userId: user.userId,
      username: user.username,
      email: user.email,
      role: user.role,
      settings: user.settings,
      createdAt: (user as any).createdAt,
    };
  }

  async getUserModelById(userId: string) {
    return this.userModel.findOne({ userId });
  }

  async updateSettings(userId: string, settings: { preferredModel?: string }) {
    await this.userModel.updateOne({ userId }, { $set: { settings } });
    return { message: "设置已更新" };
  }
}
