## Config

- Migration file ```extensions/migrations/[indentity]-name.js```
```js
const {CollectionsService} = require('directus');
const {
    relationGen,
    fieldGen,
    defaultSchemaField,
    migrateModel
} = require("directus-migration-tools");

const collectionConfig = {
    collection: "COLLECTION_NAME",
    meta: {
        group: "GROUP"
    },
    fields: {
        id: fieldGen.idPrimaryKey('uuid'),
        user_created: fieldGen.m2oUser("COLLECTION_NAME", "user_created", {hidden: true}),
        user_updated: fieldGen.m2oUser("COLLECTION_NAME", "user_updated", {hidden: true}),
        date_created: fieldGen.dateTimeField,
        date_updated: fieldGen.dateTimeField,

        RElATION_FIELD: {
            schema: {
                ...defaultSchemaField,
                ...relationGen.schemaM2o("uuid", 'RELATION_TARGET_MODEL', 'RELATION_TARGET_FIELD')
            },
            meta: {
                hidden: true
            },
            relation: relationGen.relationM2o("COLLECTION_NAME_FIELD_fk", 'RELATION_TARGET_MODEL', 'RELATION_TARGET_FIELD')
        },

        first_name: fieldGen.normal({}, {"width": "half"}),
        last_name: fieldGen.normal({}, {"width": "half"}),
        email: fieldGen.normal({}, {}),

        dropdown_field: fieldGen.normal({}, {
            width: "half",
            interface: "select-dropdown",
            options: {
                choices: [
                    {text: "Option 1", value: "opt2"},
                    {text: "Option 2", value: "opt1"}
                ]
            }
        })
    }
}


module.exports = {
    async up(knexCnn) {
        await migrateModel(knexCnn, collectionConfig)
    },

    async down(knexCnn) {
        const collectSer = new CollectionsService({
            knex: knexCnn,
            schema: await getSchema({database: knexCnn, bypassCache: true})
        });

        await collectSer.deleteOne(collectionConfig).catch(e => {
            console.log(e)
        });
    }
};
```
