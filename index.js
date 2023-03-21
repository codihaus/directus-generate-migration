const {
	defaultMetaField,
	defaultSchemaField,
	defaultMetaCollection,
	relationGen,
	fieldGen,
	migrateModel
} = require('./lib/migration_v1')


const MigrationClass = require('./miggration.class')

const migrationClass = new MigrationClass()

module.exports = {
	//####
	defaultMetaField,
	defaultSchemaField,
	defaultMetaCollection,
	relationGen,
	fieldGen,
	migrateModel,

	//
	generateField: migrationClass.generateField,
	upCreateKnex: async (knex,config)  => migrationClass.upCreateKnex(knex,config),
	downCreateKnex: async(knex,config) => migrationClass.downCreateKnex(knex,config),
	upUpdateKnex: async(knex,config)=> migrationClass.upUpdateKnex(knex,config),
	downUpdateKnex: async(knex,config) => migrationClass.downUpdateKnex(knex,config)
}