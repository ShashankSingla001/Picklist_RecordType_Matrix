import { LightningElement, api } from 'lwc';

export default class MultiCombobox extends LightningElement {

    @api options;
    @api selectedValue;
    @api selectedValues = [];
    @api label;
    @api minChar = 2;
    @api disabled = false;
    @api multiSelect = false;
    value = {};
    values = [];
    optionData;
    searchString;
    message;
    showDropdown = false;

    connectedCallback() {
        this.showDropdown = false;
        var optionData = this.options ? (JSON.parse(JSON.stringify(this.options))) : [];
        var value = this.selectedValue ? (JSON.parse(JSON.stringify(this.selectedValue))) : null;
        var values = this.selectedValues ? (JSON.parse(JSON.stringify(this.selectedValues))) : null;
        if (value || values) {
            var searchString;
            var count = 0;
            for (var i = 0; i < optionData.length; i++) {
                if (this.multiSelect) {
                    if (values.findIndex(val => val.value == optionData[i].value) > -1) {
                        optionData[i].selected = true;
                        count++;
                    }
                } else {
                    if (optionData[i].value == value) {
                        searchString = optionData[i].label;
                        optionData[i].selected = true;
                    } else {
                        optionData[i].selected = false;
                    }
                }
            }
            if (this.multiSelect)
                this.searchString = count + ' Option(s) Selected';
            else
                this.searchString = searchString;
        }
        this.value = value;
        this.values = values;
        this.optionData = optionData;
    }
    get isDisabled() {
        return this.disabled || !this.optionData;
    }
    filterOptions(event) {
        this.searchString = event.target.value;
        if (this.searchString && this.searchString.length > 0) {
            this.message = '';
            if (this.searchString.length >= this.minChar) {
                var flag = true;
                for (var i = 0; i < this.optionData.length; i++) {
                    if (this.optionData[i].label.toLowerCase().trim().includes(this.searchString.toLowerCase().trim())
                        || this.optionData[i].value.toLowerCase().trim().includes(this.searchString.toLowerCase().trim())) {
                        this.optionData[i].isVisible = true;
                        flag = false;
                    } else {
                        this.optionData[i].isVisible = false;
                    }
                }
                if (flag) {
                    this.message = "No results found for '" + this.searchString + "'";
                }
            }
            this.showDropdown = true;
        } else {
            this.showDropdown = false;
        }
    }

    selectItem(event) {
        var selectedVal = event.currentTarget.dataset.id;
        if (selectedVal) {
            var count = 0;
            var options = JSON.parse(JSON.stringify(this.optionData)) || [];
            for (var i = 0; i < options.length; i++) {
                if (options[i].value === selectedVal) {
                    if (this.multiSelect) {
                        options[i].selected = options[i].selected ? false : true;
                        if (this.values.findIndex(val => val.value == options[i].value) > -1) {
                            this.values = this.values.filter(val => val.value != options[i].value);
                        } else {
                            this.values.push(options[i]);
                        }

                    } else {
                        this.value = options[i].value;
                        options[i].selected = true;
                        this.searchString = options[i].label;
                    }
                } else if (!this.multiSelect) {
                    options[i].selected = false;
                }
                if (options[i].selected) {
                    count++;
                }
            }
            this.optionData = options;
            if (this.multiSelect)
                this.searchString = count + ' Option(s) Selected';
            if (this.multiSelect)
                event.preventDefault();
            else
                this.showDropdown = false;
        }
    }

    showOptions() {
        if (this.disabled == false && this.options) {
            this.message = '';
            this.searchString = '';
            var options = JSON.parse(JSON.stringify(this.optionData)) || [];
            for (var i = 0; i < options.length; i++) {
                options[i].isVisible = true;
            }
            if (options.length > 0) {
                this.showDropdown = true;
            }
            this.optionData = options;
        }
    }

    blurEvent() {
        var previousLabel;
        var count = 0;
        for (var i = 0; i < this.optionData.length; i++) {
            if (this.optionData[i].value === this.value) {
                previousLabel = this.optionData[i].label;
            }
            if (this.optionData[i].selected) {
                count++;
            }
        }
        if (this.multiSelect)
            this.searchString = count + ' Option(s) Selected';
        else
            this.searchString = previousLabel;

        this.showDropdown = false;
        this.dispatchEvent(new CustomEvent('select', {
            detail: {
                'payloadType': this.multiSelect ? 'multi-select' : 'uni-select',
                'callingLabel': this.label,
                'payload': {
                    'value': this.value,
                    'values': this.values
                }
            }
        }));
    }
}