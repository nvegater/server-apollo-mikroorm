import { Migration } from '@mikro-orm/migrations';

export class Migration20200909155452 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table "user" ("id" serial primary key, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null, "name" text not null, "password" text not null);');
    this.addSql('alter table "user" add constraint "user_name_unique" unique ("name");');
  }

}
