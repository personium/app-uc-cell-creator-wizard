function(request){
  var bodyAsString = request["input"].readAll();
  if (bodyAsString === "") {
      return {
             status : 200,
             headers : {"Content-Type":"application/json"},
             body : ['-2']
      };
  }
  var params = dc.util.queryParse(bodyAsString);

  var cellName = params.cellName;
  var accountName = params.accName;
  var accountPass = params.accPass;

  /*
   * Replace the "***" with the target Personium domain name
   */
  var targetDomainName = "***";

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
  var rootUrl = ["https://", targetDomainName, "/"].join("");
  var targetRootUrl = rootUrl;

  // Hack Ver
  var dcx = {sports: {HTTP: {}}};
  var __a = new Packages.io.personium.client.PersoniumContext(pjvm.getBaseUrl(), pjvm.getCellName(), pjvm.getBoxSchema(), pjvm.getBoxName()).withToken(null);
  dcx.sports.HTTP._ra = Packages.io.personium.client.http.RestAdapterFactory.create(__a);
  var formatRes = function(dcr) {
    var resp = {body: "" + dcr.bodyAsString(), status: dcr.getStatusCode(), headers: {}};
    return resp;
  }

  //// get
  //dcx.sports.HTTP.get = function(url, headers) {
  //  if (!headers) {
  //  	headers = {"Accept": "text/plain"};
  //  }
  //  var dcr = dcx.sports.HTTP._ra.get(url, dc.util.obj2javaJson(headers), null);
  //  return formatRes(dcr);
  //};
  // post 
  dcx.sports.HTTP.post = function(url, body, contentType, headers) {
    if (!headers) {
      headers = {"Accept": "text/plain"};
    }
    var dcr = dcx.sports.HTTP._ra.post(url, dc.util.obj2javaJson(headers), body, contentType);
    return formatRes(dcr);
  };

  // ********Get Token********
  var urlT = [targetRootUrl, targetUnitAdminCellName, "/__token"].join("");
  var bodyT = [
    "grant_type=password",
    "&username=", targetUnitAdminAccountName,
    "&password=", targetUnitAdminAccountPassword,
    "&p_target=" + targetRootUrl].join("");
  var headersT = {}
  var contentTypeT = "application/x-www-form-urlencoded";
  
  // エンドポイントへのPOST
  var apiRes = dcx.sports.HTTP.post(urlT, bodyT, contentTypeT, headersT);

  if (apiRes === null || apiRes.status !== 200) {
    return {
      status : apiRes.status,
      headers : {"Content-Type":"application/json"},
      body : ['{"error": {"status":' + apiRes.status + ', "message": "API call failed."}}']
    };
  }
  var tokenJson = JSON.parse(apiRes.body);
  var token = tokenJson.access_token;
  // ************************

  // ********Create cell********
  var urlC = targetRootUrl + "__ctl/Cell";
  var bodyC = "{\"Name\": \"" + cellName + "\"}";
  var headersC = {
      "Authorization":"Bearer " + token
  }
  var contentTypeC = "application/json";
  apiRes = dcx.sports.HTTP.post(urlC, bodyC, contentTypeC, headersC);
  if (apiRes === null || apiRes.status !== 201) {
    return {
      status : apiRes.status,
      headers : {"Content-Type":"application/json"},
      body : ['{"error": {"status":' + apiRes.status + ', "message": "API call failed."}}']
    };
  }
  // **************************

  // ********Create admin account********
  var urlA = targetRootUrl + cellName + "/__ctl/Account";
  var bodyA = "{\"Name\": \"" + accountName + "\"}";
  var headersA = {
      "Authorization":"Bearer " + token,
      "X-Personium-Credential": accountPass
  }
  var contentTypeA = "application/json";
  apiRes = dcx.sports.HTTP.post(urlA, bodyA, contentTypeA, headersA);
  if (apiRes === null || apiRes.status !== 201) {
    return {
      status : apiRes.status,
      headers : {"Content-Type":"application/json"},
      body : ['{"error": {"status":' + apiRes.status + ', "message": "API call failed."}}']
    };
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
        var createCell = dc.as(accJson).cell();
        var cellToken = createCell.getToken();
        // *************************************************
  } catch (e) {
      return {
          status : 418,
          headers : {"Content-Type":"application/json"},
          body : [e.message]
      };
  }

//// Engine Extension Ver
  //try {
  //    httpclient = new _p.extension.HttpClient();
  //} catch (e) {
  //     return {
  //          status: 500,
  //          headers: {"Content-Type":"text/html"},
  //          body: ["httpclient Error massage: " + e]
  //    };
  //}

  //// get token
  //var urlT = "https://demo.personium.io/unitadmin/__token";
  //var bodyT = "grant_type=password";
  //bodyT += "&username=unitadmin";
  //bodyT += "&password=DEcqtljphmsGcqhz";
  //bodyT += "&p_target=https://demo.personium.io/";
  //var headersT = {}
  //var contentTypeT = "application/x-www-form-urlencoded";
  //var apiRes = { status: "", headers : {}, body :"" };
  //try {
  //    //post request
  //    apiRes = httpclient.postParam(urlT, headersT, contentTypeT, bodyT);
  //} catch (e) {
  //    return {
  //        status: 500,
  //        headers: {"Content-Type":"text/plain"},
  //          body: ["httpclient.post Error massage: " + e]
  //    };
  //}
  //var errorJson = ErrorCheck(apiRes);
  //if (errorJson) {
  //    return errorJson;
  //}
  //var tokenJson = JSON.parse(apiRes.body);
  //var token = tokenJson.access_token;

  //// create cell
  //var urlC = "https://demo.personium.io/__ctl/Cell";
  //var bodyC = "{\"Name\": \"" + cellName + "\"}";
  //var headersC = {
  //    "Authorization":"Bearer " + token
  //}
  //var contentTypeC = "application/json";
  //apiRes = { status: "", headers : {}, body :"" };
  //try {
  //    //post request
  //    apiRes = httpclient.postParam(urlC, headersC, contentTypeC, bodyC);
  //} catch (e) {
  //    return {
  //        status: 500,
  //        headers: {"Content-Type":"text/plain"},
  //          body: ["httpclient.post Error massage: " + e]
  //    };
  //}
  //var urlL = "https://demo.personium.io/" + cellName + "/";
  //var headersL = {
  //    "Authorization":"Bearer " + token,
  //    "Accept":"application/json"
  //}
  //apiRes = { status: "", headers : {}, body :"" };
  //try {
  //    //get request
  //    apiRes = httpclient.get(urlL, headersL);
  //} catch (e) {
  //    return {
  //        status: 500,
  //        headers: {"Content-Type":"text/plain"},
  //          body: ["httpclient.post Error massage: " + e]
  //    };
  //}
  //errorJson = ErrorCheck(apiRes);
  //if (errorJson) {
  //    return errorJson;
  //}

  //// create admin account
  //var nameJson = "{\"Name\": \"" + accountName + "\"}";
  //var urlA = "https://demo.personium.io/" + cellName + "/__ctl/Account";
  //var headersA = {
  //    "Authorization":"Bearer " + token,
  //    "X-Personium-Credential": accountPass
  //}
  //var contentTypeA = "application/json";
  //try {
  //    //post request
  //    apiRes = httpclient.postParam(urlA, headersA, contentTypeA, nameJson);
  //} catch (e) {
  //    return {
  //        status: 500,
  //        headers: {"Content-Type":"text/plain"},
  //          body: ["httpclient.post Error massage: " + e]
  //    };
  //}
  //urlA = "https://demo.personium.io/" + cellName + "/__ctl/Account('" + accountName + "')";
  //headersA = {
  //    "Authorization":"Bearer " + token,
  //    "Accept":"application/json"
  //}
  //try {
  //    //get request
  //    apiRes = httpclient.get(urlA, headersA);
  //} catch (e) {
  //    return {
  //        status: 500,
  //        headers: {"Content-Type":"text/plain"},
  //          body: ["httpclient.post Error massage: " + e]
  //    };
  //}
  //errorJson = ErrorCheck(apiRes);
  //if (errorJson) {
  //    return errorJson;
  //}

  //// create admin role
  //var urlR = "https://demo.personium.io/" + cellName + "/__ctl/Role";
  //var bodyR = "{\"Name\": \"admin\"}";
  //var headersR = {
  //    "Authorization":"Bearer " + token,
  //    "Accept":"application/json"
  //}
  //var contentTypeR = "application/json";
  //try {
  //    //post request
  //    //apiRes = httpclient.postParam(urlR, headersR, contentTypeR, bodyR);
  //} catch (e) {
  //    return {
  //        status: 500,
  //        headers: {"Content-Type":"text/plain"},
  //          body: ["httpclient.post Error massage: " + e]
  //    };
  //}
  //urlR += "('admin')";
  //try {
  //    //post request
  //    apiRes = httpclient.get(urlR, headersR);
  //} catch (e) {
  //    return {
  //        status: 500,
  //        headers: {"Content-Type":"text/plain"},
  //          body: ["httpclient.post Error massage: " + e]
  //    };
  //}
  //errorJson = ErrorCheck(apiRes);
  //if (errorJson) {
  //    return errorJson;
  //}

  //// role association
  //var urlAss = "https://demo.personium.io/" + cellName + "/__ctl/Role('admin')/$links/_Account";
  //var bodyAss = "{\"uri\":\"https://demo.personium.io/" + cellName + "/__ctl/Account('" + accountName + "')\"}";
  //var headersAss = {
  //    "Authorization":"Bearer " + token,
  //    "Accept":"application/json"
  //}
  //var contentTypeAss = "application/json";
  //try {
  //    //post request
  //    //apiRes = httpclient.postParam(urlAss, headersAss, contentTypeAss, bodyAss);
  //} catch (e) {
  //    return {
  //        status: 500,
  //        headers: {"Content-Type":"text/plain"},
  //          body: ["httpclient.post Error massage: " + e]
  //    };
  //}
  //var urlAss = "https://demo.personium.io/" + cellName + "/__ctl/Account('" + accountName + "')/$links/_Role";
  //try {
  //    //post request
  //    apiRes = httpclient.get(urlAss, headersAss);
  //} catch (e) {
  //    return {
  //        status: 500,
  //        headers: {"Content-Type":"text/plain"},
  //          body: ["httpclient.post Error massage: " + e]
  //    };
  //}
  //errorJson = ErrorCheck(apiRes);
  //if (errorJson) {
  //    return errorJson;
  //}

  //// set all authority
  //var infoULUUT = {
  //    cellUrl : "unitadmin",
  //    userId  : "unitadmin",
  //    password: "DEcqtljphmsGcqhz"
  //};
  //var admin = _p.as(infoULUUT).cell("unitadmin").getToken();
  ////token = admin.access_token;
  //var cell = _p.as({accessToken: token}).cell("testsakamoto");
  //var roleJson = {
  //    "Name": "admin"
  //}
  //var param = {
  //    'ace': [{'role':cell.ctl.role.retrieve(roleJson), 'privilege':['root']}]
  //};
  ////cell.acl.set(param);
  //try {
  //      var acl = new Packages.io.personium.client.Acl();

  //      if (param["requireSchemaAuthz"] !== null
  //      && typeof param["requireSchemaAuthz"] !== "undefined"
  //      && (param["requireSchemaAuthz"] !== "")) {
  //          acl.setRequireSchemaAuthz(param["requireSchemaAuthz"]);
  //      }
  //      var aces = param["ace"];

  //      if (aces != null) {
  //          for (var i = 0; i < aces.length; i++) {
  //              aceObj = aces[i];
  //              if (aceObj != null) {
  //                  var ace = new Packages.io.personium.client.Ace();
  //                  if ((aceObj["role"] != null) && (aceObj["role"] != "")) {
  //                      ace.setRole(aceObj["role"].core);
  //                  }
  //                  if ((aceObj["privilege"] != null) && (aceObj["privilege"] instanceof Array) && (aceObj["privilege"] != "")) {
  //                      for (var n = 0; n < aceObj["privilege"].length; n++) {
  //                          ace.addPrivilege(aceObj["privilege"][n]);
  //                      }
  //                  }
  //                  acl.addAce(ace);
  //              }
  //          }
  //      }
  //      cell.core.acl.set(acl);
  //} catch (e) {
  //    return {
  //        status : 418,
  //        headers : {"Content-Type":"application/json"},
  //        body : [e.message]
  //    };
  //}

  return {
         status : 200,
         headers : {"Content-Type":"application/json"},
         body : [JSON.stringify(cellToken)]
  };
}

function ErrorCheck(response) {
  if (response === null) {
      return {
          status : 418,
          headers : {"Content-Type":"application/json"},
          body : ['HttpResponse ois null ']
      };
  }
  if (response.status === "") {
      return {
          status : 418,
          headers : {"Content-Type":"text/html"},
          body : ['HTTP Response code is null']
      };
  }

  if (response.status != "200") {
      return {
          status : 418,
          headers : {"Content-Type":"application/json"},
          body : ["HTTP Response code is not 200. This is " + apiRes.status + " body : " + apiRes.body]
      };
  }

  return null;
}
