function(request){
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

    /*
    * Replace the "***" with a valid Unit Admin cell name of the target Personium Unit.
    */
    var targetUnitAdminCellName = "***";

    /*
    * Replace the "***" with a valid Unit Admin account name of the target Personium Unit.
    */
    var targetUnitAdminAccountName = "***";

    /*
    * Replace the "***" with a valid Unit Admin account password of the target Personium Unit.
    */
    var targetUnitAdminAccountPassword = "***";

    /* 
    * Set up necessary URLs for this service.
    * Current setup procedures only support creating a cell within the same Personium server.
    */
    var rootUrl = pjvm.getBaseUrl();
    var targetRootUrl = rootUrl;

    //return testdata();

    var httpClient = new _p.extension.HttpClient();
    var httpCode;

    // ********Get Token********
    var urlT = [targetRootUrl, targetUnitAdminCellName, "/__token"].join("");
    var headersT = {}
    var contentTypeT = "application/x-www-form-urlencoded";
    var bodyT = [
        "grant_type=password",
        "&username=", targetUnitAdminAccountName,
        "&password=", targetUnitAdminAccountPassword,
        "&p_target=" + targetRootUrl].join("");

    // エンドポイントへのPOST
    try {
        var apiRes = httpClient.post(urlT, headersT, contentTypeT, bodyT);
    } catch(e) {
        return createErrorResponse500(e);
    }
    httpCode = parseInt(apiRes.status);
    if (httpCode !== 200) {
        return createResponse(httpCode, apiRes.body);
    }
    var tokenJson = JSON.parse(apiRes.body);
    var token = tokenJson.access_token;
    // ************************

    // ********Create cell********
    var urlC = targetRootUrl + "__ctl/Cell";
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
    var urlA = targetRootUrl + cellName + "/__ctl/Account";
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
        cell.core.acl.set(acl);
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

    return createSuccessResponse(cellToken);
};

function testdata() {
    var tempBody = {
        baseUrl : pjvm.getBaseUrl(),
        cellName: pjvm.getCellName(),
        boxSchema: pjvm.getBoxSchema(),
        boxName: pjvm.getBoxName()
    };
    
    return createSuccessResponse(tempBody);
}

function createSuccessResponse(tempBody) {
    return createResponse(200, tempBody);
}

function createErrorResponse500(tempBody) {
    return createResponse(500, tempBody);
}

function createResponse(tempCode, tempBody) {
    var isString = typeof tempBody == "string";
    return {
        status: tempCode,
        headers: {"Content-Type":"application/json"},
        body: [isString ? tempBody : JSON.stringify(tempBody)]
    };
}
