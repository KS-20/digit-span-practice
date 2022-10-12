To export the schema, after changing the database execute command:

> mysqldump -u root -p --single-transaction -d -R  -r schema_structure_export.sql digit_span_practice_storage
