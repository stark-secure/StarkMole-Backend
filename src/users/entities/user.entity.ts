import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { Role } from '../../common/enums/role.enum';
import { GameSession } from 'src/game-session/entities/game-session.entity';

@Entity('users')
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

  @Column({ nullable: true })
  lastLogin?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => GameSession, (game) => game.user)
  gameSessions: GameSession[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      const saltRounds = Number.parseInt(
        process.env.BCRYPT_SALT_ROUNDS ?? '12',
      );
      this.password = await bcrypt.hash(this.password, saltRounds);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}
