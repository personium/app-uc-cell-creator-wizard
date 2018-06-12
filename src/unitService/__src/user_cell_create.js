function(request){
    try {
        personium.validateRequestMethod(["POST"], request);
        
        personium.verifyOrigin(request);
        
        var params = personium.parseBodyAsQuery(request);
        // verify parameter information
        personium.setAllowedKeys(['cellName', 'accName', 'accPass', 'profile']);
        personium.setRequiredKeys(['cellName', 'accName', 'accPass', 'profile']);
        personium.validateKeys(params);

        // ********Get Unit Admin ********
        var unit = getUnitAdmin();

        // ********Create Cell********
        var cellName = params.cellName;
        var cell = unit.ctl.cell.create(
            {
                Name: cellName
            }
        );

        // ********Create account with admin role********
        createAdminAccount(cell, params);
        
        // ********Create profile.json files inside the main box********
        createProfiles(cell, params);

        // ********Get the token of the created cell********
        var cellToken = cell.getToken();
        
        return personium.createResponse(201, cellToken);
    } catch (e) {
        return personium.createErrorResponse(e);
    }
};

function getUnitAdmin() {
    var accInfo = require("acc_info").accInfo;
    var accessor = _p.as(accInfo.UNIT_ADMIN_INFO);
    return accessor.unit(accInfo.UNIT_URL);
};

function createAdminAccount(cell, params) {
    // ********Create account********
    var accountName = params.accName;
    var accountPass = params.accPass;
    var user = {
        Name: accountName
    };
    var acc = cell.ctl.account.create(user, accountPass);

    // ********Create admin role********
    var roleJson = {
        Name: "admin"
    };
    var role = cell.ctl.role.create(roleJson);

    // ********Assign roles to account********
    role.account.link(acc);

    // ********Set all authority admin role********
    var param = {
        ace: [
            {
                role: role,
                privilege: ['root']
            }
        ]
    };
    cell.acl.set(param);
};

function createProfiles(cell, params) {
    var tempProfile = JSON.parse(params.profile);
    var userMainBox = cell.box("__");
    
    createFile(userMainBox, 'profile.json', tempProfile);
    createFile(userMainBox, 'roles.json', {});
    createFile(userMainBox, 'relations.json', {});

    userMainBox.mkCol('locales'); // create folder

    var localesFolder = userMainBox.col('locales');
    localesFolder.mkCol('en');
    localesFolder.mkCol('ja');

    var enFolder = localesFolder.col('en');
    var jaFolder = localesFolder.col('ja');
    
    createFile(enFolder, 'profile.json', {});
    createFile(jaFolder, 'profile.json', {});
};

function createFile(target, filename, contents) {
    target.put({
        path: filename,
        data: JSON.stringify(contents),
        contentType: "application/json",
        charset: "utf-8",
        etag: "*"
    });
};

var personium = require("personium").personium;
