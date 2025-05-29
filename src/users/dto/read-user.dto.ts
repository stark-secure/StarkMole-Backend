import { Exclude, Expose } from "class-transformer"
import type { Role } from "../../common/enums/role.enum"

export class ReadUserDto {
  @Expose()
  id: string

  @Expose()
  email: string

  @Expose()
  username: string

  @Expose()
  role: Role

  @Expose()
  walletAddress?: string

  @Expose()
  isActive: boolean

  @Expose()
  lastLogin?: Date

  @Expose()
  createdAt: Date

  @Expose()
  updatedAt: Date

  @Exclude()
  password: string
}
