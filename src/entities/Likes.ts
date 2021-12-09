import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryColumn} from "typeorm";
import { Message } from "./Message";
import { Post } from "./Post";
import { User } from "./User";



@Entity()
export class Likes extends BaseEntity {
  @Column({ type: "int" })
  value: number;

  @PrimaryColumn()
  userId: number;

  @ManyToOne(() => User, (user) => user.likes)
  user: User;

  @PrimaryColumn()
  postId: number;

  @ManyToOne(() => Post, (post) => post.likes, {
    onDelete: "CASCADE",
  })
  post: Post;

  @OneToMany(() => Message, (message) => message.likes ,{
    onDelete: "CASCADE",
  })
  message: Message;
}