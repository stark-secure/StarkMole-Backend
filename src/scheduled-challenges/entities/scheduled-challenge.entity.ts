import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm"
import { Challenge } from "./challenge.entity"
import { User } from "../../users/entities/user.entity"

export enum ScheduleStatus {
  PENDING = "pending",
  ACTIVE = "active",
  COMPLETED = "completed",
  EXPIRED = "expired",
}

@Entity("scheduled_challenges")
export class ScheduledChallenge {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ type: "uuid" })
  challengeId: string

  @Column({ type: "uuid", nullable: true })
  userId: string // null for global challenges

  @ManyToOne(() => Challenge)
  @JoinColumn({ name: "challengeId" })
  challenge: Challenge

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "userId" })
  user: User

  @Column({ type: "enum", enum: ScheduleStatus, default: ScheduleStatus.PENDING })
  status: ScheduleStatus

  @Column({ type: "timestamp" })
  scheduledFor: Date

  @Column({ type: "timestamp", nullable: true })
  expiresAt: Date

  @Column({ type: "boolean", default: false })
  isGlobal: boolean // true for challenges available to all users

  @Column({ type: "jsonb", nullable: true })
  metadata: any // Additional scheduling metadata

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
