import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import type { Relation } from "typeorm";

@Entity("messages")
export class MessageEntity {
  @PrimaryColumn({ type: "varchar", length: 64 })
  id!: string;

  @Column({ type: "varchar", length: 20 })
  role!: "user" | "assistant" | "system";

  @Column({ type: "text" })
  content!: string;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @Column({ type: "varchar", length: 64 })
  conversationId!: string;

  @ManyToOne("ConversationEntity", "messages", {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "conversationId" })
  conversation!: Relation<unknown>;
}
