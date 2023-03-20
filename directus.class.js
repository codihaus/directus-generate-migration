
const { Directus } = require('@directus/sdk')

const MigrationClass = require('./miggration.class')
module.exports = class DirectusClass extends MigrationClass{
	constructor(url , options) {
		super()
		this.directus = new Directus(url,options);
	}

	async createCollections(collections){
		for(let collection of collections){
			try {
				let data = await this.directus.collections.createOne(collection)
				console.log("Created collection: ",data.collection)
			}catch(e){
				console.log("Error createCollections: ",e)
			}
		}
	}

	async deleteCollections(collections_data){
		let key = true
		let collections = []
		const updateKey = async (collections_data)=>{
			let data = await this.directus.collections.readAll()

			let collections_filter = data.data.filter(item=> item.collection.indexOf("directus_")!==0)

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
					await this.directus.collections.deleteOne(item)
					console.log("Deleted: ",item)

				}catch (e) {
					//console.log(e.message)
				}
				await updateKey(collections_data)
				if(!key) break
			}
		}
	}

	async createRelations(relations){
		for(let relation of relations){
			try {
				let data = await this.directus.relations.createOne(relation)
				console.log(`Created relation: [${data.collection}] -> ${data.field} <- [${data.related_collection}]`)
			}catch(e){
				console.log("Error createRelations: ",e)
			}
		}
	}

	async createData(collections,relations){
		return this.createCollections(collections).then(async()=> this.createRelations(relations).catch(e=> {
			console.log("Error createData: ",e )
			})
		)
	}
}