import { ExtractJwt, Strategy } from "passport-jwt"
import { PassportStrategy } from "@nestjs/passport"
import { Injectable, UnauthorizedException } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { UserService } from "src/users/providers/users.service"

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private userService: UserService,
  ) {
    // 👇 Call super() with a config object using configService directly
    const jwtSecret = configService.get<string>("JWT_SECRET")
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not defined in environment variables")
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    })
  }

  async validate(payload: any) {
    const user = await this.userService.findOne(payload.sub)
    if (!user) {
      throw new UnauthorizedException("User not found")
    }
    return { id: payload.sub, email: payload.email, role: payload.role }
  }
}
