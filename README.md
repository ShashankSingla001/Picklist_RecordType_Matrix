# Picklist_RecordType_Matrix

This Source contains a utility matrix to visually understand the mapping of a Picklist/Mutliselect picklist field to different Record Types present on that object.
There is a good use case of its usage, be it for a Developer/Admin to track a specific value or for a business user to decide which value belongs to what recortype & take decisions accordingly. 

this utility will be handy as one can:- 
# Quickly search any object and Picklist field present in the org and check the mapping the experience will save a lot of time to do it unlike how we currently have to check the values navigating each recordtype.
# leverage the option to copy a JSON mapping which can be used for internal purpose.

Do Checkout this Article for Its Features: https://medium.com/@shashanksingla/salesforces-record-type-picklist-matrix-a112429c8150


Components Include:-
# ----------------------------------------------- #
 # ApexClass :-
        OrgObjectsCtrl
# LightningComponentBundle :-
        picklist_RecordTypeMapper
        multicombobox
        
# ----------------------------------------------- #
# post deployment pre-requisites
    add picklist_RecordTypeMapper component to App Page/Record Page/Tab
    please make sure to assign the class to the User profile who is going to access the component.


