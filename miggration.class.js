const CollectionClass = require('./lib/collection.class')
const FieldClass = require('./lib/field.class')
const RelationClass = require('./lib/relation.class')

const {
	filterFieldsToCreate ,
	convertConfig
} = require('./utils/migration.utils')

module.exports = class MigrationClass {

	collections = []
	relations = []

	constructor() {

		this.collectionsClass = new CollectionClass()
		this.fieldsClass = new FieldClass()
		this.relationsClass = new RelationClass()

		this.generateField = {
			genSpecField: this.fieldsClass.fieldDefault,
			genPrimaryKey: (type = "integer",options) => this.fieldsClass.generatePrimaryKey(type,options) ,
			genNormal: (type="string" , options) => this.fieldsClass.generateNormal(type , options) ,
			genDatetime: (special) => this.fieldsClass.generateDateTime(special) ,
			generateM2o: (related_collection,options) => this.fieldsClass.generateM2o(related_collection,{
				meta: options?.meta || {} ,
				schema: options?.schema || {}
			}) ,
			generateM2m: (related_collection , options , fields_extend) => this.fieldsClass.generateM2m(related_collection , {
				meta: options?.meta || {} ,
				schema: options?.schema || {}
			} , fields_extend) ,
			generateO2m: (related_collection ,options) => this.fieldsClass.generateO2m(related_collection , {
				related_field: options?.related_field || "",
				meta: options?.meta || {} ,
				schema: options?.schema || {}
			}) ,
		}
	}

	async load(knex , data) {
		this.collectionsClass = await this.collectionsClass.load(knex)
		this.fieldsClass = await this.fieldsClass.load(knex)
		this.relationsClass = await this.relationsClass.load(knex)

		this.data = data

		return this
	}


	async upCreateKnex(knex , config) {
		let {collections , relations} = await this.getDataAndConvert(knex , config)

		return this.load(knex , config).then(async (service) => {
			return service.collectionsClass.createCollections(collections).then(async () => {
				return this.relationsClass.createRelations(relations)
			})
		}).catch(e => {
			console.log('Err upCreateKnex:' , e)
		})

	}

	async downCreateKnex(knex , config) {
		await knex.raw('SET FOREIGN_KEY_CHECKS = 0;')
		let {collections} = await this.getDataAndConvert(knex , config)
		return this.load(knex , config).then(async (service) => {
			return service.collectionsClass.deleteCollections(collections)
		}).catch(e => {
			console.log('Err downCreateKnex:' , e)
		})
		await knex.raw('SET FOREIGN_KEY_CHECKS = 1;')
	}

	async upUpdateKnex(knex , config) {
		let {collections , data_directus , relations} = await this.getDataAndConvert(knex , config)

		let fields_create = filterFieldsToCreate(collections , data_directus)

		relations = relations.filter(item => [
			...fields_create ,
			//...fields_update
		].some(ite => ite.collection === item.collection && ite.field === item.field))

		return this.load(knex , config).then(async (service) => {


			if (!!fields_create.length) {
				await service.fieldsClass.createFields(fields_create)
			}
			// if(fields_update.length){
			// 	await service.fieldsClass.updateFields(fields_update)
			// }
			if (!!relations.length) {
				await service.relationsClass.createRelations(relations)
			}
		}).catch(e => {
			console.log('Err upUpdateKnex:' , e)
		})
	}

	async downUpdateKnex(knex , config) {
		try{
			await knex.raw('SET FOREIGN_KEY_CHECKS = 0;')

			let {collections , data_directus} = await this.getDataAndConvert(knex , config)
			let fields_create = filterFieldsToCreate(collections , data_directus,false)

			return this.load(knex , config).then(async (service) => {
				await service.fieldsClass.deleteFields(fields_create)
			})

			await knex.raw('SET FOREIGN_KEY_CHECKS = 1;')
		}catch (e){
			console.log("Err downUpdateKnex: ",e)
		}
	}


	async getDataAndConvert(knex , config) {
		let data_directus = await this.loadDataDirectus(knex)
		let {collections , relations} = convertConfig(config , data_directus)

		return {collections , relations , data_directus}
	}

	async loadDataDirectus(knex) {
		return this.load(knex).then(migration => {
			return Promise.all([
				migration.collectionsClass.readAll() ,
				migration.fieldsClass.readAll() ,
				migration.relationsClass.readAll()
			]).then(data => {

				return {
					collections: data[0] ,
					fields: data[1] ,
					relations: data[2]
				}
			})
		}).catch(e => {
			console.log("Err getAll: " , e)
		})
	}

}

