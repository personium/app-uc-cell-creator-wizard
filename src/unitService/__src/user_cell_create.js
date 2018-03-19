function(request){
    var getUnitAdminInfo = function(request) {
        /*
         * Replace the "***" with the target Personium Unit URL (with ending slash)
         * e.g. 'https://demo.personium.io/'
         */
        var targetUnitUrl = '***';

        /*
        * Replace the "***" with a valid Unit Admin cell name of the target Personium Unit.
        */
        var targetUnitAdminCellName = '***';

        /*
        * Replace the "***" with a valid Unit Admin account name of the target Personium Unit.
        */
        var targetUnitAdminAccountName = '***';

        /*
        * Replace the "***" with a valid Unit Admin account password of the target Personium Unit.
        */
        var targetUnitAdminAccountPassword = '***';

        var baseUrl = request.headers['x-baseurl'];
        var unitUrl = (targetUnitUrl == '***') ? baseUrl : targetUnitUrl;
    
        return {
            unitUrl: unitUrl,
            cellUrl: unitUrl + targetUnitAdminCellName + '/',
            accountName: targetUnitAdminAccountName,
            accountPass: targetUnitAdminAccountPassword
        }
    }

    var getUrlInfo = function(request) {
        var baseUrl = request.headers['x-baseurl'];
        var forwardedPath = request.headers['x-forwarded-path'];
        var cellName = forwardedPath.split('/').splice(1)[0];
        var boxName = forwardedPath.split('/').splice(1)[1];
        var urlInfo = {
            unitUrl: baseUrl,
            cellUrl: baseUrl + cellName + '/',
            cellName: cellName,
            boxName: boxName
        };

        return urlInfo;
    }

    var bodyAsString = request["input"].readAll();
    if (bodyAsString === "") {
        var tempBody = {
            code: "PR400-OD-0006",
            message: {
                lang: "en",
                value: "Request body is empty."
            }
        };
        return createResponse(400, tempBody);
    }
    var params = _p.util.queryParse(bodyAsString);
    var urlInfo = getUrlInfo(request);
    var unitAdminInfo = getUnitAdminInfo(request);
    var cellName = params.cellName;
    var accountName = params.accName;
    var accountPass = params.accPass;

    /*
    * Set up necessary URLs for this service.
    * Current setup procedures only support creating a cell within the same Personium server.
    */
    var targetUnitUrl = unitAdminInfo.unitUrl;

    // ********Get Unit Admin's Token********
    var accJson = {
        cellUrl: unitAdminInfo.cellUrl, // Cell URL or Cell name
        userId: unitAdminInfo.accountName,
        password: unitAdminInfo.accountPass

    };
    var accessor = _p.as(accJson);
    var unit = accessor.unit(targetUnitUrl);

    try {
        // ********Create Cell********
        var cell = unit.ctl.cell.create({Name:cellName});

        // ********Create admin account********
        var user = {"Name": accountName};
        cell.ctl.account.create(user, accountPass);
    
        // ********Get created cell********
        var cell = unit.cell(cellName);
        // ********************************

        // ********Get created account********
        var accObj = cell.ctl.account.retrieve(accountName);
        // ***********************************

        // ********Create admin role********
        var roleJson = {
            "Name": "admin"
        };
        var roleObj = cell.ctl.role.create(roleJson);
        // *********************************

        // ********Assign roles to accounts********
        roleObj.account.link(accObj);
        // ****************************************

        // ********Set all authority admin role********
        var param = {
            'ace': [{'role':cell.ctl.role.retrieve(roleJson), 'privilege':['root']}]
        };

        cell.acl.set(param);
        // ********************************************

        // ********Get the token of the created cell********
        var accJson = {
            cellUrl: cellName,
            userId: accountName,
            password: accountPass
        };
        var createCell = _p.as(accJson).cell();
        var cellToken = createCell.getToken();
        // *************************************************
    } catch (e) {
        return createErrorResponse500(e);
    }

    return createResponse(201, cellToken);
};

function createSuccessResponse(tempBody) {
    return createResponse(200, tempBody);
}

function createErrorResponse500(tempBody) {
    return createResponse(500, tempBody);
}

function createResponse(tempCode, tempBody) {
    var isString = typeof tempBody == "string";
    var tempHeaders = isString ? {"Content-Type":"text/plain"} : {"Content-Type":"application/json"};
    return {
        status: tempCode,
        headers: tempHeaders,
        body: [isString ? tempBody : JSON.stringify(tempBody)]
    };
}
