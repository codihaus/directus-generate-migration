
const datetimeField = (special) =>{
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
}



module.exports = {datetimeField}