import { Post } from "../entities/Post";
import { Arg, Ctx, Field, 
  FieldResolver, InputType,
  Int, Mutation, ObjectType, Query, Resolver, Root, UseMiddleware } from "type-graphql";
import { MyContext } from "../constants/MyContext";
import { isAuth } from "../middleware/isAuth";
import { getConnection } from "typeorm";
import { User } from "../entities/User";
import {Likes} from "../entities/Likes";

@InputType()
export class PostInput{
    @Field()
    description:string;
}

@ObjectType()
class PaginatedPosts {
  @Field(() => [Post])
  posts: Post[];
  
  @Field()
  hasMore: boolean;
}

@Resolver(Post)
export class PostResolver{
@FieldResolver(() => User)
async creator(
@Root() post: Post,
@Ctx() {userLoader}: MyContext
) {
return  await userLoader.load(post.creatorId)
}

@FieldResolver(() => Int,{nullable: true})
async likeStatus(
  @Root() post: Post,
  @Ctx() {likesLoader,req}: MyContext
) {
if(!req.session!.userId){
  return null
}
 
 const like = await  likesLoader.load({
   postId: post.id,
   userId: req.session!.userId
 });


 return like ? like.value : null;
}

    @Mutation(() => Post,{nullable: true})
    @UseMiddleware(isAuth)
    async createPost(
        @Arg("input") input: PostInput,
        @Ctx() { req }: MyContext
      ): Promise<Post> {
        return Post.create({
          ...input,
          creatorId: req.session!.userId,
        }).save();
   }
   @Mutation(() => Post,{nullable: true})
   @UseMiddleware(isAuth)
    async updatePost(
     @Arg('id' , () => Int) id: number,
     @Arg('description') description: string,
     @Ctx() { req }: MyContext
    ):Promise<Post | null> {
      const result = await getConnection()
      .createQueryBuilder()
      .update(Post)
      .set({description})
      .where('id = :id and "creatorId" = :creatorId', {
        id,
        creatorId: req.session!.userId,
      })
      .returning("*")
      .execute();

    return result.raw[0]
    }

@Query(() => Post, { nullable: true })
   post(@Arg("id", () => Int) id: number): Promise<Post | undefined> {
    return Post.findOne(id);
}
  

@Mutation(() => Boolean)
@UseMiddleware(isAuth)
 async deletePost(
  @Arg("id", () => Int) id: number,
  @Ctx() { req }: MyContext ): Promise<boolean> {
    await Post.delete({ id, creatorId: req.session!.userId });
    return true;
  }
  @Query(() => PaginatedPosts) 
  @UseMiddleware(isAuth)
  async posts(
    // // limits for showable posts
    @Arg("limit",() => Int) limit:number,
    // the date the post is created
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null  
    ):Promise<PaginatedPosts> {
   const realLimit = Math.min(50,limit)
   const realLimitPlusOne = realLimit +1

   const replacements : any[] = [realLimitPlusOne]

   if(cursor){ 
     replacements.push(new Date(parseInt(cursor)))
   }
   const posts = await getConnection().query(`
   // select all fields from the post table
   select p.*, 
   from post p
   ${cursor ? `where p."createdAt" < $2`: ""}
   // SORTS BY THE NEWEST 
   order by p."createdAt" DSC
   limit $1
   `,
   replacements
   );
   return { 
     posts: posts.slice(0,realLimit),
     hasMore : posts.length === realLimitPlusOne,
   };
  } 


  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async like(
    @Arg("postId", () => Int) postId: number,
    @Arg("value", () => Int) value: number,
    @Ctx() { req }: MyContext
  ) {
    const isLiked = value !== null;
    const realValue = isLiked ? 1: -1;
    const { userId } = req.session!.userId;
    
    const like = await Likes.findOne({ where: { postId, userId } });

    // the user has voted on the post before
    // and they are changing their vote
    if (like && like.value !== realValue) {
      await getConnection().transaction(async (tm) => {
        await tm.query(
          `
    update like
    set value = $1
    where "postId" = $2 and "userId" = $3
        `,
          [realValue, postId, userId]
        );

        await tm.query(
          `
          update post
          set likes =  likes + $1
          where id = $2
        `,
          [realValue, postId]
        );
      });
    } else if (!like) {
      // never voted before 
      await getConnection().transaction(async (tm) => {
        await tm.query(
          `
    insert into likes ("userId", "postId", value)
    values ($1, $2, $3)
        `,
          [userId, postId, realValue]
        );

        await tm.query(
          `
    update post
    set likes = likes + $1
    where id = $2
      `,
          [realValue, postId]
        );
      });
    }
    return true;
 }
}
