import {Arg, Ctx, Int, Mutation, Query, Resolver, UseMiddleware} from "type-graphql"
import {Post} from "../../entities/Post";
import {CreatePostInputs, validateCreatePostInputs} from "./postResolversInputs";
import {FieldError} from "../User/userResolversOutputs";
import {ApolloRedisContext} from "../../apollo-config";
import {PostResponse} from "./postResolversOutputs";
import {isAuth} from "../Universal/utils";

@Resolver()
export class PostResolver {
    @Query(() => [Post])
    posts(): Promise<Post[]> {
        return Post.find();
    }

    @Query(() => Post, {nullable: true})
    post(
        @Arg('id', () => Int) id: number,
    ): Promise<Post | undefined> {
        return Post.findOne(id);
    }

    @Mutation(() => PostResponse)
    @UseMiddleware(isAuth)
    async createPost(
        @Arg('options') createPostInputs: CreatePostInputs,
        @Ctx() {req}: ApolloRedisContext
    ): Promise<PostResponse> {
        const inputErrors: FieldError[] = validateCreatePostInputs(createPostInputs);
        if (inputErrors.length > 0) {
            return {errors: inputErrors}
        }
        const postPromise = await Post
            .create({
                ...createPostInputs,
                creatorId: parseInt(req.session!.userId),
            }).save();
        return {post: postPromise};
    }

    @Mutation(() => Post, {nullable: true})
    async updatePost(
        @Arg('id', () => Int) id: number,
        @Arg('title', () => String, {nullable: true}) title: string,
    ): Promise<Post | null> {
        const post = await Post.findOne(id) // or {where:id}
        if (!post) {
            return null
        }
        if (typeof title !== "undefined") {
            await Post.update({id}, {title})
        }
        return post;
    }

    @Mutation(() => Boolean)
    async deletePost(
        @Arg('id', () => Int) id: number,
    ): Promise<boolean> {
        await Post.delete(id)
        return true;
    }
}