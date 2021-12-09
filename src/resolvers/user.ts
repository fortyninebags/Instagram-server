import { User } from "../entities/User";
import { Arg, Ctx, Field, InputType, Mutation,ObjectType,Query,Resolver, UseMiddleware } from "type-graphql";
import argon2 from 'argon2';
import { MyContext } from "../constants/MyContext";
import { sendEmail } from "../utils/sendEmail";
import { createConfirmationUrl } from "../utils/createConfirmationUrl";
import { changePasswordInput } from "../forgotPasswordInput.ts/changePasswordInput";
import { confirmUserPrefix, forgotPasswordPrefix } from "../prefixes/redisPrefixes";
import { redis } from "../redis";
import { COOKIE_NAME } from "../constants";
import { isAuth } from "../middleware/isAuth";
import { getConnection } from "typeorm";

@InputType()
export class UserInput{
    @Field()
    username: string;
  
    @Field()
    email?: string

    @Field()
    password: string;
}

@ObjectType()
export class ErrorField{
    @Field()
    field: string;

    @Field()
    message: string;
}

@ObjectType()
export class UserResponse{
    // IF an error occurs
    @Field(() => [ErrorField],{nullable: true})
    errors?: ErrorField[]

    // IF IT WORKED
    @Field(() => User,{nullable: true})
    user?: User
}

@Resolver()
export class UserResolver{
    @Query(() => String)
    async hello() {
        return "Hello world"
    }
    @Mutation(() => UserResponse)
    async register(
      @Arg('options', () => String) options: UserInput,
      @Arg('email',() => String) email: string,
      @Ctx() ctx : MyContext,
    ):Promise<UserResponse>{
        if(options.password.length <= 6)
        return {
            errors: [{
                field: "password",
                message:"Password must be greater than 6"
            }],
        }
        if(options.username.length <=6 ) {
            return{
                errors: [{
                   field: "username",
                   message:"Username must be greater than 6"
                }]
            }
        }
        // Creates the user
       const hashedPassword = await argon2.hash(options.password);
       let user;
       try {
         const result = await getConnection()
           .createQueryBuilder()
           .insert()
           .into(User)
           .values({
             username: options.username,
             email: options.email,
             password: hashedPassword,
           })
           .returning("*")
           .execute();
         user = result.raw[0];
       } catch (err) {
         if (err.code === "23505") {
           return {
             errors: [
               {
                 field: "username",
                 message: "username already taken",
               },
             ],
           };
         }
       }

       await sendEmail(email,await createConfirmationUrl(user.id));
  
       ctx.req.session!.userId = user.id; 
       return {
           user
       };
    }

    @Mutation(() => UserResponse)
    async login(
      @Arg('email',() => String) email: string,
      @Arg('password',() => String) password: string,
      @Arg('username',() => String) username: string,
      @Ctx() ctx : MyContext,
    ):Promise<UserResponse>{
        const user = await User.findOne(
            email.includes("@")
              ? { where: { email: email } }
              : { where: { username: username } }
          );
          if(!user) {
              return{
                  errors: [{
                      field: "username",
                      message: "Username already exists",
                  }],
              }
          }
           const valid = await argon2.verify(user.password,password);
           if(!valid){
               return{
                   errors: [{
                       field:"password",
                       message:"Incorrect password",
                   }],
               }
           }
          if(!user.confirmed){
              return {
                  errors: [{
                      field: "email",
                      message: "Confirm your email before proceeding"
                  }],
              }
          } 
          ctx.req.session!.userId = user.id;
          return {
              user
          };
        }

     @Mutation(() => Boolean)
     async logout(
       @Ctx() ctx : MyContext,
     ):Promise<Boolean>{
    return new Promise
    ((res,rej) => ctx.req.session!.destroy((err) => {
        if(err) {
            console.error(err)
            // if an error occurs rejects
            rej(false)
            return
        }
      ctx.res.clearCookie(COOKIE_NAME)
         // if it passes gives a response
      res(true)
   })
  )
}

 @Mutation(() => User,{nullable: true})
 @UseMiddleware(isAuth)
 async changePassword(
     @Arg('data') {token,password}: changePasswordInput,
     @Ctx() ctx: MyContext
 ):Promise<User | null>{
    const userId = await redis.get(confirmUserPrefix + token);
    if(!userId){
        return null
    }
    const user = await User.findOne(userId);

    if(!user){
        return null
    }
    await redis.del(forgotPasswordPrefix + token)

    user.password = await argon2.hash(password)
    await user.save();

    ctx.req.session!.userId = user.id;
    return user;
 };
 @Mutation(() => UserResponse,{nullable: true})
 @UseMiddleware(isAuth)
    async changeUsername(
     @Arg('change') change: UserInput,
     @Ctx() {req}: MyContext,
    ):Promise<UserResponse | null>{
const userId = req.session!.userId
const user =  await User.findOne({where:{userId}}) 

if(change.username.length <= 6){
  return {
      errors: [{
          field: 'username',
          message: 'Username must be greater than 6'
      },
    ],
  }
}

if(user){
    user.username = change.username
    user.save()
} 

 return {
     user
  }
 }
}