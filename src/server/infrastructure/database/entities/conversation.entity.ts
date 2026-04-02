import {
  Entity,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import type { Relation } from "typeorm";

import { UserEntity } from "./user.entity";

@Entity("conversations")
export class ConversationEntity {
  @PrimaryColumn({ type: "varchar", length: 64 })
  conversationId!: string;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "userId", referencedColumnName: "userId" })
  user!: Relation<UserEntity | null>;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt!: Date;

  @OneToMany("MessageEntity", "conversation", {
    cascade: true,
  })
  messages!: Relation<unknown[]>;
}
