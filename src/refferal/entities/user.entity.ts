import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from "typeorm"
import { Referral } from "./referral.entity"
import { Reward } from "./reward.entity"

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ unique: true })
  email: string

  @Column()
  username: string

  @Column()
  password: string

  @Column({ unique: true, name: "referral_code" })
  @Index()
  referralCode: string

  @Column({ name: "referred_by", nullable: true })
  referredBy: string

  @Column({ name: "registration_completed", default: false })
  registrationCompleted: boolean

  @Column({ name: "first_game_completed", default: false })
  firstGameCompleted: boolean

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date

  @OneToMany(
    () => Referral,
    (referral) => referral.referrer,
  )
  referralsMade: Referral[]

  @OneToMany(
    () => Referral,
    (referral) => referral.referee,
  )
  referralsReceived: Referral[]

  @OneToMany(
    () => Reward,
    (reward) => reward.user,
  )
  rewards: Reward[]
}
