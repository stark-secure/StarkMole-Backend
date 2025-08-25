import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm"
import { Translation } from "./translation.entity"

@Entity("languages")
export class Language {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ unique: true, length: 10 })
  code: string // e.g., 'en', 'es', 'fr'

  @Column({ length: 100 })
  name: string // e.g., 'English', 'Spanish', 'French'

  @Column({ length: 100 })
  nativeName: string // e.g., 'English', 'Español', 'Français'

  @Column({ default: true })
  isActive: boolean

  @Column({ default: false })
  isDefault: boolean

  @OneToMany(
    () => Translation,
    (translation) => translation.language,
  )
  translations: Translation[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
