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
    var httpClient = new _p.extension.HttpClient();
    var httpCode;

    // ********Get Unit Admin's Token********
    var accJson = {
        cellUrl: unitAdminInfo.cellUrl, // Cell URL or Cell name
        userId: unitAdminInfo.accountName,
        password: unitAdminInfo.accountPass

    };
    var accessor = _p.as(accJson);
    var unit = accessor.unit(targetUnitUrl);
    var token = unit.getToken().access_token;

    // ********Create Cell********
    var cell = unit.ctl.cell.create({Name:cellName});

    // ********Create admin account********
    var user = {"Name": accountName};
    cell.ctl.account.create(user, accountPass);

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

// hotfix - to be delete when the Personium Unit is upgraded to the latest personium-engine version that support the followings.
_p.Accessor.prototype.unit = function(unitUrl) {
    // Upgrade to Unit Admin User
    var token = this.cell(unitUrl).getToken();
    var accessor = _p.as({accessToken: token.access_token});

    var unitObj = new Packages.io.personium.client.UnitManager(accessor.core);
    var unit = new _p.UnitManager(unitObj);        
    unit.token = token;

    return unit;
};

_p.UnitManager.prototype.getToken = function() {
    return this.token;
};

_p.AccountManager.prototype.create = function(user, pass) {
    var obj;
    try {
        pjvm.setDefaultHeader('X-Personium-Credential', pass); // hack - to be deleted when personium-client-java is fixed
        
        obj = this.core.create(_p.util.obj2javaJson(user), pass);
        
        pjvm.setDefaultHeader('X-Personium-Credential', null); // hack - to be deleted when personium-client-java is fixed
        
        var account = new _p.Account(obj);
        account.name = obj.getName() + "";
        return account;
    } catch (e) {
        throw new _p.PersoniumException(e.message);
    }
};

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
    } catch (e) {
        throw new _p.PersoniumException(e.message);
    }
};
