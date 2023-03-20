const CollectionClass = require("../lib/collection.class");
const FieldClass = require("../lib/field.class");
const RelationClass = require("../lib/relation.class");

const collectionsClass = new CollectionClass()
const fieldsClass = new FieldClass()
const relationsClass = new RelationClass()

const filterFieldsToCreate = (collections,data_directus) => {
	let fields_create = []
	//let fields_update = []
	for (let collection of collections) {
		try {
			//Check collection exist
			if (data_directus.collections.every(item => item.collection !== collection.collection)) {
				throw new Error(`Collection "${collection.collection}" does not exist. Please check again`)
			}

			//Check field of collection exist
			for (let field of collection.fields) {
				if (data_directus.fields.find(item => item.collection === collection.collection && item.field === field.field)) {
					fields_create.push(field)
				} else {
					//fields_update.push(field)
					console.log(`Error upUpdateKnex: Field "${field.field}" of collection "${field.collection}" is exist. Please check again`)
				}
			}

		} catch (e) {
			console.log("Error upUpdateKnex: " , e)
		}
	}

	return fields_create
}

const getUniqueArray = (arr) => {
	return arr.filter((item , index) => {
		return arr.indexOf(item) === index;
	});
}

const convertConfig = (data)=> {
	try {
		if (!!data && !Array.isArray(data)) throw Error("No data generate")

		//parse collections
		let collections = parseCollections(data)
		//console.log("collections: " , JSON.stringify(collections , null , 4))

		return generateData(collections)

	} catch (e) {
		console.log('Error convertConfig: ' , e)
	}
}

const parseCollections = (data)=> {
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

const generateData=(collections_parse , collections_directus = [] , fields_directus = [])=> {

	//data from directus
	let fields_primary_directus = fields_directus.filter(field => field.schema && field.schema.is_primary_key) || []

	//data from migrations
	let fields_primary = []

	let fields_related = []
	let field_normal = []
	let relations_migration = []


	const pushField = (fields_primary , field_normal , fields_related , fields , collection) => {
		for (let field of fields) {
			if (field.schema && field.collection === collection && field.schema.is_primary_key) {
				fields_primary.push(field)
			} else if (field.related_collection && fieldsClass.relatedText.includes(field.type)) {
				fields_related.push(field)
			} else {
				field_normal.push(field)
			}
		}
	}


	const parseFieldsRelated = () => {
		for (let field of fields_related) {
			switch (field.type) {
				case "$M2O$":
					let field_related = fields_primary.find(item => item.collection === field.related_collection) || fields_primary_directus.find(item => item.collection === field.related_collection)
					field.type = field_related.type || "integer" || "string"
					relations_migration.push(relationsClass.genM2o(field.collection , field.field , field.related_collection , field_related.field , field?.relations_options))
					break;
				case  "$M2M$":
					field.type = "alias"
					//create collection temp
					let collection_temp = collectionsClass.genM2m(field.collection , field.field , [...collections_directus , ...collections_parse])
					collections_parse.push(collection_temp)
					fields_related.push({
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
					})
					//create field related
					let field_related_left = fields_primary.find(item => item.collection === field.collection) || fields_primary_directus.find(item => item.collection === field.collection)
					let field_related_right = fields_primary.find(item => item.collection === field.related_collection) || fields_primary_directus.find(item => item.collection === field.related_collection)

					let field_left = {
						collection: collection_temp.collection ,
						field: `${field_related_left.collection}_${field_related_left.field}` ,
						...fieldsClass.generateM2o(field_related_left.collection , {
							hidden: true
						} , {} , {
							meta: {
								one_field: field.field ,
								junction_field: `${field_related_right.collection}_${field_related_right.field}`
							} ,
							schema: {
								on_delete: "CASCADE"
							}
						})
					}
					let field_right = {
						collection: collection_temp.collection ,
						field: `${field_related_right.collection}_${field_related_right.field}` ,
						...fieldsClass.generateM2o(field_related_right.collection , {
							hidden: true
						} , {} , {
							meta: {
								junction_field: `${field_related_left.collection}_${field_related_left.field}`
							} ,
							schema: {
								on_delete: "CASCADE"
							}
						})
					}

					fields_related.push(field_left)
					fields_related.push(field_right)

					// relations_migration.push(...relationsClass.genM2m(collection_temp.collection , field.field , {
					// 	field: field_left.field ,
					// 	collection: field_left.collection
					// } , {
					// 	field: field_right.field ,
					// 	collection: field_right.collection
					// }))

					if (field.fields_extend) {
						let fields_extend = parseFields(collection_temp.collection , field.fields_extend)
						//console.log("collection_temp" , collection_temp.fields)
						pushField(fields_primary , field_normal , fields_related , [...collection_temp.fields , ...fields_extend] , collection_temp.collection)
						parseFieldsRelated()
						//console.log("fields_extend" , fields_primary)
					}
					break;
				case "$O2M$":

					break;
			}
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
		for (let collection of collections) {

			collection.fields = fields.filter(field => field.collection === collection.collection)
				.map(field => ({
					collection: field.collection ,
					field: field.field ,
					type: field.type ,
					meta: field.meta ,
					schema: field.schema
				}))

			if (collection.fields.length === 0) {
				delete collection.fields
				delete collection.schema
			}
		}
		collections.sort(compareObjects)
	}

	for (let item of collections_parse) {
		pushField(fields_primary , field_normal , fields_related , item.fields , item.collection)
	}

	parseFieldsRelated()


	//console.log("relations_migration",getUniqueArray(relations_migration))
	//console.log("fields_primary",fields_primary)
	//console.log("field_normal",field_normal)
	//console.log("fields_related",fields_related)
	//console.log("relations_migration",relations_migration)
	//console.log("collections_parse" , collections_parse)

	pushFieldToCollection([...fields_primary , ...field_normal , ...fields_related] , collections_parse)


	return {
		collections: getUniqueArray(collections_parse) ,
		relations: getUniqueArray(relations_migration)
	}
}

const parseFields=(collection , fields)=> {
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
			output.push(field_parse);
		}

		return output
	} catch (e) {
		console.log("Err parseFields: " , e)
		return []
	}
}



module.exports = {
	filterFieldsToCreate,
	getUniqueArray,
	convertConfig
}