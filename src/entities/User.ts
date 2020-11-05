import {Field, Int, ObjectType} from "type-graphql";
import {BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";

@ObjectType()
@Entity()
export class User extends BaseEntity{

    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id!: number;

    @Field(() => String)
    @CreateDateColumn()
    createdAt:Date;

    @Field(() => String)
    @UpdateDateColumn()
    updatedAt:Date;

    // If I dont want to expose a field I can just comment out the field decorator
    @Field()
    @Column({unique:true})
    username!: string;

    @Field()
    @Column({unique:true})
    email!: string;

    // No field() annotation so no queriable by graphql
    @Column({unique:true})
    password!: string;

}