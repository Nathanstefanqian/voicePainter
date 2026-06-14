export interface JwtAccessPayload {
  sub: string;
  username: string;
  role: string;
  type: "access";
  iat?: number;
  exp?: number;
}

export interface JwtRefreshPayload {
  sub: string;
  tokenId: string;
  type: "refresh";
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  userId: string;
  username: string;
  role: string;
}
