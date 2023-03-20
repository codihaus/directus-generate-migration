const {RelationsService} = require("directus");
const {getSchema} = require("directus/utils/get-schema");
module.exports = class RelationClass {

	constructor(knex) {
		this.relationSchema = {
			//name: "category",
			//table: "news",
			//data_type: "int unsigned",
			default_value: null ,
			generation_expression: null ,
			max_length: null ,
			//numeric_precision: 10,
			//numeric_scale: 0,
			is_generated: false ,
			is_nullable: true ,
			is_unique: false ,
			is_primary_key: false ,
			has_auto_increment: false ,
			//foreign_key_column: "id",
			//foreign_key_table: "news_category",
			comment: ""
		}

		this.relationMeta = {
			//collection: "news",
			//field: "category",
			//special: ["m2o"],
			//interface: "select-dropdown-m2o",
			options: null ,
			display: null ,
			display_options: null ,
			readonly: false ,
			hidden: false ,
			sort: null ,
			width: "full" ,
			translations: null ,
			note: null ,
			conditions: null ,
			required: false ,
			group: null ,
			validation: null ,
			validation_message: null
		}
		this.knex = knex
	}

	async load(knex){
		if(knex) this.knex = knex
		this.relationsService = new RelationsService({
			knex: this.knex,
			schema: await getSchema({database: this.knex , bypassCache: true})
		})
		return this
	}

	genM2o(many_collection , field , related_collection , related_collection_primary,options) {
		return {
			collection: many_collection ,
			field ,
			related_collection ,
			schema: {
				"table": many_collection ,
				"column": field ,
				"foreign_key_table": related_collection ,
				"foreign_key_column": related_collection_primary ,
				"constraint_name": `${many_collection}_${field}_foreign` ,
				"on_update": "RESTRICT" ,
				"on_delete": "SET NULL",
				...options?.schema
			} ,
			meta: {
				many_collection ,
				"many_field": field ,
				"one_collection": related_collection ,
				"one_field": null ,
				"one_collection_field": null ,
				"one_allowed_collections": null ,
				"junction_field": null ,
				"sort_field": null ,
				"one_deselect_action": "nullify",
				...options?.meta
			}
		}
	}

	genM2m(collectionTemp, one_field, left, right, ) {
		return [
			{
				collection:  collectionTemp,
				field: right.field ,
				"related_collection": right.collection ,
				"meta": {
					"one_field": null ,
					"sort_field": null ,
					"one_deselect_action": "nullify" ,
					"junction_field": left.field
				} ,
				"schema": {
					on_update: "RESTRICT",
					on_delete: "CASCADE"
				}
			} ,
			{
				collection:  collectionTemp,
				"field": left.field ,
				"related_collection": left.collection ,
				"meta": {
					one_field,
					"sort_field": null ,
					"one_deselect_action": "nullify" ,
					"junction_field": right.field
				} ,
				"schema": {
					on_update: "RESTRICT",
					on_delete: "CASCADE"
				}
			}
		]
	}

	async createOne(data) {
		return this.load().then(service => {
			return service.relationsService.createOne(data)
		}).catch(e=>{
			console.log("Error createOne: ",e)
		})
	}

	async readAll(collection) {
		return this.load().then(service => {
			return service.relationsService.readAll(collection)
		}).catch(e => {
			console.log("Error readAll: " , e)
		})
	}

	async deleteOne(data) {
		return this.load().then(service => {
			return service.relationsService.deleteOne(data)
		}).catch(e => {
			console.log("Error deleteOne: " , e)
		})
	}


	async createRelations(relations){
		for(let relation of relations){
			try {
				let data = await this.createOne(relation)
				console.log(`Created relation: [${data.collection}] -> ${data.field} <- [${data.related_collection}]`)
			}catch(e){
				console.log("Error createRelations: ",e)
			}
		}
	}


}