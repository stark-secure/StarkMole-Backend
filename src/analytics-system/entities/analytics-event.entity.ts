import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm"

@Entity("analytics_events")
@Index(["event", "timestamp"])
@Index(["sessionId", "timestamp"])
@Index(["userId", "timestamp"])
export class AnalyticsEventEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column()
  event: string

  @Column({ nullable: true })
  userId?: string

  @Column()
  sessionId: string

  @CreateDateColumn()
  timestamp: Date

  @Column("jsonb")
  properties: Record<string, any>

  @Column("jsonb", { nullable: true })
  metadata?: Record<string, any>
}
