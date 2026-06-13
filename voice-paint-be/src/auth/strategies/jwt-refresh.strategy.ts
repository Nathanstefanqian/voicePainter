import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { JwtRefreshPayload } from "../interfaces/jwt-payload.interface";

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  "jwt-refresh",
) {
  constructor(private configService: ConfigService) {
    const secret = configService.get<string>("jwt.refreshSecret");
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: any) => req?.cookies?.refreshToken,
      ]),
      ignoreExpiration: false,
      secretOrKey: secret || "default-refresh-secret",
    });
  }

  validate(payload: JwtRefreshPayload): JwtRefreshPayload {
    if (!payload.sub || !payload.tokenId) {
      throw new UnauthorizedException("无效的 Refresh Token");
    }
    return {
      sub: payload.sub,
      tokenId: payload.tokenId,
      type: "refresh",
    };
  }
}
