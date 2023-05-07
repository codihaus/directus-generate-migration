const CollectionClass = require("../lib/collection.class");
const FieldClass = require("../lib/field.class");
const RelationClass = require("../lib/relation.class");

const collectionsClass = new CollectionClass()
const fieldsClass = new FieldClass()
const relationsClass = new RelationClass()

const filterFieldsToCreate = (collections , data_directus,check = true) => {
	let fields_create = []
	//let fields_update = []
	for (let collection of collections) {
		try {
			//Check collection exist
			if (!!check && data_directus.collections.every(item => item.collection !== collection.collection)) {
				throw new Error(`Collection "${collection.collection}" does not exist. Please check again`)
			}

			//Check field of collection exist
			for (let field of collection.fields) {
				if (!!check && data_directus.fields.some(item => item.collection === collection.collection && item.field === field.field)) {
					console.log(`Error filterFieldsToCreate: Field "${field.field}" of collection "${field.collection}" is exist. Please check again`)
				} else fields_create.push(field)
			}

		} catch (e) {
			console.log("Error filterFieldsToCreate: " , e)
		}
	}

	return fields_create
}

const getUniqueArray = (arr) => {
	return arr.filter((item , index) => {
		return arr.indexOf(item) === index;
	});
}

const convertConfig = (data,directus_data) => {
	try {
		if (!!data && !Array.isArray(data)) throw Error("No data generate")

		//parse collections
		let collections = parseCollections(data)
		//console.log("collections: " , JSON.stringify(collections , null , 4))

		let data_directus = {
			fields_directus: directus_data?.fields ?? [],
			collections_directus: directus_data?.collections?? [],
			relations_directus: directus_data?.relations ?? []
		}

		return generateData(collections,data_directus)

	} catch (e) {
		console.log('[!]---[Error] ConvertConfig: ' , e)
	}
}

const parseCollections = (data) => {
	try {
		return data.map(item => {

			let output = {
				collection: item.collection.name ,
				fields: parseFields(item.collection.name , item.fields) ,
				meta: {
					...collectionsClass.collectionMeta ,
					...item.collection?.meta
				} ,

			}

			if (output.fields.length > 0) {
				output["schema"] = {
					...collectionsClass.collectionSchema
				}
			}
			return output

		})
	} catch (e) {
		console.log("Err parseCollections: " , e)
		return []
	}
}

const generateData = (collections_parse , directus_data) => {


	let	collections_directus =  directus_data?.collections_directus || []
	let	fields_directus =  directus_data?.fields_directus || []
	let	relations_directus =  directus_data?.relations_directus || []


	//data from directus
	let fields_primary_directus = fields_directus.filter(field => field.schema && field.schema.is_primary_key) || []

	//data from migrations
	let fields_primary = []

	let fields_related = []
	let fields_normal = []
	let relations_migration = []
	let relations_update = []
	let fields_update = []

	const pushField = (fields_primary , fields_normal , fields_related , fields , collection) => {
		for (let field of fields) {
			if (field.schema && field.collection === collection && field.schema.is_primary_key) {
				fields_primary.push(field)
			} else if (field.related_collection && fieldsClass.relatedText.includes(field.type)) {
				fields_related.push(field)
			} else {
				fields_normal.push(field)
			}
		}
	}


	const parseFieldsRelated = () => {
		try {
			for (let field of fields_related) {
				// if(field?.related_collection && field.related_collection.indexOf("directus_") === 0) {
				// 	field.related_collection = field.related_collection.replace("directus_","")
				// }

				switch (field.type) {
					case "$M2O$":
						let field_related = fields_primary.find(item => item.collection === field.related_collection) || fields_primary_directus.find(item => item.collection === field.related_collection)
						field.type = field_related.type || "integer" || "string"
						relations_migration.push(relationsClass.genM2o(field.collection , field.field , field.related_collection , field_related.field , field?.relations_options))
						if(field.field_o2m){
							if(field.field_o2m.create && field.field_o2m.field_name){
								fields_related.push({
									collection: field.related_collection,
									field: field.field_o2m.field_name,
									...fieldsClass.generateO2m(field.collection,field.field)
								})
							}
						}
						break;
					case  "$M2M$":
						field.type = "alias"
						//create collection temp

						// let collections_name= {
						// 	collection_left: field.collection ,
						// 	collection_right: field.field,
						// 	collection_temp: field.temp_collection
						// }

						let allCollections = [...collections_directus , ...collections_parse]
						if(allCollections.some(item => item.collection===field.temp_collection)){
							throw new Error(`[!]--[Error]: collection ${field.temp_collection} is exist`)
						}

						let collection_temp = collectionsClass.genCollectionTempM2M(field.temp_collection ,{
							meta: {
								group: field?.collection ?? null
							}
						})
						collections_parse.push(collection_temp)
						let field_primary_temp = {
							collection: collection_temp.collection ,
							field: "id" ,
							type: "integer" ,
							schema: {
								is_primary_key: true ,
								has_auto_increment: true
							} ,
							meta: {
								"hidden": true
							}
						}
						fields_related.push(field_primary_temp)
						fields_primary.push(field_primary_temp)
						//create field related
						let field_related_left = fields_primary.find(item => item.collection === field.collection) || fields_primary_directus.find(item => item.collection === field.collection)
						let field_related_right = fields_primary.find(item => item.collection === field.related_collection) || fields_primary_directus.find(item => item.collection === field.related_collection)


						let field_left_name =  `${field_related_left.collection}_${field_related_left.field}`
						let field_right_name = `${field_related_right.collection}_${field_related_right.field}` === `${field_related_left.collection}_${field_related_left.field}` ? `${field_related_right.collection}_related_${field_related_right.field}` :  `${field_related_right.collection}_${field_related_right.field}`

						let field_left = {
							collection: collection_temp.collection ,
							field: field_left_name ,
							...fieldsClass.generateM2o(field_related_left.collection , {
								meta: {
									hidden: true
								}
							} , {
								meta: {
									one_field: field.field ,
									junction_field: field_right_name
								} ,
								schema: {
									on_delete: "CASCADE"
								}
							})
						}
						let field_right = {
							collection: collection_temp.collection ,
							field: field_right_name,
							...fieldsClass.generateM2o(field_related_right.collection , {
								meta: {
									hidden: true
								}
							}  , {
								meta: {
									junction_field: field_left_name
								} ,
								schema: {
									on_delete: "CASCADE"
								}
							})
						}

						fields_related.push(field_left)
						fields_related.push(field_right)

						if (field.fields_extend) {
							let fields_extend = parseFields(collection_temp.collection , field.fields_extend)
							//console.log("collection_temp" , collection_temp.fields)
							pushField(fields_primary , fields_normal , fields_related , [...collection_temp.fields , ...fields_extend] , collection_temp.collection)
							parseFieldsRelated()
							//console.log("fields_extend" , fields_primary)
						}
						break;
					case "$O2M$":
						field.type = "alias"

						// //find field primary
						//let field_primary = fields_primary.find(item => item.collection === field.collection) ||
						// fields_primary_directus.find(item => item.collection === field.collection)
						// //push fields unique

						let fields_all = getUniqueArray([...fields_primary , ...fields_related , ...fields_normal , ...fields_directus].map(field => ({
							collection: field.collection ,
							field: field.field
						})))

						let fieldM2o = fields_all.find(ite=> ite.collection === field.collection && ite.field === field.field)
						if(!!fieldM2o){
							// find relation m2o from local + directus
							let relationM2oUpdate = relations_migration.find(ite =>
								ite.field === field.related_field &&
								ite.collection === field.related_collection &&
								ite.related_collection === field.collection
							) || relations_directus.find(ite =>
								ite.field === field.related_field &&
								ite.collection === field.related_collection &&
								ite.related_collection === field.collection
							) || false


							if(!!relationM2oUpdate){
								relations_update.push({
									...relationM2oUpdate,
									meta: {
										...relationM2oUpdate.meta,
										one_field: field.field
									}
								})

								if(collections_parse.every(ite => ite.collection !== field.collection)){
									fields_update.push(field)
								}
							}



						}

						// let name_many_field = fieldsClass.nameField(`${field.collection}_${field_primary.field}` , field.related_collection , fields_all)
						//
						// //create field m2o
						// fields_related.push({
						// 	collection: field.related_collection ,
						// 	field: field?.related_field || name_many_field ,
						// 	...fieldsClass.generateM2o(field.collection , {
						// 		meta: {
						// 			hidden: true
						// 		}
						// 	} , {
						// 		meta: {
						// 			one_field: field.field ,
						// 		}
						// 	})
						// })

						break;
				}
			}
		} catch (e) {
			console.log("Error parseFieldsRelated: " , e)
		}

	}

	function compareObjects(a , b) {
		// Xử lý các phần tử không có thuộc tính "fields" hoặc "schema"
		if (!a.fields && !a.schema) {
			return -1; // a lên đầu
		} else if (!b.fields && !b.schema) {
			return 1; // b lên đầu
		}

		// Xử lý các phần tử có thuộc tính "collection" là thuộc tính "group" của các phần tử còn lại
		if (a.meta?.group && b.collection === a.meta.group) {
			return 1;
		}
		if (b.meta?.group && a.collection === b.meta.group) {
			return -1;
		}

		// Xử lý các phần tử còn lại
		return 0; // không đổi vị trí
	}

	const pushFieldToCollection = (fields , collections) => {

		fields = getUniqueArray(fields)

		for (let collection of collections) {

			collection.fields = fields.filter(field => field.collection === collection.collection)
				.map(field => ({
					collection: field.collection ,
					field: field.field ,
					type: field.type ,
					meta: field.meta ,
					schema: field.schema
				}))
			collection.fields = getUniqueArray(collection.fields)

			if (collection.fields.length === 0) {
				delete collection.fields
				delete collection.schema
			}
		}
		collections.sort(compareObjects)
	}

	for (let item of collections_parse) {
		pushField(fields_primary , fields_normal , fields_related , item.fields , item.collection)
	}

	parseFieldsRelated()
	pushFieldToCollection([...fields_primary , ...fields_normal , ...fields_related] , collections_parse)


	return {
		collections: getUniqueArray(collections_parse) ,
		relations: getUniqueArray(relations_migration),
		update: {
			relations: getUniqueArray(relations_update),
			fields: getUniqueArray(fields_update),
		}
	}
}

const parseFields = (collection , fields) => {
	try {
		let output = []
		for (let field in fields) {

			let field_parse = {
				"collection": collection ,
				"field": field ,
				"type": fields[field].type ?? 'string' ,
				"meta": {
					...fieldsClass.fieldMeta ,
					...fields[field].meta ?? {} ,
				} ,
				related_collection: fields[field].related_collection ?? null
			}

			if (!!fields[field].schema) {
				field_parse["schema"] = {
					...fieldsClass.fieldSchema ,
					...(fields[field].schema ?? {})
				}
			}

			if (!!fields[field].fields_extend) {
				field_parse["fields_extend"] = {
					...(fields[field].fields_extend ?? {})
				}
			}

			if (!!fields[field].temp_collection) {
				field_parse["temp_collection"] = {
					...(fields[field].temp_collection ?? {})
				}
			}

			if (!!fields[field].related_field) {
				field_parse["related_field"] = fields[field].related_field
			}

			if (!!fields[field].field_o2m) {
				field_parse["field_o2m"] = fields[field].field_o2m
			}

			output.push(field_parse);
		}

		return output
	} catch (e) {
		console.log("Err parseFields: " , e)
		return []
	}
}


module.exports = {
	filterFieldsToCreate ,
	getUniqueArray ,
	convertConfig
}