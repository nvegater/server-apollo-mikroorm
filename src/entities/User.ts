import {Field, Int, ObjectType} from "type-graphql";
import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {Post} from "./Post";

@ObjectType()
@Entity()
export class User extends BaseEntity {

    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id!: number;

    @Field()
    @Column({unique: true})
    username!: string;

    @Field()
    @Column({unique: true})
    email!: string;

    // If I dont want to expose a field I can just comment out the field decorator
    // No field() annotation so no queriable by graphql
    @Column({unique: true})
    password!: string;

    // One user can create multiple posts.
    @OneToMany(() => Post, post => post.creator)
    post: Post[];

    @Field(() => String)
    @CreateDateColumn()
    createdAt: Date;

    @Field(() => String)
    @UpdateDateColumn()
    updatedAt: Date;

}