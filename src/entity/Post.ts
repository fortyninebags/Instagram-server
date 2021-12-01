import { Field, Int, ObjectType } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Likes } from "./Likes";
import { User } from "./User";

@ObjectType()
@Entity()
export class Post extends BaseEntity {
    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id: number;   

    @Field()
    @Column()
    description: string;

    @Field()
    @UpdateDateColumn()
    updatedAt: string;

    @Field()
    @CreateDateColumn()
    createdAt: string;

    @Field()
    @Column({ type: "int", default: 0 })
    postLikes!: number;

    @Field(() => Int)
    @Column()
    creatorId: number;

    @Field(() => Int, { nullable: true })
    likeStatus: number | null; 

    @Field()
    @ManyToOne(() => User, (user) => user.posts)
    creator: User;

    @OneToMany(() => Likes, (likes) => likes.post)
    likes: Likes[];
  
    @OneToMany(() => Comment, (comment) => comment.posts)
    comment: Comment[];
}
