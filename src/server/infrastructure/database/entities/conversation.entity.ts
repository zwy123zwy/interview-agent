import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  type Relation,
} from "typeorm";
import { MessageEntity } from "./message.entity";

@Entity("conversations")
export class ConversationEntity {
  @PrimaryColumn({ type: "varchar", length: 64 })
  conversationId!: string;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt!: Date;

  @OneToMany(() => MessageEntity, (message) => message.conversation, {
    cascade: true,
  })
  messages!: Relation<MessageEntity[]>;
}
