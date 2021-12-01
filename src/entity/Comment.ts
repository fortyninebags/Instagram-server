import { Field, Int, ObjectType } from "type-graphql";
import { BaseEntity, Column, Entity,CreateDateColumn,ManyToOne, OneToMany, UpdateDateColumn, PrimaryGeneratedColumn } from "typeorm";
import { Post } from "./Post";
import { User } from "./User";


@ObjectType()
@Entity()
export class Comment extends BaseEntity{
  @Field()
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => Int)
  @Column()
  creatorId: number

  @Field()
  @ManyToOne(() => User, (user) => user.comment)
  creator: User;

  @Field()
  @OneToMany(() => Post, (post) => post.comment)
  posts: Post[];

  @Field({nullable: true})
  body: string;

  @Field()
  @CreateDateColumn()
  createdAt: string;

  @Field()
  @UpdateDateColumn()
  updatedAt: string;

  @Field(() => Int)
  @Column()
  commentLikes: number;
}