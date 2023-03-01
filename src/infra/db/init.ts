import { Knex } from 'knex'

const schema = process.env.DB_SCHEMA || 'bundledao'
const tables = [
  {
    name: 'derived_keys',
    build: (table: Knex.CreateTableBuilder) => {
      table.increments('id').primary()
    }
  },
  {
    name: 'bundle_uploads',
    build: (table: Knex.CreateTableBuilder) => {
      table.string('id', 64).notNullable().primary()
    }
  }
]

export async function up(knex: Knex) {
  for (let i = 0; i < tables.length; i++) {
    const tableName = tables[i].name
    const exists = await knex.schema.hasTable(tableName)
    if (!exists) {
      await knex.schema.createTable(
        tableName,
        tables[i].build
      )

      const tableWasCreated = await knex.schema.hasTable(tableName)

      if (!tableWasCreated) {
        throw new Error(`${schema}.${tableName} was not created!`)
      }
    } else {
      throw new Error(`${schema}.${tableName} already exists!`)
    }
  }
}

export async function down(knex: Knex) {
  for (let i = 0; i < tables.length; i++) {
    const tableName = tables[i].name
    await knex.schema.dropTableIfExists(tableName)
  }
}
