"use strict";

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use("Schema");

class EpisodesListSchema extends Schema {
  up() {
    this.create("episodes_lists", (table) => {
      table.increments();
      table.string("name");
      table.string("episode");
      table.string("episode_link");
      table.string("img_src");
      table.string("last_update");
      table.timestamps();
    });
  }

  down() {
    this.drop("episodes_lists");
  }
}

module.exports = EpisodesListSchema;
