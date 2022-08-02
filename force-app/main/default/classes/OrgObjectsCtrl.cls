public class OrgObjectsCtrl {    
    @auraEnabled
    public static List<Sobject> fetchObjects(){
        return [SELECT SobjectType FROM ObjectPermissions GROUP BY SobjectType ORDER BY SobjectType ASC];
    }
}