import { Field, ID, ObjectType } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn, Entity,OneToMany,PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Likes } from "./Likes";
import { Post } from "./Post";



@ObjectType()
@Entity()
export class User extends BaseEntity {
    @Field(() => ID)
    @PrimaryGeneratedColumn()
    id: number;
  
    @Field()
    @Column({ unique: true })
    username: string;
  
    @Field()
    @Column({ unique: true })
    email: string;
  
    @Column()
    password: string;

    @Field(() => String)
    @CreateDateColumn()
    createdAt: Date;
    
    @Field(() => String)
    @UpdateDateColumn()
    updatedAt:Date;

    @Column("bool", {default: false})
    confirmed: boolean;

    @OneToMany(() => Post, (post) => post.creator)
    posts: Post[];

    @OneToMany(() => Likes, (likes) => likes.user)
    likes: Likes[];

    @Column({nullable:true})
    profileId: number;
}