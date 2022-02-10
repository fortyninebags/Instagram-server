import { User } from "../entities/User";
import { Arg, Ctx, Field, InputType, Mutation,ObjectType,Resolver, UseMiddleware } from "type-graphql";
import argon2 from 'argon2';
import { MyContext } from "../constants/MyContext";
import { sendEmail } from "../utils/sendEmail";
import { createConfirmationUrl } from "../utils/createConfirmationUrl";
import {  forgotPasswordPrefix } from "../prefixes/redisPrefixes";
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
    errors?: ErrorField[];

    // IF IT WORKED
    @Field(() => User,{nullable: true})
    user?: User;
}

@Resolver(User)
export class UserResolver{
    @Mutation(() => UserResponse)
    async register(
      @Arg('options', () => String) options: UserInput,
      @Arg('email') email: string,
      @Ctx() ctx : MyContext,
    ):Promise<UserResponse>{
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
      @Arg("usernameOrEmail") usernameOrEmail: string,
      @Arg('password',() => String) password: string,
      @Ctx() ctx : MyContext,
    ):Promise<UserResponse>{
      const user = await User.findOne(
        usernameOrEmail.includes("@")
          ? { where: { email: usernameOrEmail } }
          : { where: { username: usernameOrEmail } }
      );
      if (!user) {
        return {
          errors: [
            {
              field: "usernameOrEmail",
              message: "that username doesn't exist",
            },
          ],
        };
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
  logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) =>
      req.session!.destroy((err) => {
        res.clearCookie(COOKIE_NAME);
        if (err) {
          console.log(err);
          resolve(false);
          return;
        }

        resolve(true);
      })
    );
}

 @Mutation(() => UserResponse,{nullable: true})
 @UseMiddleware(isAuth)
 async changePassword(
  @Arg("token") token: string,
  @Arg("newPassword") newPassword: string,
  @Ctx() { redis, req }: MyContext
 ):Promise<UserResponse | null>{
  if (newPassword.length <= 6) {
    return {
      errors: [
        {
          field: "newPassword",
          message: "Length must be greater than 6",
        },
      ],
    };
  }

  const key = forgotPasswordPrefix + token;
  const userId = await redis.get(key);
  if (!userId) {
    return {
      errors: [
        {
          field: "token",
          message: "Token expired",
        },
      ],
    };
  }

  const userIdNum = parseInt(userId);
  const user = await User.findOne(userIdNum);

  if (!user) {
    return {
      errors: [
        {
          field: "token",
          message: "User no longer exists",
        },
      ],
    };
  }

  await User.update(
    { id: userIdNum },
    {
      password: await argon2.hash(newPassword),
    }
  );

  await redis.del(key);

  // log in user after change password
  req.session!.userId = user.id;

  return { user }
 
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