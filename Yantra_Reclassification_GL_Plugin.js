/**
 * @NApiVersion 2.x
 * @NScriptType CustomGLPlugin
 */

/**
 * Script Modification Log:
 *	Current Version: V4
 *	-- Version -- --ENV--		-- Date -- 			-- Modified By -- 			--Requested By-- 				-- Description --
 *		V1		  Trailing		16/09/2024			   Rutika More 					Geetanjli					Converted script from 1.0 to 2.0 and is an optimised and dynamic version.
 *      V1        Trailing      12/03/2025             Rutika More                  Joanne                      Bug Fix
 */
define(['N/config', 'N/search', 'N/log', 'N/runtime', 'N/format'],

    function (config, search, log, runtime, format) {

    function customizeGlImpact(context) {

        try {

            var transactionRecord = context.transactionRecord;
            var standardLines = context.standardLines;
            var customLines = context.customLines;
            var book = context.book;
            var bookId = book.id;

            log.debug('book', book);
            log.debug('bookId', bookId);
            log.debug('transactionRecord', transactionRecord);
            log.debug('standardLines', standardLines);

            var tranType = transactionRecord.recordType;
            var tranId = transactionRecord.id;
            log.debug('Transaction Type - ID', tranType + " - " + tranId);
            var tranTypeDetails = getRecType(tranType);
            var tranTypeId = tranTypeDetails.tranTypeId;
            //var lineType = tranTypeDetails.line;

            log.debug('tranTypeId', tranTypeId);
            var context = runtime.getCurrentScript();

            //Get all the Enable Features required for the validations
            var companyConfig = config.load({
                type: config.Type.COMPANY_PREFERENCES
            });
            
            var isLocationEnabled = runtime.isFeatureInEffect('locations');
            var allowPerLineLocations = runtime.isFeatureInEffect('locsperline');
            var isDepartmentEnabled = runtime.isFeatureInEffect('departments');
            var allowPerLineDepartments = runtime.isFeatureInEffect('deptsperline');
            var isClassEnabled = runtime.isFeatureInEffect('classes');
            var allowPerLineClasses = runtime.isFeatureInEffect('classesperline');
            var isMultiBookEnabled = runtime.isFeatureInEffect('multibook');

            // var isLocationEnabled = companyConfig.getValue('locations');
            // var allowPerLineLocations = companyConfig.getValue('locsperline');
            // var isDepartmentEnabled = companyConfig.getValue('departments');
            // var allowPerLineDepartments = companyConfig.getValue('deptsperline');
            // var isClassEnabled = companyConfig.getValue('classes');
            // var allowPerLineClasses = companyConfig.getValue('classesperline');
            // var isMultiBookEnabled = companyConfig.getValue('multibook');
            log.debug('isLocationEnabled - allowPerLineLocations - isDepartmentEnabled', isLocationEnabled + " - " + allowPerLineLocations + " - " + isDepartmentEnabled);
            log.debug('allowPerLineDepartments - isClassEnabled - allowPerLineClasses', allowPerLineDepartments + " - " + isClassEnabled + " - " + allowPerLineClasses);
            
            var recTypeId;

            //Get the current record object
            /*var loadRecord = record.load({
                type: tranType,
                id: tranId,
                isDynamic: true,
            });*/

            //, isLocationEnabled, allowPerLineLocations, isDepartmentEnabled, allowPerLineDepartments, isClassEnabled, allowPerLineClasses
            var reclassDetails = getReclassificationConfiguration(transactionRecord, tranTypeId, isMultiBookEnabled, bookId);
            log.debug('Reclassification Details == ' + reclassDetails.length, JSON.stringify(reclassDetails));
            
            if (reclassDetails.length > 0) {

                addGLLines(reclassDetails, standardLines, customLines);
                log.debug('addGLLines', 'addGLLines');

            } else {
                log.debug('NO GLIMPACT', 'RECLASSIFICATION NOT AVAILABLE ||' + reclassDetails.length);
            }
        } catch (error) {
            log.error('MAIN GL EXCEPTION', error);
        }
    }

    function getRecType(tranType) {

        var tranTypeId = 0;
        var line = '';

        switch (tranType) {

            case 'creditmemo':
                tranTypeId = 10;
                line = 'item';
                break;
            case 'invoice':
                tranTypeId = 7;
                line = 'item';
                break;
            case 'journalentry':
                tranTypeId = 1;
                line = 'line';
                break;
            case 'itemfulfillment':
                tranTypeId = 32;
                line = 'item';
                break;
            case 'vendorbill':
                tranTypeId = 17;
                line = 'item';
                break;
            case 'vendorcredit':
                tranTypeId = 20;
                line = 'item';
                break;
            default:
                tranTypeId = '';
                line = '';
                break;

        }

        return {tranTypeId:tranTypeId, line:line};

    }

    //, isLocationEnabled, allowPerLineLocations, isDepartmentEnabled, allowPerLineDepartments, isClassEnabled, allowPerLineClasses
    function getReclassificationConfiguration(transactionRecord, tranTypeId, isMultiBookEnabled, bookId) {

        try {

            log.debug('tranTypeId', tranTypeId);
            log.debug('isMultiBookEnabled', isMultiBookEnabled);
            log.debug('bookId', bookId);

            var subsidiaryId = transactionRecord.getValue('subsidiary')
            var getTranDate = transactionRecord.getValue('trandate');
            var dateObj = format.format({
                value: getTranDate,
                type: format.Type.DATE
            });

            log.debug('subsidiaryId', subsidiaryId);
            log.debug('dateObj', dateObj);

            var data = [];
            var loadSearch = search.load({
                id: "customsearch_rc_reclass_config_ss"
            });
            var getColumns = loadSearch.columns;

            if(isMultiBookEnabled && isMultiBookEnabled != undefined && isMultiBookEnabled != 'undefined') {

                loadSearch.filters.push(search.createFilter({
                    name: getColumns[1].name,
                    operator: search.Operator.ANYOF,
                    values: parseInt(bookId)
                }))

            }
            
            loadSearch.filters.push(search.createFilter({
                name: getColumns[2].name,
                operator: search.Operator.ANYOF,
                values: parseInt(subsidiaryId)
            }))

            loadSearch.filters.push(search.createFilter({
                name: getColumns[3].name,
                operator: search.Operator.ANYOF,
                values: parseInt(tranTypeId)
            }))

            loadSearch.filters.push(search.createFilter({
                name: getColumns[4].name,
                operator: search.Operator.ONORBEFORE,
                values: dateObj
            }))

            loadSearch.filters.push(search.createFilter({
                name: getColumns[5].name,
                operator: search.Operator.ONORAFTER,
                values: dateObj
            }))

            /*loadSearch.filters.push(search.createFilter({
                name: getColumns[6].name,
                operator: search.Operator.ANYOF,
                values: loadRecord.getValue('account')
            }))

            if(isLocationEnabled || allowPerLineLocations) {

                loadSearch.filters.push(search.createFilter({
                    name: getColumns[9].name,
                    operator: search.Operator.ANYOF,
                    values: loadRecord.getValue('location')
                }))

            }
            if(isDepartmentEnabled || allowPerLineDepartments) {

                loadSearch.filters.push(search.createFilter({
                    name: getColumns[12].name,
                    operator: search.Operator.ANYOF,
                    values: loadRecord.getValue('department')
                }))

            }
            if(isClassEnabled || allowPerLineClasses) {

                loadSearch.filters.push(search.createFilter({
                    name: getColumns[15].name,
                    operator: search.Operator.ANYOF,
                    values: loadRecord.getValue('class')
                }))

            }*/
            
            var searchResults = loadSearch.runPaged().count;
            if (searchResults > 0) {
                return loadSearch.run().getRange({
                    start: 0,
                    end: 1000
                })
            }
            else {
                return [];
            }
            
        } catch (error) {
            log.error('ERROR : IN GET RECLASSIFICATION CONFIGURATION', error);
            return [];
        }
    }

    function addGLLines(reclassDetails, standardLines, customLines, bookId) {

        try {

            log.debug('reclassDetails', reclassDetails);
            
            var fromAccount, toAccount, isLocationEnabled, fromLocation, toLocation, isDepartmentEnabled, fromDepartment, toDepartment, isClassEnabled, fromClass, toClass;
            var debitAmount, creditAmount, standardAccount, subsidiaryId, departmentId, classId, locationId, memo;

            // Add the rest of the addGLLines function logic as converted to SuiteScript 2.0 syntax...
            for(var a = 0; a < reclassDetails.length; a++) {

                var getCols = reclassDetails[a].columns;
                fromAccount = reclassDetails[a].getValue(getCols[6]);
                toAccount = reclassDetails[a].getValue(getCols[7]);
                isLocationEnabled = reclassDetails[a].getValue(getCols[8]);
                fromLocation = reclassDetails[a].getValue(getCols[9]);
                toLocation = reclassDetails[a].getValue(getCols[10]);
                isDepartmentEnabled = reclassDetails[a].getValue(getCols[11]);
                fromDepartment = reclassDetails[a].getValue(getCols[12]);
                toDepartment = reclassDetails[a].getValue(getCols[13]);
                isClassEnabled = reclassDetails[a].getValue(getCols[14]);
                fromClass = reclassDetails[a].getValue(getCols[15]);
                toClass = reclassDetails[a].getValue(getCols[16]);

                log.debug('Inside For loop custom record', 'Inside For loop custom record');
                log.debug('standardLines.count', standardLines.count);
                for (var i = 0; i < standardLines.count; i++){
                    
                    var currStandardLine = standardLines.getLine({index: i});
                    log.debug('currStandardLine', currStandardLine);

                    var entityId = currStandardLine.entityId;
                    log.debug('entityId', entityId);

                    debitAmount = currStandardLine.debitAmount;
				    creditAmount = currStandardLine.creditAmount;
				    standardAccount = currStandardLine.accountId;
				    subsidiaryId = currStandardLine.subsidiaryId;
				    departmentId = currStandardLine.departmentId;
				    classId = currStandardLine.classId;
				    locationId = currStandardLine.locationId;
				    memo = currStandardLine.memo;
                    
                    if(standardAccount == fromAccount) {

                        if(debitAmount != 0 && debitAmount != 'NaN') {

                            //Add Credit Amount = From Account, Location, Department and Class
                            var newLineCredit = customLines.addNewLine();
                            //newLineCredit.isBookSpecific = true;

                            newLineCredit.accountId = parseInt(fromAccount); 
                            newLineCredit.creditAmount = parseFloat(debitAmount);
                            if(isLocationEnabled && fromLocation != 'NaN')
                                newLineCredit.locationId = parseInt(fromLocation);
                            else
                                newLineCredit.locationId = parseInt(locationId);

                            if(entityId != null && entityId != 'null' && entityId != 'NaN' && entityId != '')
                                newLineCredit.entityId = parseInt(entityId);
                            
                            if(isDepartmentEnabled && fromDepartment != 'NaN')
                                newLineCredit.departmentId = parseInt(fromDepartment);
                            else
                                newLineCredit.departmentId = parseInt(departmentId);

                            if(isClassEnabled && fromClass != 'NaN')
                                newLineCredit.classId = parseInt(fromClass);
                            else
                                newLineCredit.classId = parseInt(classId);

                            if(memo)
                                newLineCredit.memo = memo;

                            //Add Debit Amount = To Account, Location, Department and Class
                            var newLineDebit = customLines.addNewLine();
                            //newLineDebit.isBookSpecific = true;
                            newLineDebit.accountId = parseInt(toAccount);
                            newLineDebit.debitAmount = parseFloat(debitAmount);
                            if(isLocationEnabled && toLocation != 'NaN')
                                newLineDebit.locationId = parseInt(toLocation);
                            else
                                newLineDebit.locationId = parseInt(locationId);

                            if(entityId != null && entityId != 'null' && entityId != 'NaN' && entityId != '')
                                newLineDebit.entityId = parseInt(entityId);

                            if(isDepartmentEnabled && toDepartment != 'NaN')
                                newLineDebit.departmentId = parseInt(toDepartment);
                            else
                                newLineDebit.departmentId = parseInt(departmentId);

                            if(isClassEnabled && toClass != 'NaN')
                                newLineDebit.classId = parseInt(toClass);
                            else
                                newLineDebit.classId = parseInt(classId);

                            if(memo)
                                newLineDebit.memo = memo;
                            
                        }
                        else if (creditAmount != 0 && creditAmount != 'NaN'){

                            //Add Credit Amount = To Account, Location, Department and Class
                            var newLineCredit = customLines.addNewLine();
                            //newLineCredit.isBookSpecific = true;
							newLineCredit.accountId = parseInt(toAccount); 
							newLineCredit.creditAmount = parseFloat(creditAmount);
							if(isLocationEnabled && toLocation != 'NaN')
                                newLineCredit.locationId = parseInt(toLocation);
                            else
                                newLineCredit.locationId = parseInt(locationId);

                            if(entityId != null && entityId != 'null' && entityId != 'NaN' && entityId != '')
                                newLineCredit.entityId = parseInt(entityId);

							if(isDepartmentEnabled && toDepartment != 'NaN')
                                newLineCredit.departmentId = parseInt(toDepartment);
                            else
                                newLineCredit.departmentId = parseInt(departmentId);

							if(isClassEnabled && toClass != 'NaN')
                                newLineCredit.classId = parseInt(toClass);
                            else
                                newLineCredit.classId = parseInt(classId);

							if(memo)
								newLineCredit.memo = memo;

                            //Add Debit Amount = From Account, Location, Department and Class
                            var newLineDebit = customLines.addNewLine();
                            //newLineCredit.isBookSpecific = true;
							newLineDebit.accountId = (parseInt(fromAccount));
							newLineDebit.debitAmount = parseFloat(creditAmount);
                            if(isLocationEnabled && fromLocation != 'NaN')
                                newLineDebit.locationId = parseInt(fromLocation);
                            else
                                newLineDebit.locationId = parseInt(locationId);

                            if(entityId != null && entityId != 'null' && entityId != 'NaN' && entityId != '')
                                newLineDebit.entityId = parseInt(entityId);

							if(isDepartmentEnabled && fromDepartment != 'NaN')
                                newLineDebit.departmentId = parseInt(fromDepartment);
                            else
                                newLineDebit.departmentId = parseInt(departmentId);

							if(isClassEnabled && fromClass != 'NaN')
                                newLineDebit.classId = parseInt(fromClass);
                            else
                                newLineDebit.classId = parseInt(classId);

							if(memo)
                                newLineDebit.memo = memo;
							
                        }
                        
                    }

                }

            }

            log.debug('addGLLines executed successfully');

        } catch (error) {

            log.error('ERROR : IN ADD GL LINES', error);

        }
    }

    return {
        customizeGlImpact: customizeGlImpact
    };
});
