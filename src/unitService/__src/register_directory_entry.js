function(request){
    var directoryUrl = 'https://demo.personium.io/app-uc-cell-creator-wizard/__/Cells/directory';
    var bodyAsString = request["input"].readAll();
    if (bodyAsString === "") {
      return {
             status : 400,
             headers : {"Content-Type":"application/json"},
             body : [JSON.stringify({
                'error': 'Request body is empty.'
             })]
      };
    }
    var params = dc.util.queryParse(bodyAsString);
 
    params.__id = params.url; // default is just Cell URL
    if (params.locale) {
        params.__id += '_' + params.locale;
    }

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
    //    headers = {"Accept": "text/plain"};
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

    // ********Create entry********
    var urlC = directoryUrl;
    var bodyC = JSON.stringify(params);
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

    return {
         status : 200,
         headers : {"Content-Type":"application/json"},
         body : [apiRes.body]
    };
}


