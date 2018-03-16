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

    //return testdata();

    var httpClient = new _p.extension.HttpClient();
    var httpCode;

    // ********Get Unit Admin's Token********
    var accJson = {
        cellUrl: unitAdminInfo.cellUrl, // Cell URL or Cell name
        userId: unitAdminInfo.accountName,
        password: unitAdminInfo.accountPass

    };
    var unitAdminToken = _p.as(accJson).cell(targetUnitUrl).getToken();
    var token = unitAdminToken.access_token;
    // ************************

    // ********Create cell********
    var urlC = targetUnitUrl + "__ctl/Cell";
    var headersC = {
      "Authorization":"Bearer " + token
    }
    var contentTypeC = "application/json";
    var bodyC = "{\"Name\": \"" + cellName + "\"}";

    // エンドポイントへのPOST
    try {
        apiRes = httpClient.post(urlC, headersC, contentTypeC, bodyC);
    } catch(e) {
        return createErrorResponse500(e);
    }
    httpCode = parseInt(apiRes.status);
    if (httpCode !== 201) {
        return createResponse(httpCode, apiRes.body);
    }

    // ********Create admin account********
    var urlA = targetUnitUrl + cellName + "/__ctl/Account";
    var headersA = {
        "Authorization":"Bearer " + token,
        "X-Personium-Credential": accountPass
    };
    var contentTypeA = "application/json";
    var bodyA = "{\"Name\": \"" + accountName + "\"}";

    try {
        apiRes = httpClient.post(urlA, headersA, contentTypeA, bodyA);
    } catch(e) {
        return createErrorResponse500(e);
    }
    httpCode = parseInt(apiRes.status);
    if (httpCode !== 201) {
        return createResponse(httpCode, apiRes.body);
    }
    // ******************************

    try {
        // ********Get created cell********
        var cell = _p.as({accessToken: token}).cell(cellName);
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

// hotfix
_p.AclManager.prototype.get = function() {

    try {
        var obj = this.core.get();
        var acl = {};
        acl["base"] = obj.base + "";
        acl["requireSchemaAuthz"] = obj.getRequireSchemaAuthz() + "";

        var aces = obj.aceList;
        for (var i = 0; i < aces.length; i++) {
            var principalObj = aces[i].getPrincipal();
            var roleName;
            if (principalObj instanceof Packages.io.personium.client.Role) {
                // Only Role class have getName method
                roleName = principalObj.getName();
            } else {
                switch(principalObj) {
                case Packages.io.personium.client.Principal.ALL:
                    roleName = '_ALL';
                    break;
                case Packages.io.personium.client.Principal.AUTHENTICATED:
                    roleName = '_AUTHENTICATED';
                    break;
                case Packages.io.personium.client.Principal.UNAUTHENTICATED:
                    roleName = '_UNAUTHENTICATED';
                    break;
                default:
                    throw new _p.PersoniumException("Parameter Invalid");
                }
            }
            var ace = {};
            ace["role"] = roleName + "";
            var privilegeList = aces[i].privilegeList;
            var privilege = new Array(privilegeList.length);
            for (j = 0; j < privilegeList.length; j++) {
                privilege[j] = privilegeList[j] + "";
            }
            ace["privilege"] = privilege;
            aces[i] = ace;
        }
        acl["ace"] = aces;
        return acl;
    } catch (e) {
        throw new _p.PersoniumException(e.message);
    }
};
_p.AclManager.prototype.set = function(param) {
    try {
        var acl = new Packages.io.personium.client.Acl();

        if (param["requireSchemaAuthz"] !== null
        && typeof param["requireSchemaAuthz"] !== "undefined"
        && (param["requireSchemaAuthz"] !== "")) {
            acl.setRequireSchemaAuthz(param["requireSchemaAuthz"]);
        }
        var aces = param["ace"];

        if (aces != null) {
            for (var i = 0; i < aces.length; i++) {
                aceObj = aces[i];
                if (aceObj != null) {
                    var ace = new Packages.io.personium.client.Ace();
                    if ((aceObj["role"] != null) && (aceObj["role"] != "")) {
                        ace.setRole(aceObj["role"].core);
                    }
                    if ((aceObj["privilege"] != null) && (aceObj["privilege"] instanceof Array) && (aceObj["privilege"] != "")) {
                        for (var n = 0; n < aceObj["privilege"].length; n++) {
                            ace.addPrivilege(aceObj["privilege"][n]);
                        }
                    }
                    acl.addAce(ace);
                }
            }
        }
        this.core.set(acl);
        // cell.core.acl.set(acl); NG
        // cell.acl.core.set(acl);
    } catch (e) {
        throw new _p.PersoniumException(e.message);
    }
};
