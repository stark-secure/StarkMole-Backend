import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm"
import { User } from "../../users/entities/user.entity"
import { ChallengeAttempt } from "./challenge-attempt.entity"

export enum ChallengeType {
  CODING = "coding",
  QUIZ = "quiz",
  PROBLEM_SOLVING = "problem_solving",
  ALGORITHM = "algorithm",
}

export enum DifficultyLevel {
  BEGINNER = 1,
  EASY = 2,
  MEDIUM = 3,
  HARD = 4,
  EXPERT = 5,
}

@Entity("challenges")
export class Challenge {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ type: "varchar", length: 255 })
  title: string

  @Column({ type: "text" })
  description: string

  @Column({ type: "enum", enum: ChallengeType })
  type: ChallengeType

  @Column({ type: "enum", enum: DifficultyLevel })
  difficulty: DifficultyLevel

  @Column({ type: "jsonb", nullable: true })
  content: any // Flexible content structure for different challenge types

  @Column({ type: "jsonb", nullable: true })
  solution: any // Expected solution or answer

  @Column({ type: "int", default: 100 })
  basePoints: number

  @Column({ type: "int", default: 3600 }) // 1 hour in seconds
  timeLimit: number

  @Column({ type: "varchar", array: true, default: [] })
  tags: string[]

  @Column({ type: "boolean", default: true })
  isActive: boolean

  @Column({ type: "uuid", nullable: true })
  createdBy: string

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "createdBy" })
  creator: User

  @OneToMany(
    () => ChallengeAttempt,
    (attempt) => attempt.challenge,
  )
  attempts: ChallengeAttempt[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
