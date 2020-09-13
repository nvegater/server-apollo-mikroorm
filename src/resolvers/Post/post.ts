import {Arg, Ctx, Int, Mutation, Query, Resolver} from "type-graphql"
import {Post} from "../../entities/Post";
import {ApolloORMContext} from "../../types";

@Resolver()
export class PostResolver {
    @Query(()=>[Post]) //Duplication for Graphql: Post
    posts(
        @Ctx() ctx: ApolloORMContext
    ) : Promise<Post[] > { //Duplication for Typescript:  Post
        return ctx.postgres_mikroORM_EM.find(Post, {});
    }

    @Query(()=>Post, {nullable:true})
    post(
        @Arg('id', ()=>Int) id:number,
        @Ctx() ctx: ApolloORMContext
    ) : Promise<Post | null> {
        return ctx.postgres_mikroORM_EM.findOne(Post, {id});
    }

    @Mutation(()=>Post)
    async createPost(
        @Arg('title', ()=>String) title:string,
        @Ctx() ctx: ApolloORMContext
    ) : Promise<Post> {
        const post = ctx.postgres_mikroORM_EM.create(Post, {title})
        await ctx.postgres_mikroORM_EM.persistAndFlush(post)
        return post;
    }

    @Mutation(()=>Post, {nullable: true})
    async updatePost(
        @Arg('id', ()=>Int) id:number,
        @Arg('title', ()=>String, {nullable:true}) title:string,
        @Ctx() ctx: ApolloORMContext
    ) : Promise<Post | null> {
        const post = await ctx.postgres_mikroORM_EM.findOne(Post, {id})
        if (!post){
            return null
        }
        if (typeof title !== "undefined"){
            post.title = title;
            await ctx.postgres_mikroORM_EM.persistAndFlush(post)
        }
        return post;
    }

    @Mutation(()=>Boolean)
    async deletePost(
        @Arg('id', () => Int) id:number,
        @Ctx() ctx: ApolloORMContext
    ) : Promise<boolean> {
        await ctx.postgres_mikroORM_EM.nativeDelete(Post, {id})
        return true;
    }
}