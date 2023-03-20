/*
#1
POST /fields/test HTTP/1.1
Accept: application/json, text/plain,
Accept-Encoding: gzip, deflate
Accept-Language: en-US,en;q=0.9
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjMzYzUzYmE5LTllYjgtNDRjZS04MGRlLTFmZWFiY2FlYzUxZSIsInJvbGUiOiI2MDk5ZjVmMS0wMzVjLTRkZjgtODRlMi03YWVkMjA0NmQ1OWMiLCJhcHBfYWNjZXNzIjoxLCJhZG1pbl9hY2Nlc3MiOjEsImlhdCI6MTY3ODk4NjQ4MSwiZXhwIjoxNjgxNTc4NDgxLCJpc3MiOiJkaXJlY3R1cyJ9.AwHBK4GJyzryATu3NtoYxbDPxT8F6HBywk9B3F2sx4w
Cache-Control: no-store
Connection: keep-alive
Content-Length: 126
Content-Type: application/json
Cookie: SL_G_WPT_TO=vi; SL_GWPT_Show_Hide_tmp=1; SL_wptGlobTipTmp=1; directus_refresh_token=FW1a6Zqk_UZyMi5eRPtkce4Ts7sCBrlOkkce3VzMko_Ur4M-xROYQb9e84bsqrlw
Host: dev.local.com:62003
Origin: http://dev.local.com:62003
Referer: http://dev.local.com:62003/admin/settings/data-model/test/+
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36 Edg/111.0.1661.41
*/

let payload1 = {
	"field": "news",
	"type": "integer",
	"schema": {},
	"meta": {
		"interface": "select-dropdown-m2o",
		"special": [
			"m2o"
		]
	},
	"collection": "test"
}

let res1 = {
	"data": {
		"collection": "test" ,
		"field": "news" ,
		"type": "integer" ,
		"meta": {
			"id": 118 ,
			"collection": "test" ,
			"field": "news" ,
			"special": ["m2o"] ,
			"interface": "select-dropdown-m2o" ,
			"options": null ,
			"display": null ,
			"display_options": null ,
			"readonly": false ,
			"hidden": false ,
			"sort": null ,
			"width": "full" ,
			"translations": null ,
			"note": null ,
			"conditions": null ,
			"required": false ,
			"group": null ,
			"validation": null ,
			"validation_message": null
		} ,
		"schema": {
			"name": "news" ,
			"table": "test" ,
			"data_type": "int" ,
			"default_value": null ,
			"generation_expression": null ,
			"max_length": null ,
			"numeric_precision": 10 ,
			"numeric_scale": 0 ,
			"is_generated": false ,
			"is_nullable": true ,
			"is_unique": false ,
			"is_primary_key": false ,
			"has_auto_increment": false ,
			"foreign_key_column": null ,
			"foreign_key_table": null ,
			"comment": ""
		}
	}
}


/*POST /relations HTTP/1.1
Accept: application/json, text/plain,
Accept-Encoding: gzip, deflate
Accept-Language: en-US,en;q=0.9
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjMzYzUzYmE5LTllYjgtNDRjZS04MGRlLTFmZWFiY2FlYzUxZSIsInJvbGUiOiI2MDk5ZjVmMS0wMzVjLTRkZjgtODRlMi03YWVkMjA0NmQ1OWMiLCJhcHBfYWNjZXNzIjoxLCJhZG1pbl9hY2Nlc3MiOjEsImlhdCI6MTY3ODk4NjQ4MSwiZXhwIjoxNjgxNTc4NDgxLCJpc3MiOiJkaXJlY3R1cyJ9.AwHBK4GJyzryATu3NtoYxbDPxT8F6HBywk9B3F2sx4w
Cache-Control: no-store
Connection: keep-alive
Content-Length: 125
Content-Type: application/json
Cookie: SL_G_WPT_TO=vi; SL_GWPT_Show_Hide_tmp=1; SL_wptGlobTipTmp=1; directus_refresh_token=FW1a6Zqk_UZyMi5eRPtkce4Ts7sCBrlOkkce3VzMko_Ur4M-xROYQb9e84bsqrlw
Host: dev.local.com:62003
Origin: http://dev.local.com:62003
Referer: http://dev.local.com:62003/admin/settings/data-model/test/+
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36 Edg/111.0.1661.41
*/

let payload2 = {
	"collection": "test",
	"field": "news",
	"related_collection": "news",
	"meta": {
		"sort_field": null
	},
	"schema": {
		"on_delete": "SET NULL"
	}
}

let res2 = {
	"data": {
		"collection": "test" ,
		"field": "news" ,
		"related_collection": "news" ,
		"schema": {
			"table": "test" ,
			"column": "news" ,
			"foreign_key_table": "news" ,
			"foreign_key_column": "id" ,
			"constraint_name": "test_news_foreign" ,
			"on_update": "RESTRICT" ,
			"on_delete": "SET NULL"
		} ,
		"meta": {
			"id": 33 ,
			"many_collection": "test" ,
			"many_field": "news" ,
			"one_collection": "news" ,
			"one_field": null ,
			"one_collection_field": null ,
			"one_allowed_collections": null ,
			"junction_field": null ,
			"sort_field": null ,
			"one_deselect_action": "nullify"
		}
	}
}



