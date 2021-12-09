import { Field, Int, ObjectType } from "type-graphql";
import { BaseEntity, Column, Entity,CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn, ManyToOne, OneToMany } from "typeorm";
import { Post } from "./Post";
import { User } from "./User";



@ObjectType()
@Entity()
export class Comment extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => Int)
  @Column()
  creatorId: number

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.comment)
  creator: User;
   
  @Field(() =>  Post) 
  @OneToMany(() => Post, (post) => post.comment)
  post: Post[];

  @Field({nullable: true})
  body: string;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;

  @Field(() => Int,{nullable: true})
  @Column()
  commentLikes: number | null;
}