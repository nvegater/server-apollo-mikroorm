import {Arg, Ctx, Int, Query, Resolver} from "type-graphql"
import {Post} from "../entities/Post";
import {MyContext} from "../types";

@Resolver()
export class PostResolver {
    @Query(()=>[Post]) //Duplication for Graphql: Post
    posts(
        @Ctx() ctx: MyContext
    ) : Promise<Post[] > { //Duplication for Typescript:  Post
        return ctx.em.find(Post, {});
    }

    @Query(()=>Post, {nullable:true})
    post(
        @Arg('id', ()=>Int) id:number,
        @Ctx() ctx: MyContext
    ) : Promise<Post | null> {
        return ctx.em.findOne(Post, {id});
    }
}