import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm"
import { Challenge } from "./challenge.entity"
import { User } from "../../users/entities/user.entity"

export enum AttemptStatus {
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  FAILED = "failed",
  TIMEOUT = "timeout",
}

@Entity("challenge_attempts")
export class ChallengeAttempt {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ type: "uuid" })
  challengeId: string

  @Column({ type: "uuid" })
  userId: string

  @ManyToOne(
    () => Challenge,
    (challenge) => challenge.attempts,
  )
  @JoinColumn({ name: "challengeId" })
  challenge: Challenge

  @ManyToOne(() => User)
  @JoinColumn({ name: "userId" })
  user: User

  @Column({ type: "enum", enum: AttemptStatus, default: AttemptStatus.IN_PROGRESS })
  status: AttemptStatus

  @Column({ type: "jsonb", nullable: true })
  userSolution: any

  @Column({ type: "int", default: 0 })
  score: number

  @Column({ type: "int", default: 0 })
  timeSpent: number // in seconds

  @Column({ type: "timestamp", nullable: true })
  startedAt: Date

  @Column({ type: "timestamp", nullable: true })
  completedAt: Date

  @CreateDateColumn()
  createdAt: Date
}
