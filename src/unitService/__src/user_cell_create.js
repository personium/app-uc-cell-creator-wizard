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
    var cellName = params.cellName;
    var accountName = params.accName;
    var accountPass = params.accPass;
    var urlInfo = getUrlInfo(request);
    var unitAdminInfo = getUnitAdminInfo(request);

    /*
    * Set up necessary URLs for this service.
    * Current setup procedures only support creating a cell within the same Personium server.
    */
    var targetUnitUrl = unitAdminInfo.unitUrl;

    try {
        // ********Get Unit Admin ********
        var accJson = {
            cellUrl: unitAdminInfo.cellUrl, // Cell URL or Cell name
            userId: unitAdminInfo.accountName,
            password: unitAdminInfo.accountPass

        };
        var accessor = _p.as(accJson);
        var unit = accessor.unit(targetUnitUrl);

        // ********Create Cell********
        var cell = unit.ctl.cell.create({Name:cellName});

        // ********Create admin account********
        var user = {"Name": accountName};
        var acc = cell.ctl.account.create(user, accountPass);
    
        // ********Create admin role********
        var roleJson = {
            "Name": "admin"
        };
        var role = cell.ctl.role.create(roleJson);

        // ********Assign roles to account********
        role.account.link(acc);

        // ********Set all authority admin role********
        var param = {
            'ace': [{'role': role, 'privilege':['root']}]
        };
        cell.acl.set(param);

        // ********Get the token of the created cell********
        accJson = {
            cellUrl: cellName,
            userId: accountName,
            password: accountPass
        };
        var createdCell = _p.as(accJson).cell();
        var cellToken = createdCell.getToken();
    } catch (e) {
        return createErrorResponse500(e);
    }

    return createResponse(201, cellToken);
};

function createSuccessResponse(tempBody) {
    return createResponse(200, tempBody);
};

function createErrorResponse500(tempBody) {
    return createResponse(500, tempBody);
};

function createResponse(tempCode, tempBody) {
    var isString = typeof tempBody == "string";
    var tempHeaders = isString ? {"Content-Type":"text/plain"} : {"Content-Type":"application/json"};
    return {
        status: tempCode,
        headers: tempHeaders,
        body: [isString ? tempBody : JSON.stringify(tempBody)]
    };
}
