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
				field_o2m: {
					create: options?.field_o2m?.create || false,
					field_name: options?.field_o2m?.field_name || false,
				},
				meta: options?.meta || {} ,
				schema: options?.schema || {}
			}) ,
			generateM2m: (related_collection , options , fields_extend) => this.fieldsClass.generateM2m(related_collection , {
				meta: options?.meta || {} ,
				schema: options?.schema || {}
			} , fields_extend) ,
			generateO2m: (related_collection,related_field ,options) => this.fieldsClass.generateO2m(related_collection, related_field, {
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
		let {collections , relations,update} = await this.getDataAndConvert(knex , config)

		return this.load(knex , config).then(async (service) => {
			return service.collectionsClass.createCollections(collections).then(async () => {
				await this.relationsClass.createRelations(relations)
				if(!!update){
					if(update.relations && update.relations.length>0){
						await this.relationsClass.updateRelations(update.relations)
					}

					if(update.fields && update.fields.length>0){
						await this.fieldsClass.createFields(update.fields)
					}
				}
			})
		}).catch(e => {
			console.log('Err upCreateKnex:' , e)
		})
	}

	async downCreateKnex(knex , config) {
		await this.setCheckForeignKey(false,knex)
		let {collections,update} = await this.getDataAndConvert(knex , config)
		return this.load(knex , config).then(async (service) => {
			return service.collectionsClass.deleteCollections(collections).then(
				async()=> {
					if(!!update){

						if(update.fields && update.fields.length>0){
							await this.fieldsClass.deleteFields(update.fields)
						}
					}
					await this.setCheckForeignKey(true , knex)
				}
			)
		}).catch(e => {
			console.log('Err downCreateKnex:' , e)
		})
	}

	async upUpdateKnex(knex , config) {
		let {collections , data_directus , relations, update} = await this.getDataAndConvert(knex , config)

		let fields_create = filterFieldsToCreate(collections , data_directus,false)

		let collectionsCreated = collections.filter(collection => !data_directus.collections.map(item => item.collection).includes(collection.collection))

		fields_create = fields_create.filter(item => !collectionsCreated.map(ite => ite.collection).includes(item.collection))

		console.log("collectionsUp: ",collectionsCreated)
		console.log("fieldsUp: ",fields_create)
		console.log("relationsUp: ",relations)
		// relations = relations.filter(item => [
		// 	...fields_create ,
		// 	//...fields_update
		// ].some(ite => ite.collection === item.collection && ite.field === item.field))

		return this.load(knex , config).then(async (service) => {
			return service.collectionsClass.createCollections(collectionsCreated).then(async () => {


				console.log("Relations: ",relations)

				if (!!fields_create.length) {
					await service.fieldsClass.createFields(fields_create)
				}
				// if(fields_update.length){
				// 	await service.fieldsClass.updateFields(fields_update)
				// }
				if (!!relations.length) {
					await service.relationsClass.createRelations(relations)
				}

				if(!!update){
					if(update.relations && update.relations.length>0){
						await this.relationsClass.updateRelations(update.relations)
					}
					if(update.fields && update.fields.length>0){
						await this.fieldsClass.createFields(update.fields)
					}
				}
			})

		}).catch(e => {
			console.log('Err upUpdateKnex:' , e)
		})
	}

	async downUpdateKnex(knex , config) {
		try{
			await this.setCheckForeignKey(false,knex)

			let {collections ,update, data_directus} = await this.getDataAndConvert(knex , config)
			let fields_create = filterFieldsToCreate(collections , data_directus,false)


			let collectionsName = fields_create.filter(item => item?.schema?.is_primary_key).map(item => item.collection)
			let collectionsDown = collections.filter(item => collectionsName.includes(item.collection))

			fields_create = fields_create.filter(item => !collectionsDown.map(ite => ite.collection).includes(item.collection))

			console.log("collectionsDown: ",collectionsDown)
			console.log("fieldsDown: ",fields_create)

			return this.load(knex , config).then(async (service) => {
				return service.collectionsClass.deleteCollections(collectionsDown).then(async ()=>{

					await service.fieldsClass.deleteFields(fields_create)

					if(!!update){
						if(update.fields && update.fields.length>0){
							await this.fieldsClass.deleteFields(update.fields)
						}
					}

					await this.setCheckForeignKey(true,knex)
				})


			})

		}catch (e){
			console.log("Err downUpdateKnex: ",e)
		}
	}

	async setCheckForeignKey(key,knex){
		return knex.raw(`SET FOREIGN_KEY_CHECKS = ${!!key ? 1 : 0};`).catch(e=>{
			console.log("Error setCheckForeignKey: ",e)
		})
	}


	async getDataAndConvert(knex , config) {
		let data_directus = await this.loadDataDirectus(knex)
		let {collections , relations, update} = convertConfig(config , data_directus)

		return {collections , relations ,update, data_directus}
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

