import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index, Unique } from "typeorm"
import { User } from "./user.entity"

export enum ReferralStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  EXPIRED = "expired",
}

@Entity("referrals")
@Unique(["referrer", "referee"])
@Index(["referralCode"])
export class Referral {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ name: "referral_code" })
  referralCode: string

  @Column({ name: "referrer_id" })
  referrerId: string

  @Column({ name: "referee_id" })
  refereeId: string

  @Column({
    type: "enum",
    enum: ReferralStatus,
    default: ReferralStatus.PENDING,
  })
  status: ReferralStatus

  @Column({ name: "registration_reward_given", default: false })
  registrationRewardGiven: boolean

  @Column({ name: "milestone_reward_given", default: false })
  milestoneRewardGiven: boolean

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date

  @ManyToOne(
    () => User,
    (user) => user.referralsMade,
  )
  @JoinColumn({ name: "referrer_id" })
  referrer: User

  @ManyToOne(
    () => User,
    (user) => user.referralsReceived,
  )
  @JoinColumn({ name: "referee_id" })
  referee: User
}
