function(request){
    try {
        personium.validateRequestMethod(["POST"], request);
        
        personium.verifyOrigin(request);
        
        var params = personium.parseBodyAsQuery(request);
        // verify parameter information
        personium.setAllowedKeys(['cellName', 'accName', 'accPass']);
        personium.setRequiredKeys(['cellName', 'accName', 'accPass']);
        personium.validateKeys(params);
        
        var cellName = params.cellName;
        var accountName = params.accName;
        var accountPass = params.accPass;
        
        var accInfo = require("acc_info").accInfo;
        
        // ********Get Unit Admin ********
        var accessor = _p.as(accInfo.UNIT_ADMIN_INFO);
        var unit = accessor.unit(accInfo.UNIT_URL);

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
        var accJson = {
            cellUrl: cellName,
            userId: accountName,
            password: accountPass
        };
        var createdCell = _p.as(accJson).cell();
        var cellToken = createdCell.getToken();
        
        return personium.createResponse(201, cellToken);
    } catch (e) {
        return personium.createErrorResponse(e);
    }
};

var personium = require("personium").personium;