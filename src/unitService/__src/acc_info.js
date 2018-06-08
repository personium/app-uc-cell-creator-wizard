exports.accInfo = (function() {
    /*
     * Begin of your Personium app configurations
     */
    var rootUrl = '***'; // for example: https://demo.personium.io
    var unitAdminCellName = '***';
    var unitAdminID = '***';
    var unitAdminPass = '***';
    var appCellName = '***'; // for example: app-minimal
    var appUserId = '***';
    var appUserPass = '***';
    /*
     * End of your Personium app configurations
     */


    /*
     * Don't modify anything from here on
     */
    var accInfo = {};
    
    accInfo.UNIT_URL = [ rootUrl, '' ].join('/'); // always with ending slash
    
    var unitAdminCellUrl = [ rootUrl, unitAdminCellName, '' ].join('/'); // always with ending slash
    accInfo.UNIT_ADMIN_CELL_URL = unitAdminCellUrl;
    accInfo.UNIT_ADMIN_INFO = {
        cellUrl: unitAdminCellName,
        userId: unitAdminID,
        password: unitAdminPass
    };
    
    var appCellUrl = [ rootUrl, appCellName, '' ].join('/'); // always with ending slash
    accInfo.APP_CELL_URL = appCellUrl;
    accInfo.APP_CELL_ADMIN_INFO = {
        cellUrl: appCellName,
        userId: appUserId,
        password: appUserPass 
    };      

    return accInfo;
}());
