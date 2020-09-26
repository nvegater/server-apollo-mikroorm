import { Migration } from '@mikro-orm/migrations';

export class Migration20200926110857 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "user" drop constraint "user_name_unique";');
  }

}
