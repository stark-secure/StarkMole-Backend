/* eslint-disable prettier/prettier */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { Role } from '../../common/enums/role.enum';
import { GameSession } from 'src/game-session/entities/game-session.entity';
import { Leaderboard } from '../../leaderboard/entities/leaderboard.entity';
import { Injectable } from '@nestjs/common';
import { TypedConfigService } from '../../common/config/typed-config.service';

@Entity('users')
@Injectable()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column()
  username: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.PLAYER,
  })
  role: Role;

  @Column({ nullable: true })
  walletAddress?: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ nullable: true })
  emailVerificationToken?: string;

  @Column({ nullable: true, type: 'timestamp' })
  emailVerificationExpires?: Date;

  @Column({ nullable: true })
  lastLogin?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => GameSession, (game) => game.user)
  gameSessions: GameSession[];

  constructor(private readonly configService: TypedConfigService) {}

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      const saltRounds = this.configService?.bcryptSaltRounds ?? 12;
      this.password = await bcrypt.hash(this.password, saltRounds);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  @OneToOne(() => Leaderboard, (leaderboard) => leaderboard.user)
  leaderboard: Leaderboard;
}
