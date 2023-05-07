
const {CollectionsService} = require("directus");
const {getSchema} = require("directus/utils/get-schema");
module.exports = class CollectionClass {

	constructor(knex) {
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
		this.knex = knex
		this.mode = ['up','down']
	}

	async load(knex){
		if(knex) this.knex = knex
		this.collectionsService = new CollectionsService({
			knex: this.knex,
			schema: await getSchema({database: this.knex , bypassCache: true})
		})
		return this
	}


	genM2m(collection_left,collection_right,collections,options){
		let name = `${collection_left}_${collection_right}`
		name = this.nameCollection(name,collections,options)

		return {
			collection: name,
			meta: {
				"hidden": true,
				"icon": "import_export",
				...(options?.meta || {})
			},
			schema: {
				name,
				...(options?.schema || {})
			},
			fields: []
		}
	}


	nameCollection(collection,collections,options){
		let i=1
		let is_exist = collections.some(item => item.collection === collection)

		let mode = this.mode.includes(options?.mode) ?  options?.mode: "up"
		if(mode === "up" && is_exist){
			while(is_exist){
				collection = `${collection}_${i}`
				is_exist = collections.some(item => item.collection === collection)
				if(!is_exist) i++
			}
		}

		return collection
	}


	async readAll(){
		return this.load().then(service => {
			return service.collectionsService.readByQuery({limit: -1})
		}).catch(e=>{
			console.log("Error readAll: ",e)
		})
	}

	async readMany(collections){
		return this.load().then(service => {
			return service.collectionsService.readMany(collections)
		}).catch(e=>{
			console.log("Error readMany: ",e)
		})
	}

	async createOne(data){
		return this.load().then(service => {
			return service.collectionsService.createOne(data)
		}).catch(e=>{
			console.log("Error createOne: ",e)
			console.log(JSON.stringify(data, null , 4))
		})
	}

	async createMany(data){
		return this.load().createMany(data).catch(e=>{
			console.log("Error createMany: ",e)
		})
	}

	async delete(collection){
		return this.load().then(service => {
			return service.collectionsService.deleteOne(collection)
		}).catch(e=>{
			console.log("Error delete: ",e)
		})
	}

	async createCollections(collections){
		for(let collection of collections){
			try {
				let data = await this.createOne(collection)
				console.log("Created collection: ",data)
			}catch(e){
				console.log("Error createCollections: ",e)
			}
		}
	}

	async deleteCollections(collections_data){
		let key = true
		let collections = []
		const updateKey = async (collections_data)=>{
			let data = await this.readAll()

			let collections_filter = data.filter(item=> item.collection.indexOf("directus_")!==0)

			if(collections_data){
				collections = collections_filter.filter(item => collections_data.map(ite => ite.collection).includes(item.collection)).map(item=> item.collection)
			}else{
				collections = collections_filter.map(item=> item.collection)
			}

			if(collections.length === 0 ) key = false
		}

		await updateKey(collections_data)

		while(collections.length > 0 && key){
			for(let item of collections){
				try{
					await this.delete(item)
					console.log("Deleted: ",item)

				}catch (e) {
					//console.log(e.message)
				}
				await updateKey(collections_data)
				if(!key) break
			}
		}
	}

}