import { Column, CreateDateColumn, Entity, PrimaryColumn } from "typeorm";

@Entity("users")
export class UserEntity {
  @PrimaryColumn({ type: "varchar", length: 64 })
  userId!: string;

  @Column({ type: "varchar", length: 255 })
  passwordHash!: string;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;
}

