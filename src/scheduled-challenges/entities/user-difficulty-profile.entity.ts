import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from "typeorm"
import { User } from "../../users/entities/user.entity"
import { ChallengeType, DifficultyLevel } from "./challenge.entity"

@Entity("user_difficulty_profiles")
@Unique(["userId", "challengeType"])
export class UserDifficultyProfile {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ type: "uuid" })
  userId: string

  @ManyToOne(() => User)
  @JoinColumn({ name: "userId" })
  user: User

  @Column({ type: "enum", enum: ChallengeType })
  challengeType: ChallengeType

  @Column({ type: "enum", enum: DifficultyLevel, default: DifficultyLevel.BEGINNER })
  currentDifficulty: DifficultyLevel

  @Column({ type: "float", default: 0.0 })
  successRate: number // 0.0 to 1.0

  @Column({ type: "int", default: 0 })
  totalAttempts: number

  @Column({ type: "int", default: 0 })
  successfulAttempts: number

  @Column({ type: "float", default: 0.0 })
  averageScore: number

  @Column({ type: "float", default: 0.0 })
  averageTimeSpent: number // in seconds

  @Column({ type: "timestamp", nullable: true })
  lastChallengeAt: Date

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
