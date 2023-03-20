
const {CollectionsService} = require("directus");
module.exports = class CollectionClass {

	constructor() {
		this.collectionSchema = {}
		this.collectionMeta = {
			icon: null,
			note: null,
			display_template: null,
			singleton: false,
			translations: null,
			archive_field: null,
			archive_app_filter: false,
			archive_value: null,
			unarchive_value: null,
			sort_field: null,
			accountability: "all",
			color: null,
			item_duplication_fields: null,
			sort: null,
			group: null,
		}
	}

	load(knex,schema){
		this.collectionsService = new CollectionsService({knex,schema})
		return this
	}


	genM2m(collection_left,collection_right,collections){
		let name = `${collection_left}_${collection_right}`
		name = this.nameCollection(name,collections)

		return {
			collection: name,
			meta: {
				"hidden": true,
				"icon": "import_export"
			},
			schema: {
				name
			},
			fields: [
				{
					collection: name,
					field: "id",
					type: "integer",
					schema: {
						is_primary_key: true,
						has_auto_increment: true
					},
					meta: {
						"hidden": true
					}
				}
			]
		}
	}


	nameCollection(collection,collections){
		let i=1
		let is_exist = collections.some(item => item.collection === collection)
		if(!is_exist){
			while(is_exist){
				collection = `${collection}_${i}`
				is_exist = collections.some(item => item.collection === collection)
				if(!is_exist) i++
			}
		}

		return collection
	}


	async readAll(){
		return this.collectionsService.readByQuery({limit: -1}).catch(e=>{
			console.log("Error readAll: ",e)
		})
	}

	async readMany(collections){
		return this.collectionsService.readMany(collections).catch(e=>{
			console.log("Error readMany: ",e)
		})
	}

	async createOne(data){
		return this.collectionsService.createOne(data).catch(e=>{
			console.log("Error createOne: ",e)
		})
	}

	async createMany(data){
		return this.collectionsService.createMany(data).catch(e=>{
			console.log("Error createMany: ",e)
		})
	}

	async delete(data){
		return this.collectionsService.deleteMany([...data]).catch(e=>{
			console.log("Error delete: ",e)
		})
	}


}