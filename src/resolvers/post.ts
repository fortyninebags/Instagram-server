import { Post } from "../entities/Post";
import { Arg, Ctx, Field, 
  FieldResolver, InputType,
  Int, Mutation, ObjectType, Query, Resolver, Root, UseMiddleware } from "type-graphql";
import { MyContext } from "../constants/MyContext";
import { isAuth } from "../middleware/isAuth";
import { getConnection } from "typeorm";
import { User } from "../entities/User";

@InputType()
export class PostInput{
    @Field()
    description:string;
}

@ObjectType()
class PaginatedPosts {
  @Field(() => Post)
  posts: Post[]
  
  @Field()
  hasMore: boolean
}

@Resolver(Post)
export class PostResolver{

// @FieldResolver(() => String)
// textSnippet(
//   @Root() root:Post
// ) {
//   return root.description.slice(0,50)
// }

@FieldResolver(() => User)
async creator(
@Root() post: Post,
@Ctx() {userLoader}: MyContext
) {
return  await userLoader.load(post.creatorId)
}

@FieldResolver(() => Post)
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
 })
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
     @Arg('input') input: PostInput,
    ):Promise<Post | null> {
      const post = await Post.findOne(id)
      if(!post){
      return null
      } 
  if(input.description){
  await Post.update({id},{
  description: input.description
  })
  await post.save()
      }
  return post;
    }
@Mutation(() => Boolean)
@UseMiddleware(isAuth)
 async deletePost(
  @Arg("id", () => Int) id: number,
  @Ctx() { req }: MyContext ): Promise<boolean> {
    await Post.delete({ id, creatorId: req.session!.userId });
    return true;
  }
  @Query(() => [Post]) 
  @UseMiddleware(isAuth)
  async posts(
    // // limits for showable posts
    @Arg("limit",() => Int) limit:number,
    // the date the post is created
    @Arg("cursor", {nullable:true}) cursor: string | null
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
     hasMore : posts.length === realLimitPlusOne
   }
  } 

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async like(
  @Arg('postId', () => Int) postId:number,
  @Arg('value',() => Int) value: number,
  @Ctx() { req }: MyContext 
  ) {
  const isLiked = value !== null
  const realValue = isLiked ? 1 : null
  const userId = req.session!.userId

  getConnection().query(`
   START TRANSACTION;

   insert into likes("userId", "postId","value")
   values(${userId},${postId},${realValue})

   update post
   set postLikes = postLikes + ${realValue}
   where id = ${postId}

   COMMIT;
  `)
  await Post.update(
    {
      id:postId,
  },
  {}
  );
  return true;
   }
}
// fakes
