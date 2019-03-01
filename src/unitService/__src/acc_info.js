exports.accInfo = (function() {
    /*
     * Begin of your Personium app configurations
     */
    var unitUrl = 'https://demo.personium.io/'; // for example: https://demo.personium.io/
    var unitAdminCellUrl = 'https://unitadmin.demo.personium.io/'; // for example: https://demo.personium.io/unitAdminCellName/ or https://unitAdminCellName.demo.personium.io/
    var unitAdminID = '***';
    var unitAdminPass = '***';
    var appCellUrl = 'https://app-uc-cell-creator-wizard.demo.personium.io/'; // for example: https://demo.personium.io/appCellName/ or https://appCellName.demo.personium.io/
    var appUserId = '***';
    var appUserPass = '***';
    /*
     * End of your Personium app configurations
     */


    /*
     * Don't modify anything from here on
     */
    var accInfo = {};
    
    accInfo.UNIT_URL = unitUrl; // always with ending slash
    
    accInfo.UNIT_ADMIN_CELL_URL = unitAdminCellUrl;
    accInfo.UNIT_ADMIN_INFO = {
        cellUrl: unitAdminCellUrl,
        userId: unitAdminID,
        password: unitAdminPass
    };
    
    accInfo.APP_CELL_URL = appCellUrl;
    accInfo.APP_CELL_ADMIN_INFO = {
        cellUrl: appCellUrl,
        userId: appUserId,
        password: appUserPass 
    };      

    return accInfo;
}());
