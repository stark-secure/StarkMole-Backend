import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm"
import { User } from "./user.entity"
import { Referral } from "./referral.entity"

export enum RewardType {
  REFERRAL_REGISTRATION = "referral_registration",
  REFERRAL_MILESTONE = "referral_milestone",
  REFEREE_BONUS = "referee_bonus",
}

export enum RewardStatus {
  PENDING = "pending",
  AWARDED = "awarded",
  CLAIMED = "claimed",
}

@Entity("rewards")
export class Reward {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ name: "user_id" })
  userId: string

  @Column({ name: "referral_id", nullable: true })
  referralId: string

  @Column({
    type: "enum",
    enum: RewardType,
  })
  type: RewardType

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount: number

  @Column({ nullable: true })
  description: string

  @Column({
    type: "enum",
    enum: RewardStatus,
    default: RewardStatus.PENDING,
  })
  status: RewardStatus

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date

  @Column({ name: "awarded_at", nullable: true })
  awardedAt: Date

  @ManyToOne(
    () => User,
    (user) => user.rewards,
  )
  @JoinColumn({ name: "user_id" })
  user: User

  @ManyToOne(() => Referral)
  @JoinColumn({ name: "referral_id" })
  referral: Referral
}
