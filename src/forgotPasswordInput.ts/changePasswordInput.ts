import { Field, InputType } from "type-graphql";


@InputType()
export class changePasswordInput{
    @Field()
    password:string;

    @Field()
    token: string
}