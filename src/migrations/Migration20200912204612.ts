import { Migration } from '@mikro-orm/migrations';

export class Migration20200912204612 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "user" rename column "name" to "username";');
  }

}
