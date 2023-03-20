const MiggrationClass = require('../miggration.class')


let migration = new MiggrationClass()

let genField = migration.generateField
const config = [
	// {
	// 	collection: {
	// 		name: "product" ,
	// 	} ,
	// 	fields: {
	// 		id: genField.genPrimaryKey("uuid") ,
	// 		name: genField.genNormal()
	// 	}
	// } ,
	// {
	// 	collection: {
	// 		name: "languages" ,
	// 		meta: {
	// 			group: "news_groups"
	// 		}
	// 	} ,
	// 	fields: {
	// 		code: genField.genPrimaryKey("string") ,
	// 		name: genField.genNormal()
	// 	}
	// } ,
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
			id: genField.genPrimaryKey() ,
			title: genField.genNormal() ,
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
			id: genField.genPrimaryKey() ,
			title: genField.genNormal() ,
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
			id: genField.genPrimaryKey() ,
			title: genField.genNormal() ,
			date_created: genField.genDatetime("date-created") ,
			date_updated: genField.genDatetime("date-updated") ,
			category: genField.generateM2o("news_category") ,
			tags: genField.generateM2m("tags") ,
			// translations: genField.generateM2m("languages" , {
			// 	meta: {
			// 		special: ["translations"] ,
			// 		interface: "translations"
			// 	}
			// } , {
			// 	title: genField.genNormal() ,
			// 	intro: genField.genNormal() ,
			// 	test: genField.generateM2o("languages") ,
			// 	field_m2o: genField.generateM2o("tags") ,
			// 	field_m2m: genField.generateM2m("news_category")
			// }) ,
		}
	}
]


module.exports = {
	async up(knex) {
		await migration.upKnex(knex,config)
		//migration.generate()
	} ,
	async down(knex) {
		await migration.downKnex(knex,config)
		//migration.generate()
	} ,
};