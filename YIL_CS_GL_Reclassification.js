/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/currentRecord'], function (currentRecord) {

    function pageInit(context) {
        var objRecord = context.currentRecord;

        // Disable Fields by Default
        disableFields(objRecord, 
            'custrecord_ch_rc_from_location', 
            'custrecord_ch_rc_to_location');

        disableFields(objRecord, 
            'custrecord_ch_rc_from_department', 
            'custrecord_ch_rc_to_department');

        disableFields(objRecord, 
            'custrecord_ch_rc_from_class', 
            'custrecord_ch_rc_to_class');
    }

    function fieldChanged(context) {
        var objRecord = context.currentRecord;
        var fieldId = context.fieldId;

        if (fieldId === 'custrecord_ch_rc_enable_location') {
            toggleFields(objRecord, fieldId, 'custrecord_ch_rc_from_location', 'custrecord_ch_rc_to_location', 'Location');
        } else if (fieldId === 'custrecord_ch_rc_enable_department') {
            toggleFields(objRecord, fieldId, 'custrecord_ch_rc_from_department', 'custrecord_ch_rc_to_department', 'Department');
        } else if (fieldId === 'custrecord_ch_rc_enable_class') {
            toggleFields(objRecord, fieldId, 'custrecord_ch_rc_from_class', 'custrecord_ch_rc_to_class', 'Class');
        }
    }

    function toggleFields(objRecord, checkFieldId, fromFieldId, toFieldId, entityType) {
        var isChecked = objRecord.getValue(checkFieldId);

        if (isChecked) {
            objRecord.getField({ fieldId: fromFieldId }).isDisabled = false;
            objRecord.getField({ fieldId: toFieldId }).isDisabled = false;
            alert("Since the feature is enabled, kindly set the From " + entityType + " and To " + entityType + " for smooth execution of the GL reclassification.");
        } else {
            objRecord.setValue({ fieldId: fromFieldId, value: '', ignoreFieldChange: true });
            objRecord.setValue({ fieldId: toFieldId, value: '', ignoreFieldChange: true });
            objRecord.getField({ fieldId: fromFieldId }).isDisabled = true;
            objRecord.getField({ fieldId: toFieldId }).isDisabled = true;
        }
    }

    function disableFields(objRecord, fromFieldId, toFieldId) {
        // Disable the specified fields
        objRecord.getField({ fieldId: fromFieldId }).isDisabled = true;
        objRecord.getField({ fieldId: toFieldId }).isDisabled = true;
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged
    };
});
