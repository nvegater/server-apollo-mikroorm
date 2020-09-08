import {Arg, Ctx, Int, Mutation, Query, Resolver} from "type-graphql"
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

    @Mutation(()=>Post)
    async createPost(
        @Arg('title', ()=>String) title:string,
        @Ctx() ctx: MyContext
    ) : Promise<Post> {
        const post = ctx.em.create(Post, {title})
        await ctx.em.persistAndFlush(post)
        return post;
    }

    @Mutation(()=>Post, {nullable: true})
    async updatePost(
        @Arg('id', ()=>Int) id:number,
        @Arg('title', ()=>String, {nullable:true}) title:string,
        @Ctx() ctx: MyContext
    ) : Promise<Post | null> {
        const post = await ctx.em.findOne(Post, {id})
        if (!post){
            return null
        }
        if (typeof title !== "undefined"){
            post.title = title;
            await ctx.em.persistAndFlush(post)
        }
        return post;
    }
}