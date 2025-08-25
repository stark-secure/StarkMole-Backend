import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm"
import { Language } from "./language.entity"

@Entity("translations")
@Index(["key", "language"], { unique: true })
export class Translation {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ length: 255 })
  key: string // e.g., 'common.welcome', 'auth.login'

  @Column("text")
  value: string // The translated text

  @Column({ length: 100, nullable: true })
  namespace: string // Optional grouping e.g., 'auth', 'common', 'errors'

  @Column("text", { nullable: true })
  description: string // Optional description for translators

  @ManyToOne(
    () => Language,
    (language) => language.translations,
    { onDelete: "CASCADE" },
  )
  @JoinColumn({ name: "languageId" })
  language: Language

  @Column()
  languageId: number

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
