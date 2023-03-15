const {RelationsService, CollectionsService} = require("directus");
const {getSchema} = require("directus/utils/get-schema");

const defaultMetaField = {
    "special": null,
    "interface": "input",
    "options": null,
    "display": null,
    "display_options": null,
    "width": "full",
    "translations": null
}
const defaultSchemaField = {
    "data_type": "string",
    "default_value": null,
    "max_length": null,
    "is_nullable": true,
    "is_primary_key": false,
    "has_auto_increment": false,
    "foreign_key_column": null,
    "foreign_key_table": null,
    "comment": null
}

const defaultMetaCollection = {
    "note": "",
    "display_template": "{{ id }}",
    "hidden": false,
    "singleton": false,
    "translations": [],
    "archive_field": "status",
    "archive_value": "archived",
    "unarchive_value": "draft",
    "archive_app_filter": true,
    "sort_field": "sort",
    "item_duplication_fields": null,
};

const relationGen = {
    schemaM2o(dataType, fkTable, fkField) {
        return {
            data_type: dataType,
            foreign_key_table: fkTable,
            foreign_key_column: fkField
        }
    },
    relationM2o(fkName, fkTable, fkField) {
        return {
            "related_collection": fkTable,
            "schema": {
                "constraint_name": fkName,
                "foreign_key_table": fkTable,
                "on_update": "NO ACTION",
                "on_delete": "SET NULL"
            },
            "meta": {
                "one_collection": fkTable,
                "one_collection_field": null,
                "one_allowed_collections": null,
                "junction_field": null,
                "sort_field": null,
                "one_deselect_action": "nullify"
            }
        }
    }
}

const fieldGen = {
    dateTimeField: (special) => {
        return {
            "type": "timestamp",
            "schema": {
                "data_type": "timestamp",
                "is_nullable": true,
                "generation_expression": null,
                "default_value": null,
                "is_generated": false,
                "max_length": null,
                "comment": null,
                "numeric_precision": null,
                "numeric_scale": null,
                "is_unique": false,
                "is_primary_key": false,
                "has_auto_increment": false,
                "foreign_key_schema": null,
                "foreign_key_table": null,
                "foreign_key_column": null
            },
            "meta": {
                "special": [
                    special
                ],
                "interface": 'datetime',
                "options": null,
                "display": "datetime",
                "display_options": null,
                "readonly": false,
                "hidden": false,
                "sort": null,
                "width": "full",
                "translations": null,
                "note": null,
                "conditions": null,
                "required": false,
                "group": null,
                "validation": null,
                "validation_message": null
            }
        }
    },
    normal(schema = {}, meta = {}) {
        return {
            schema: {
                ...defaultSchemaField,
                ...schema
            },
            meta: {
                ...defaultMetaField,
                ...meta
            },
        }
    },

    idPrimaryKey(dataType = 'uuid') {
        return fieldGen.normal({
            data_type: dataType,
            is_primary_key: true,
            has_auto_increment: dataType === 'integer',
        }, {
            hidden: true
        })
    },

    m2o(fkTable, fkField, fkName, meta = {}, schema = {}) {
        return {
            schema: {
                ...defaultSchemaField,
                ...relationGen.schemaM2o("uuid", fkTable, fkField),
                ...schema
            },
            meta: {
                interface: "select-dropdown-m2o",
                ...meta
            },
            relation: relationGen.relationM2o(fkName, fkTable, fkField)
        }
    },

    m2oUser(collection, fieldName, meta) {
        let field = this.normal({
            foreign_key_table: "directus_users",
            foreign_key_column: "id",
            data_type: 'uuid'
        }, {
            interface: "select-dropdown-m2o",
            options: {
                template: '{{avatar.$thumbnail}} {{first_name}} {{last_name}}'
            },
            ...meta
        });

        return {
            ...field,
            relation: relationGen.relationM2o(`${collection}_${fieldName}_fk`, 'directus_users', 'id'),
        }
    }
}

const migrateModel = async (knex, model) => {
    let schema = await getSchema({database: knex, bypassCache: true});

    const collectSer = new CollectionsService({
        knex: knex,
        schema
    });


    let fields = [];
    let relations = [];
    for (let field in model.fields) {

        fields.push({
            "collection": model.collection,
            "field": field,
            "type" : model.fields[field].schema.data_type ?? 'string',
            "meta": {
                ...defaultMetaField,
                ...model.fields[field].meta ?? {},
            },
            "schema": {
                ...defaultSchemaField,
                ...model.fields[field].schema ?? {}
            }
        });

        if (model.fields[field].relation) {
            let fr = model.fields[field].relation;
            relations.push({
                "collection": model.collection,
                "field": field,
                ...fr
            })
        }

    }

    let f = {
        collection: model.collection,
        schema: {
            name: model.collection
        },
        meta: {
            ...model.meta,
            defaultMetaCollection
        },
        fields
    }


    await collectSer.createOne(f).catch(e => { console.log(e) });

    if (relations.length > 0) {
        const relationsSer = new RelationsService({
            knex: knex,
            schema: await getSchema({database: knex, bypassCache: true})
        });

        for (ref of relations) {
            await relationsSer.createOne(ref).catch(e => { })
        }
    }
}

module.exports = {
    defaultMetaField,
    defaultSchemaField,
    defaultMetaCollection,
    relationGen,
    fieldGen,
    migrateModel
}
