function(request){
    try {
        var accInfo = require("acc_info").accInfo;
        
        var _getUnitAdmin = function() {
            var accessor = _p.as(accInfo.UNIT_ADMIN_INFO);
            return accessor.unit(accInfo.UNIT_URL);
        };

        var _createAdminAccount = function(cell, params) {
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

        var _createProfiles = function(cell, params) {
            var tempProfile = JSON.parse(params.profile);
            var cellUrl = cell.getUrl();
            var token = cell.getToken();
            var userMainBox = cell.box("__");
            var boxUrl = userMainBox.core.getPath(); // getUrl is not implemented for box
            
            _createFile(userMainBox, 'profile.json', tempProfile);
            _createFile(userMainBox, 'roles.json', {});
            _createFile(userMainBox, 'relations.json', {});

            userMainBox.mkCol('locales'); // create folder

            var localesFolder = userMainBox.col('locales');
            localesFolder.mkCol('en');
            localesFolder.mkCol('ja');

            var enFolder = localesFolder.col('en');
            var jaFolder = localesFolder.col('ja');
            
            _createFile(enFolder, 'profile.json', {});
            _createFile(jaFolder, 'profile.json', {});
            
            _setCollectionACLAPI(cellUrl, boxUrl + "/profile.json", token.access_token);
            _setCollectionACLAPI(cellUrl, boxUrl + "/roles.json", token.access_token);
            _setCollectionACLAPI(cellUrl, boxUrl + "/relations.json", token.access_token);
            _setCollectionACLAPI(cellUrl, boxUrl + "/locales", token.access_token);
        };

        var _createFile = function(target, filename, contents) {
            target.put({
                path: filename,
                data: JSON.stringify(contents),
                contentType: "application/json",
                charset: "utf-8",
                etag: "*"
            });
        };

        var _setCollectionACLAPI = function(cellUrl, targetUrl, token) {
            var headers = {
                "Accept": "application/json",
                "Authorization": "Bearer " + token,
                "X-HTTP-Method-Override": "ACL"
            };
            var body = "<?xml version=\"1.0\" encoding=\"utf-8\" ?><D:acl xmlns:p=\"urn:x-personium:xmlns\" xmlns:D=\"DAV:\" xml:base=\"" + cellUrl + "__role/__/\"><D:ace><D:principal><D:all/></D:principal><D:grant><D:privilege><p:read/></D:privilege></D:grant></D:ace></D:acl>";
            var contentType = "application/json";

            return _httpPOSTMethod(targetUrl, headers, contentType, body);
        };

        var _httpPOSTMethod = function(url, headers, contentType, body) {
            var httpClient = new _p.extension.HttpClient();
            var response = null;
            var httpCode;
            try {
                response = httpClient.post(url, headers, contentType, body);
                httpCode = parseInt(response.status);
            } catch(e) {
                // Sometimes SSL certificate issue raises exception
                httpCode = 500;
            }
            
            if (httpCode === 500) {
                // retry
                var ignoreVerification = {"IgnoreHostnameVerification": true};
                httpClient = new _p.extension.HttpClient(ignoreVerification);
                response = httpClient.post(url, headers, contentType, body);
                httpCode = parseInt(response.status);
            }
            if (httpCode !== 201 && httpCode !== 200) {
                // Personium exception
                var err = [
                    "io.personium.client.DaoException: ",
                    httpCode,
                    ",",
                    response.body
                ].join("");
                throw new _p.PersoniumException(err);
            }
            return response;
        };
        
        personium.validateRequestMethod(["POST"], request);
        
        personium.verifyOrigin(request);
        
        var params = personium.parseBodyAsQuery(request);
        // verify parameter information
        personium.setAllowedKeys(['cellName', 'accName', 'accPass', 'profile']);
        personium.setRequiredKeys(['cellName', 'accName', 'accPass', 'profile']);
        personium.validateKeys(params);

        // ********Get Unit Admin ********
        var unit = _getUnitAdmin();

        // ********Create Cell********
        var cellName = params.cellName;
        var cell = unit.ctl.cell.create(
            {
                Name: cellName
            }
        );
        
        // ********Create account with admin role********
        _createAdminAccount(cell, params);
        
        // ********Create profile.json files inside the main box********
        _createProfiles(cell, params);

        // ********Get the token of the created cell********
        var cellToken = cell.getToken();
        
        return personium.createResponse(201, cellToken);
    } catch (e) {
        return personium.createErrorResponse(e);
    }
};

var personium = require("personium").personium;
