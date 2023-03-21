## Config

- Migration file ```extensions/migrations/[indentity]-name.js```
```js
const {generateField,upCreateKnex,downCreateKnex} = require('directus-migration-tools')

const config = [
	{
		collection: {
			name: "product" ,
		} ,
		fields: {
			id: generateField.genPrimaryKey("uuid") ,
			name: generateField.genNormal()
		}
	} ,
	{
		collection: {
			name: "languages" ,
			meta: {
				group: "news_groups"
			}
		} ,
		fields: {
			code: generateField.genPrimaryKey("string") ,
			name: generateField.genNormal()
		}
	} ,
	{
		collection: {
			name: "news_groups" ,
			meta: {
				collection: "folder_settings" ,
				icon: "accessibility" ,
				note: "note string" ,
				///color: "#2ECDA7" ,
				translations: [
					{
						language: "en-US" ,
						translation: "Groups News"
					}
				]
			}
		}
	} ,
	{
		collection: {
			name: "tags" ,
			meta: {
				group: "news"
			}
		} ,
		fields: {
			id: generateField.genPrimaryKey() ,
			title: generateField.genNormal() ,
		}
	} ,
	{
		collection: {
			name: "news_category" ,
			meta: {
				group: "news"
			}
		} ,
		fields: {
			id: generateField.genPrimaryKey() ,
			title: generateField.genNormal() ,
		}
	} ,
	{
		collection: {
			name: "news" ,
			meta: {
				group: "news_groups"
			}
		} ,
		fields: {
			id: generateField.genPrimaryKey() ,
			title: generateField.genNormal() ,
			date_created: generateField.genDatetime("date-created") ,
			date_updated: generateField.genDatetime("date-updated") ,
			category: generateField.generateM2o("news_category") ,
			tags: generateField.generateM2m("tags") ,
			translations: generateField.generateM2m("languages" , {
				meta: {
					special: ["translations"] ,
					interface: "translations"
				}
			} , {
				title: generateField.genNormal() ,
				intro: generateField.genNormal() ,
				test: generateField.generateM2o("languages") ,
				field_m2o: generateField.generateM2o("tags") ,
				field_m2m: generateField.generateM2m("product")
			}) ,
		}
	}
]


module.exports = {
	async up(knex) {
		await upCreateKnex(knex,config)
	} ,
	async down(knex) {
		await downCreateKnex(knex,config)
	} ,
};
```
