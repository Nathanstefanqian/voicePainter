import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { JwtAccessPayload } from "../interfaces/jwt-payload.interface";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    const secret = configService.get<string>("jwt.accessSecret");
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret || "default-secret",
    });
  }

  validate(payload: JwtAccessPayload): JwtAccessPayload {
    if (!payload.sub) {
      throw new UnauthorizedException("无效的 Token");
    }
    return {
      sub: payload.sub,
      username: payload.username,
      role: payload.role,
      type: "access",
    };
  }
}
