import {Comment} from '../entities/Comment';
import { Arg, Ctx, Field,  InputType, Int, Mutation, ObjectType, Query, Resolver,  UseMiddleware } from "type-graphql";
import { MyContext } from "../constants/MyContext";
import { isAuth } from "../middleware/isAuth";
import { getConnection } from 'typeorm';

@InputType()
export class CommentInput{
    @Field()
    body:string;
}

@ObjectType()
class PaginatedComments {
  @Field(() => Comment)
  comments: Comment[]
  
  @Field()
  hasMore: boolean
}

@Resolver(Comment)
export class CommentResolver{
    @Mutation(() => Comment,{nullable: true})
    @UseMiddleware(isAuth)
    async createComment(
        @Arg("input") input: CommentInput,
        @Ctx() { req }: MyContext
      ): Promise<Comment> {
        return Comment.create({
          ...input,
          creatorId: req.session!.userId,
        }).save();
   }
   @Mutation(() => Comment,{nullable: true})
   @UseMiddleware(isAuth)
    async updateComment(
     @Arg('id' , () => Int) id: number,
     @Arg('input') input: CommentInput,
    ):Promise<Comment | null> {
      const comment = await Comment.findOne(id)
      if(!comment){
      throw new Error("Comment does not exist")
      } 
  if(input.body){
  await Comment.update({id},{
  body: input.body
  })
  await comment.save()
      }
  return comment;
    }
@Mutation(() => Boolean)
@UseMiddleware(isAuth)
 async deleteComment(
  @Arg("id", () => Int) id: number,
  @Ctx() { req }: MyContext ): Promise<boolean> {
    await Comment.delete({ id, creatorId: req.session!.userId });
    return true;
  }

  @Query(() => [Comment]) 
  @UseMiddleware(isAuth)
  async comments(
    @Arg("limit",() => Int) limit:number,
    @Arg("cursor", {nullable:true}) cursor: string | null
  ):Promise<PaginatedComments> {
   const realLimit = Math.min(6,limit)
   const realLimitPlusOne = realLimit +1

   const replacements : any[] = [realLimitPlusOne]

   if(cursor){
     replacements.push(new Date(parseInt(cursor)))
   }
   const comments = await getConnection().query(`
   // select all fields from the table
   select c.*, 
   from comment c
   ${cursor ? `where c."createdAt" < $2`: ""}
   // SORTS BY THE NEWEST 
   order by c."createdAt" DSC
   limit $1
   `,
   replacements
   );
   return { 
     comments: comments.slice(0,realLimit),
     hasMore : comments.length === realLimitPlusOne
   }
  } 

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async likeComment(
  @Arg('commentId', () => Int) commentId:number,
  @Arg('value',() => Int) value: number,
  @Ctx() { req }: MyContext 
  ) {
  const isLiked = value !== null;
  const realValue = isLiked ? 1 : -1;
  const userId = req.session!.userId;

  getConnection().query(`
   START TRANSACTION;

   insert into likes("userId", "commentId","value")
   values(${userId},${commentId},${realValue})

   update comment
   set commentLikes = commentLikes + ${realValue}
   where id = ${commentId}

   COMMIT;
  `)
  await Comment.update(
    {
      id:commentId,
  },
  {}
  );
  return true;
   }
}
// fakes
