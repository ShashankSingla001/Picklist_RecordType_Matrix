import { LightningElement, api, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getPicklistValues, getObjectInfo } from 'lightning/uiObjectInfoApi';
import fetchObjs from '@salesforce/apex/OrgObjectsCtrl.fetchObjects';


export default class Picklist_RecordTypeMapper extends LightningElement {
    // Page context
    @api recordId;
    @api fieldStruct;
    objectApiName;
    objectApiNameTemp;
    recordTypeId;
    qualifiedFieldName;
    countIndex = -1;
    rTypes;
    showSpinner = false;
    picklistFields;
    mappingJson = {};
    objectsAvailable;
    includeLabels;
    selectedRTypes = [];

    connectedCallback() {
        this.fetchObjs();
    }
    handleChange(e) {
        if (e.target.type == 'checkbox') {
            this.includeLabels = e.target.checked;
        }
    }
    fetchObjs() {
        this.showSpinner = true;
        fetchObjs()
            .then((result) => {
                let objectsAvailable = [];
                result.forEach(val => {
                    objectsAvailable.push({ 'label': val.SobjectType, 'value': val.SobjectType });
                });
                this.objectsAvailable = objectsAvailable;
                this.showSpinner = false;
            })
            .catch((error) => {
                this.showToast(`Failed to retrieve object info. ${this.reduceErrors(error)}`);
                this.showSpinner = false;
            });
    }
    // Extract object information including default record type id
    @wire(getObjectInfo, { objectApiName: '$objectApiName' })
    getObjectInfo({ error, data }) {
        if (data) {
            this.showSpinner = true;
            let response = JSON.parse(JSON.stringify(data));
            if (response.fields) {
                let picklistFields = [];
                Object.keys(response.fields).forEach(field => {
                    if (['Picklist', 'MultiPicklist'].includes(response.fields[field].dataType)) {
                        picklistFields.push({ 'label': (response.fields[field].label + ' ( ' + response.fields[field].apiName + ' ) '), 'value': response.fields[field].apiName })
                    }
                });
                this.picklistFields = picklistFields;
            }
            if (response.recordTypeInfos) {
                let rTypes = [];
                Object.keys(response.recordTypeInfos).forEach(key => {
                    this.countIndex = 0;
                    rTypes.push({
                        'value': key, 'label': (response.recordTypeInfos[key].master ? 'Master' : response.recordTypeInfos[key].name), 'selected': true
                    });
                });
                this.rTypes = rTypes;
                this.selectedRTypes = rTypes;

                if (this.rTypes) {
                    this.recordTypeId = (this.rTypes[0] || {}).value;
                }
            }
            this.showSpinner = false;
        } else if (error) {
            this.showSpinner = false;
            this.showToast(`Failed to retrieve object info. ${this.reduceErrors(error)}`);
        }
    }
    copyDay() {
        const el = document.createElement('textarea');
        el.value = this.stringifiedJson;
        el.setAttribute('readonly', '');
        el.style.position = 'absolute';
        el.style.left = '-9999px';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        // eslint-disable-next-line @lwc/lwc/no-async-operation
    };
    // Extract picklist values
    @wire(getPicklistValues, {
        recordTypeId: '$recordTypeId',
        fieldApiName: '$fieldStruct'
    })
    getPicklistValues({ error, data }) {
        if (data) {
            this.showSpinner = true;
            let mappings = data.values.map(plValue => {
                return {
                    label: plValue.label,
                    value: plValue.value
                };
            });
            let key = ((this.rTypes || [])[this.countIndex] || {}).label;
            this.mappingJson[key] = mappings;
            if (this.rTypes && this.rTypes.length > 0 && this.countIndex < this.rTypes.length - 1) {
                this.countIndex++;
                this.recordTypeId = this.rTypes[this.countIndex].value;
            } else {
                this.showSpinner = false;
            }
        } else if (error) {
            this.showSpinner = false;
            this.showToast(`Failed to retrieve picklist values. ${this.reduceErrors(error)}`);
        }
    }
    get checkdiff() {
        return !this.objectApiName;
    }
    
    get stringifiedJson() {
        let mappingJson = {};
        if (this.selectedRTypes) {
            this.selectedRTypes.forEach(rType => {
                if (this.mappingJson[rType.label])
                    mappingJson[rType.label] =
                        this.includeLabels ? this.mappingJson[rType.label] : this.mappingJson[rType.label].map(plValue => {
                            return plValue.value
                        });
            });
        }
        return JSON.stringify(mappingJson);
    }
    get rColumns() {
        let cols = [];
        if (this.rTypes && this.selectedRTypes) {
            this.rTypes.forEach(rType => {
                if (this.selectedRTypes.findIndex(sel => sel.label == rType.label) > -1) {
                    cols.push({
                        'label': rType.label,
                        'fieldName': rType.label,
                        'wrapText': true,
                        cellAttributes: {
                            class: { fieldName: rType.label + '_cellCss' },
                        }, typeAttributes: {
                            tooltip: { fieldName: rType.label }
                        }
                    });
                }

            })
        }
        return cols;
    }
    get showTable() {
        return this.mappingJson && Object.keys(this.mappingJson).length > 0;
    }
    get rData() {
        let dataList = [];
        if (this.selectedRTypes && this.mappingJson && this.mappingJson['Master']) {
            let valSet = this.mappingJson['Master']
            valSet.forEach(val => {
                let row = {};
                this.selectedRTypes.forEach(rType => {
                    if (this.mappingJson[rType.label]) {
                        let applicableValues = this.mappingJson[rType.label];
                        row[rType.label] = val.label;
                        if (applicableValues.findIndex(sel => sel.value == val.value) > -1) {
                            row[rType.label + '_cellCss'] = 'slds-text-color_success';
                        } else {
                            row[rType.label + '_cellCss'] = 'slds-text-color_error';
                        }
                    }
                });
                dataList.push(row);
            });
        }
        return dataList;
    }
    handlePickselect(event) {
        // this.selectedRTypes = event.detail.valueSet;
        var payload = event.detail.payload;
        var payloadType = event.detail.payloadType;
        if (payloadType === 'multi-select') {
            this.selectedRTypes = payload.values;
        } else if (payloadType === 'uni-select') {
            if (event.detail.callingLabel == 'Select Object' && this.objectApiName != payload.value) {
                this.fieldStruct = {};
                this.picklistFields = undefined;
                this.qualifiedFieldName = undefined;
                this.mappingJson = {};
                this.rTypes = undefined;
                this.selectedRTypes = undefined;
                this.objectApiName = payload.value;
                this.recordTypeId = ((this.rTypes || [])[0] || {}).value;
            }
            else if (event.detail.callingLabel == 'Picklist Field' && payload.value != this.qualifiedFieldName) {
                this.fieldStruct = {};
                this.mappingJson = {};
                this.countIndex = 0;
                this.qualifiedFieldName = payload.value;
                this.recordTypeId = ((this.rTypes || [])[0] || {}).value;
                this.fieldStruct = {
                    "fieldApiName": this.qualifiedFieldName,
                    "objectApiName": this.objectApiName
                }
            }

        }
        event.stopPropagation();
    }
    showToast(errorMessage) {
        const event = new ShowToastEvent({
            title: 'Get Help !',
            type: 'info!',
            message: errorMessage
        });
        this.dispatchEvent(event);
    }
    // Simplifies error messages (credit: LWC Recipes sample app - https://github.com/trailheadapps/lwc-recipes)
    reduceErrors(errors) {
        if (!Array.isArray(errors)) {
            errors = [errors];
        }

        return (
            errors
                // Remove null/undefined items
                .filter(error => !!error)
                // Extract an error message
                .map(error => {
                    // UI API read errors
                    if (Array.isArray(error.body)) {
                        return error.body.map(e => e.message);
                    }
                    // UI API DML, Apex and network errors
                    else if (error.body && typeof error.body.message === 'string') {
                        return error.body.message;
                    }
                    // JS errors
                    else if (typeof error.message === 'string') {
                        return error.message;
                    }
                    // Unknown error shape so try HTTP status text
                    return error.statusText;
                })
                // Flatten
                .reduce((prev, curr) => prev.concat(curr), [])
                // Remove empty strings
                .filter(message => !!message)
        );
    }
}