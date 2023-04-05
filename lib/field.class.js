const {FieldsService} = require("directus");
const {datetimeField , fieldDefault} = require("../helper/field.schema");
const child_process = require("child_process");
const {getSchema} = require("directus/utils/get-schema");
module.exports = class FieldClass {

	constructor(knex) {
		this.fieldSchema = {
			//name: "content",
			//table: "news_translations",
			//data_type: "text",
			default_value: null ,
			generation_expression: null ,
			//max_length: 65535,
			numeric_precision: null ,
			numeric_scale: null ,
			is_generated: false ,
			is_nullable: true ,
			is_unique: false ,
			is_primary_key: false ,
			has_auto_increment: false ,
			foreign_key_column: null ,
			foreign_key_table: null ,
			comment: ""
		}
		this.fieldMeta = {
			//collection: "news_translations",
			//field: "content",
			special: null ,
			interface: "input" ,
			//options: { toolbar: ["undo", "redo", "bold", "italic", "underline", "strikethrough", "subscript",
			// "superscript", "fontselect", "fontsizeselect", "h1", "h2", "h3", "h4", "h5", "h6", "alignleft", "aligncenter", "alignright", "alignjustify", "alignnone", "indent", "outdent", "numlist", "bullist", "forecolor", "backcolor", "removeformat", "cut", "copy", "paste", "remove", "selectall", "blockquote", "customLink", "unlink", "customImage", "customMedia", "table", "hr", "code", "fullscreen", "visualaid", "ltr rtl"] },
			display: null ,
			display_options: null ,
			readonly: false ,
			hidden: false ,
			//sort: 7,
			width: "full" ,
			//translations: [{ language: "vi-VN", translation: "Nội dung" }],
			note: null ,
			conditions: null ,
			required: false ,
			group: null ,
			validation: null ,
			validation_message: null
		}

		this.relatedText = ["$M2M$" , "$M2O$" , "$O2M$"]
		this.fieldDefault = {
			sort: (options) => ({
				//"field": "sort" ,
				"type": "integer" ,
				"meta": {
					"interface": "input" ,
					"hidden": true ,
					...(options?.meta || {})
				} ,
				"schema": {
					...(options?.schema || {})
				}
			}) ,

			status: (options) => ({
				//"field": "status" ,
				"type": "string" ,
				"meta": {
					"width": "full" ,
					"options": {
						"choices": [
							{
								"text": "$t:published" ,
								"value": "published"
							} ,
							{
								"text": "$t:draft" ,
								"value": "draft"
							} ,
							{
								"text": "$t:archived" ,
								"value": "archived"
							}
						]
					} ,
					"interface": "select-dropdown" ,
					"display": "labels" ,
					"display_options": {
						"showAsDot": true ,
						"choices": [
							{
								"text": "$t:published" ,
								"value": "published" ,
								"foreground": "#FFFFFF" ,
								"background": "var(--primary)"
							} ,
							{
								"text": "$t:draft" ,
								"value": "draft" ,
								"foreground": "#18222F" ,
								"background": "#D3DAE4"
							} ,
							{
								"text": "$t:archived" ,
								"value": "archived" ,
								"foreground": "#FFFFFF" ,
								"background": "var(--warning)"
							}
						]
					} ,
					...(options?.meta || {})
				} ,
				"schema": {
					"is_nullable": false ,
					"default_value": "published" ,
					...(options?.schema || {})
				}
			}) ,

			userCreated: (options) => this.generateM2o("directus_users" , {
				meta: {
					"special": [
						"user-created"
					] ,
					"interface": "select-dropdown-m2o" ,
					"options": {
						"template": "{{avatar.$thumbnail}} {{first_name}} {{last_name}}"
					} ,
					"display": "user" ,
					"readonly": true ,
					"hidden": true ,
					"width": "half" ,
					...(options?.meta || {})
				} ,
				schema: {
					...(options?.schema || {})
				}
			}) ,

			userUpdated: (options) => this.generateM2o("directus_users" , {
				meta: {
					"special": [
						"user-updated"
					] ,
					"interface": "select-dropdown-m2o" ,
					"options": {
						"template": "{{avatar.$thumbnail}} {{first_name}} {{last_name}}"
					} ,
					"display": "user" ,
					"readonly": true ,
					"hidden": true ,
					"width": "half" ,
					...(options?.meta || {})
				} ,
				schema: {
					...(options?.schema || {})
				}
			}) ,

			dateCreated: (options) => ({
				//"field": "date_created" ,
				"type": "timestamp" ,
				"meta": {
					"special": [
						"date-created"
					] ,
					"interface": "datetime" ,
					"readonly": true ,
					"hidden": true ,
					"width": "half" ,
					"display": "datetime" ,
					"display_options": {
						"relative": true
					} ,
					...(options?.meta || {})
				} ,
				"schema": {
					...(options?.schema || {})
				}
			}) ,

			dateUpdated: (options) => ({
				//"field": "date_updated" ,
				"type": "timestamp" ,
				"meta": {
					"special": [
						"date-updated"
					] ,
					"interface": "datetime" ,
					"readonly": true ,
					"hidden": true ,
					"width": "half" ,
					"display": "datetime" ,
					"display_options": {
						"relative": true
					} ,
					...(options?.meta || {})
				} ,
				"schema": {
					...(options?.meta || {})
				}
			}) ,

			dateTime: (type, options) => this.generateNormal(type ?? "dateTime" , {
				meta: {
					interface: "datetime",
					...(options?.meta || {})
				} ,
				schema: {
					...(options?.schema || {})
				}
			}) ,

			repeater: (options) => this.generateNormal("json", {
				meta: {
					interface: "list",
					special: ["cast-json"],
					...(options?.meta || {})
				} ,
				schema: {
					...(options?.schema || {})
				}
			}) ,


			radioButton: (choices , options) => this.generateNormal("string" , {
				meta: {
					"interface": "select-radio" ,
					"options": {
						choices
						// "choices": [
						// 	{
						// 		"text": "default",
						// 		"value": "default"
						// 	}
						// ]
					} ,
					...(options?.meta || {})
				} ,
				schema: {
					default_value: (!!choices && Array.isArray(choices) && choices.length > 0) ? choices[0].value : null ,
					...(options?.schema || {})
				}
			}) ,

			code: (type,options) => this.generateNormal(type ?? "string" , {
				meta: {
					"interface": "input-code" ,
					...(options?.meta || {})
				} ,
				schema: {
					...(options?.schema || {})
				}
			}) ,

			image: (options) => this.generateM2o("directus_files" , {
				meta: {
					interface: "file-image" ,
					...(options?.meta || {})
				} ,
				schema: {
					...(options?.schema || {})
				}
			}) ,

			toggle: (options) => this.generateNormal("boolean" , {
				meta: {
					interface: "boolean" ,
					special: ["cast-boolean"] ,
					...(options?.meta || {})
				} ,
				schema: {
					...(options?.schema || {})
				}
			}) ,

			dropDown: (choices , options) => this.generateNormal("string" , {
				meta: {
					"interface": "select-dropdown" ,
					"options": {
						choices
					} ,
					...(options?.meta || {})
				} ,
				schema: {
					...(options?.schema || {})
				}
			}) ,

			checkBoxes: (choices , options) => this.generateNormal("json" , {
				meta: {
					"interface": "select-multiple-checkbox" ,
					"special": [
						"cast-json"
					] ,
					"options": {
						choices
					} ,
					...(options?.meta || {})
				} ,
				schema: {
					...(options?.schema || {})
				}
			}) ,

			slug: (template , options) => this.generateNormal("string" , {
				meta: {
					"interface": "extension-wpslug" ,
					"special": null ,
					"options": {
						"template": `{{${template}}` ,
						//"prefix": "{{name}}",
						"update": [
							"create" ,
							"update"
						]
					} ,
					...(options?.meta || {})
				} ,
				schema: {
					...(options?.schema || {})
				}
			}) ,

			file: (options) => this.generateM2o("directus_files" , {
				meta: {
					interface: "file-image" ,
					...(options?.meta || {})
				} ,
				schema: {
					...(options?.schema || {})
				}
			}) ,

			files: (options) => this.generateM2m("directus_files" , {
				meta: {
					interface: "files" ,
					special: ["files"] ,
					...(options?.meta || {})
				} ,
				schema: {
					...(options?.schema || {})
				}
			}) ,

			wysiwyg: (options) => this.generateNormal("text" , {
				meta: {
					interface: "input-rich-text-html" ,
					options: {
						"toolbar": [
							"undo" ,
							"redo" ,
							"bold" ,
							"italic" ,
							"underline" ,
							"strikethrough" ,
							"subscript" ,
							"superscript" ,
							"fontselect" ,
							"fontsizeselect" ,
							"h1" ,
							"h2" ,
							"h3" ,
							"h4" ,
							"h5" ,
							"h6" ,
							"alignleft" ,
							"aligncenter" ,
							"alignright" ,
							"alignjustify" ,
							"alignnone" ,
							"indent" ,
							"outdent" ,
							"numlist" ,
							"bullist" ,
							"forecolor" ,
							"backcolor" ,
							"removeformat" ,
							"cut" ,
							"copy" ,
							"paste" ,
							"remove" ,
							"selectall" ,
							"blockquote" ,
							"customLink" ,
							"unlink" ,
							"customImage" ,
							"customMedia" ,
							"table" ,
							"hr" ,
							"code" ,
							"fullscreen" ,
							"visualaid" ,
							"ltr rtl"
						]
					} ,
					...(options?.meta || {})
				} ,
				schema: {
					...(options?.schema || {})
				}
			}) ,

			textArea: (options) => this.generateNormal("text" , {
				meta: {
					interface: "input-multiline" ,
					...(options?.meta || {})
				} ,
				schema: {
					"data_type": "varchar" ,
					"max_length": 255 ,
					...(options?.schema || {})
				}
			}) ,



			translations: (collection_language, fields, options) => this.generateM2m(collection_language , {
				meta: {
					special: ["translations"] ,
					interface: "translations",
					... (options?.meta || {})
				},
				schema: {
					... (options?.schema || {})
				}
			}, fields)
		}

		this.knex = knex
	}

	async load(knex) {
		if (knex) this.knex = knex
		this.fieldsService = new FieldsService({
			knex: this.knex ,
			schema: await getSchema({database: this.knex , bypassCache: true})
		})
		return this
	}

	generateNormal(type = "string" , options) {
		return {
			type ,
			schema: {
				...this.fieldSchema ,
				...(options?.schema || {})
			} ,
			meta: {
				...this.fieldMeta ,
				...(options?.meta || {})
			} ,
		}
	}

	generatePrimaryKey(type = "integer" , options) {
		return this.generateNormal(type === 'uuid' ? "string" : type , {
			meta: {
				hidden: type !== "string" ,
				interface: "input",
				special: type === 'uuid' ? ['uuid'] : null ,
				...(options?.meta || {})
			} ,
			schema: {
				is_primary_key: true ,
				has_auto_increment: type === 'integer' ,
				...(options?.schema || {})
			}
		})
	}


	generateDateTime(special) {
		return datetimeField(special)
	}


	generateM2o(related_collection , options , relations_options) {
		return {
			type: "$M2O$" ,
			schema: {
				...(options?.schema || {})
			} ,
			meta: {
				"interface": "select-dropdown-m2o" ,
				"special": [
					"m2o"
				] ,
				...(options?.meta || {})
			} ,
			related_collection,
			field_o2m: options?.field_o2m || {},
			relations_options
		}
	}

	generateM2m(related_collection , options , fields_extend) {
		return {
			//type: "alias",
			type: "$M2M$" ,
			meta: {
				"interface": "list-m2m" ,
				"special": [
					"m2m"
				] ,
				...(options?.meta || {})
			} ,
			schema: {
				...(options?.schema || {})
			} ,
			fields_extend ,
			related_collection ,

		}
	}

	generateO2m(related_collection ,related_field, options) {
		return {
			//type: "alias",
			type: "$O2M$" ,
			meta: {
				"interface": "list-o2m" ,
				"special": [
					"o2m"
				] ,
				...(options?.meta || {})
			} ,
			schema: {
				...(options?.schema || {})
			} ,
			related_field,
			related_collection ,

		}
	}

	findFieldPrimaryKey(collection , fields) {
		return fields.find(field => field.schema && field.collection === collection && field.schema.is_primary_key)
	}

	filterFieldRelated(fields) {
		return fields.filter(field => field.related_collection && this.relatedText.includes(field.type))
	}


	async readAll(collection) {
		return this.load().then(service => {
			return service.fieldsService.readAll(collection)
		}).catch(e => {
			console.log("Error readAll: " , e)
		})
	}

	async createOne(data) {
		return this.load().then(async (service) => {
			await service.fieldsService.createField(data.collection,data)
			console.log(`Created field: ${data.field} [${data.collection}]`)
		}).catch(e => {
			console.log("Error createField: " , e)
		})
	}

	async updateOne(data) {
		return this.load().then(service => {
			return service.fieldsService.updateField(data.collection , data)
		}).catch(e => {
			console.log("Error createField: " , e)
		})
	}

	nameField(field_name , collection , fields) {
		let i = 1
		let is_exist = fields.some(item => item.collection === collection && item.field === field_name)
		if (!is_exist) {
			while (is_exist) {
				field_name = `${field_name}_${i}`
				is_exist = fields.some(item => item.collection === collection && item.field === field_name)
				if (!is_exist) i++
			}
		}

		return field_name
	}


	async createFields(fields) {
		for (let field of fields) {
			try {
				let data = await this.createOne(field)
				//console.log(`Created field "${data.field}" of collection "${data.collection}"`)
			} catch (e) {
				console.log("Error createFields: " , e)
			}
		}
	}

	async updateFields(fields) {
		for (let field of fields) {
			try {
				let data = await this.updateOne(field)
				console.log(`Updated field: ` , data)
			} catch (e) {
				console.log("Error updateFields: " , e)
			}
		}
	}

	async deleteField(field) {
		return this.load().then(service => {
			return service.fieldsService.deleteField(field.collection , field.field)
		}).catch(e => {
			console.log("Error deleteField: " , e)
		})
	}

	async deleteFields(fields) {
		for (let field of fields) {
			try {
				await this.deleteField(field)
				//console.log(`Deleted field "${field.field}" of collection "${field.collection}"`)
				console.log(`Deleted field:` , field)
			} catch (e) {
				console.log("Error deleteFields: " , e)
			}
		}
	}


}