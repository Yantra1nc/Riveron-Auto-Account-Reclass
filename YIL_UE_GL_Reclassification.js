/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/ui/serverWidget', 'N/runtime', 'N/log', 'N/search', 'N/format', 'N/error', 'N/ui/message'],

    function (record, serverWidget, runtime, log, search, format, error, message) {

    function beforeLoad(context) {
        log.debug({
            title: 'beforeLoad Triggered',
            details: 'Context Type: ' + context.type
        });

        if (context.type === context.UserEventType.CREATE ||
            context.type === context.UserEventType.EDIT || 
            context.type === context.UserEventType.COPY) {
            
            var form = context.form;
            var objRecord = context.newRecord;

            log.debug({
                title: 'Record Type and ID',
                details: 'Type: ' + objRecord.type + ', ID: ' + objRecord.id
            });

            // Check enabled features
            var locationFeature = runtime.isFeatureInEffect('locations');
            var departmentFeature = runtime.isFeatureInEffect('departments');
            var classFeature = runtime.isFeatureInEffect('classes');

            log.debug({
                title: 'Enabled Features',
                details: 'Locations: ' + locationFeature + ', Departments: ' + departmentFeature + ', Classes: ' + classFeature
            });

            // Enable or disable location fields
            var enableLocationField = form.getField('custrecord_ch_rc_enable_location');
            var fromLocationField = form.getField('custrecord_ch_rc_from_location');
            var toLocationField = form.getField('custrecord_ch_rc_to_location');

            if (locationFeature) {
                enableLocationField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.NORMAL });
                log.debug({ title: 'Location Feature Enabled', details: 'Location field set to NORMAL' });
            } else {
                enableLocationField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                fromLocationField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                toLocationField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                log.debug({ title: 'Location Feature Disabled', details: 'Location field set to DISABLED' });
            }

            // Enable or disable department fields
            var enableDepartmentField = form.getField('custrecord_ch_rc_enable_department');
            var fromDepartmentField = form.getField('custrecord_ch_rc_from_department');
            var toDepartmentField = form.getField('custrecord_ch_rc_to_department');

            if (departmentFeature) {
                enableDepartmentField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.NORMAL });
                log.debug({ title: 'Department Feature Enabled', details: 'Department field set to NORMAL' });
            } else {
                enableDepartmentField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                fromDepartmentField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                toDepartmentField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                log.debug({ title: 'Department Feature Disabled', details: 'Department field set to DISABLED' });
            }

            // Enable or disable class fields
            var enableClassField = form.getField('custrecord_ch_rc_enable_class');
            var fromClassField = form.getField('custrecord_ch_rc_from_class');
            var toClassField = form.getField('custrecord_ch_rc_to_class');

            if (classFeature) {
                enableClassField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.NORMAL });
                log.debug({ title: 'Class Feature Enabled', details: 'Class field set to NORMAL' });
            } else {
                enableClassField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                fromClassField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                toClassField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                log.debug({ title: 'Class Feature Disabled', details: 'Class fields set to DISABLED' });
            }
        }
    }

    function beforeSubmit(context) {
        log.debug({
            title: 'beforeSubmit Triggered',
            details: 'Context Type: ' + context.type
        });

        if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {
            
            var objRecord = context.newRecord;
            var internalId = objRecord.id;
            if(internalId > 0)
                internalId = parseInt(internalId);
            else
                internalId = parseInt(0);

            // Retrieve field values for validation
            var enableLocation = objRecord.getValue('custrecord_ch_rc_enable_location');
            var fromLocation = objRecord.getValue('custrecord_ch_rc_from_location');
            var toLocation = objRecord.getValue('custrecord_ch_rc_to_location');

            var enableDepartment = objRecord.getValue('custrecord_ch_rc_enable_department');
            var fromDepartment = objRecord.getValue('custrecord_ch_rc_from_department');
            var toDepartment = objRecord.getValue('custrecord_ch_rc_to_department');

            var enableClass = objRecord.getValue('custrecord_ch_rc_enable_class');
            var fromClass = objRecord.getValue('custrecord_ch_rc_from_class');
            var toClass = objRecord.getValue('custrecord_ch_rc_to_class');

            // Get and format date fields to M/d/yy format
            var fromDate = format.format({
                value: objRecord.getValue('custrecord_ch_rc_from_date'),
                type: format.Type.DATE
            });

            var toDate = format.format({
                value: objRecord.getValue('custrecord_ch_rc_to_date'),
                type: format.Type.DATE
            });

            // Log retrieved values
            log.debug({
                title: 'Field Values Retrieved',
                details: 'Enable Location: ' + enableLocation +
                         ', From Location: ' + fromLocation +
                         ', To Location: ' + toLocation +
                         ', Enable Department: ' + enableDepartment +
                         ', From Department: ' + fromDepartment +
                         ', To Department: ' + toDepartment +
                         ', Enable Class: ' + enableClass +
                         ', From Class: ' + fromClass +
                         ', To Class: ' + toClass +
                         ', From Date: ' + fromDate +
                         ', To Date: ' + toDate
            });

            // Check for duplicate records
            var customrecord_ch_reclassification_configSearchObj = search.create({
                type: "customrecord_ch_reclassification_config",
                filters: [
                    ["isinactive", "is", "F"], // Only active records
                    "AND",
                    ["custrecord_ch_rc_accounting_book", "anyof", objRecord.getValue('custrecord_ch_rc_accounting_book') || '@NONE@'],
                    "AND",
                    ["custrecord_ch_rc_subsidiary", "anyof", objRecord.getValue('custrecord_ch_rc_subsidiary') || '@NONE@'],
                    "AND",
                    ["custrecord_ch_rc_transaction_type", "anyof", objRecord.getValue('custrecord_ch_rc_transaction_type') || '@NONE@'],
                    "AND",
                    ["custrecord_ch_rc_from_date", "onorafter", fromDate],
                    "AND",
                    ["custrecord_ch_rc_to_date", "onorbefore", toDate],
                    "AND",
                    ["custrecord_ch_rc_reclass_from_account", "anyof", objRecord.getValue('custrecord_ch_rc_reclass_from_account') || '@NONE@'],
                    "AND",
                    ["custrecord_ch_rc_reclass_to_account", "anyof", objRecord.getValue('custrecord_ch_rc_reclass_to_account') || '@NONE@'],
                    "AND",
                    ["custrecord_ch_rc_enable_location", "is", enableLocation],
                    "AND",
                    ["custrecord_ch_rc_from_location", "anyof", fromLocation || '@NONE@'],
                    "AND",
                    ["custrecord_ch_rc_to_location", "anyof", toLocation || '@NONE@'],
                    "AND",
                    ["custrecord_ch_rc_enable_department", "is", enableDepartment],
                    "AND",
                    ["custrecord_ch_rc_from_department", "anyof", fromDepartment || '@NONE@'],
                    "AND",
                    ["custrecord_ch_rc_to_department", "anyof", toDepartment || '@NONE@'],
                    "AND",
                    ["custrecord_ch_rc_enable_class", "is", enableClass],
                    "AND",
                    ["custrecord_ch_rc_from_class", "anyof", fromClass || '@NONE@'],
                    "AND",
                    ["custrecord_ch_rc_to_class", "anyof", toClass || '@NONE@'],
                    "AND",
                    ["internalid", "noneof", internalId]
                ],
                columns: [
                    search.createColumn({ name: "internalid", label: "Internal ID" })
                ]
            });

            log.debug('filters', customrecord_ch_reclassification_configSearchObj.filters);
            var resultCount = customrecord_ch_reclassification_configSearchObj.runPaged().count;
            log.debug("Duplicate Check Result Count", resultCount);
            if (resultCount > 0) {

                /*message.create({
                    title: "DUPLICATION",
                    message: "There is already an existing setup for the same criteria.",
                    type: message.Type.WARNING
                });
                return true;*/
                throw error.create({
                    name: 'RECORD_DUPLICATION',
                    message: "There is already an existing setup for the same criteria.",
                    notifyOff: true
                });
            }

            // Validation logic for required fields
            if (enableLocation && (!fromLocation || !toLocation)) {
                /*message.create({
                    title: "DUPLICATION",
                    message: "Please enter the From and To fields as the feature is enabled for Location.",
                    type: message.Type.WARNING
                });
                return true;*/
                throw new Error("Please enter the From and To fields as the feature is enabled for Location.");
            }

            if (enableDepartment && (!fromDepartment || !toDepartment)) {

                /*message.create({
                    title: "DUPLICATION",
                    message: "Please enter the From and To fields as the feature is enabled for Department.",
                    type: message.Type.WARNING
                });
                return true;*/
                throw new Error("Please enter the From and To fields as the feature is enabled for Department.");
            }

            if (enableClass && (!fromClass || !toClass)) {

                /*message.create({
                    title: "DUPLICATION",
                    message: "Please enter the From and To fields as the feature is enabled for Class.",
                    type: message.Type.WARNING
                });
                return true;*/
                throw new Error("Please enter the From and To fields as the feature is enabled for Class.");
            }

            log.debug({ title: 'Validation Completed', details: 'All required fields are filled out correctly.' });
        }
    }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit
    };
});