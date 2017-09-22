/**
 * Personium
 * Copyright 2016 FUJITSU LIMITED
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/*
 * Replace the "***" with a valid Personium domain name
 */
var deployedDomainName = "demo.personium.io";

/*
 * Replace the "***" with a valid cell name where this service is running.
 */
var deployedCellName = "dixonsiu";


/* 
 * Set up necessary URLs for this service.
 * Current setup procedures only support creating a cell within the same Personium server.
 */
var jqueryValidateMessage_ja = "https://cdnjs.cloudflare.com/ajax/libs/jquery-validate/1.17.0/localization/messages_ja.js";
var rootUrl = ["https://", deployedDomainName, "/"].join("");
var targetRootUrl = rootUrl;
var serviceCellUrl = [rootUrl, deployedCellName, "/"].join("");
var createCellApiUrl = [serviceCellUrl, "__/unitService/user_cell_create"].join("");
var defaultProfileUrl = [serviceCellUrl, "__/defaultProfile.json"].join("");
var defaultProfile = {};
var HomeApplication = {
    cellUrl: "https://demo.personium.io/HomeApplication/",
    disabledList: ["App"],
    barfilePath: function() {
        return this.cellUrl + '__/HomeApplication.bar';
    },
    targetBoxPath: function() {
        return targetRootUrl + $("#cell_name").val() + '/io_personium_demo_HomeApplication/';
    },
    loginUrl: function() {
        return targetRootUrl + $("#cell_name").val() + '/io_personium_demo_HomeApplication/src/login.html';
    },
    enableInstall: function() {
        return !(_.contains(this.disabledList, getSelectedCellType()));
    },
    installHomeApplicationBox: function(token) {
        var oReq = new XMLHttpRequest(); // binary
        oReq.open("GET", this.barfilePath());
        oReq.responseType = "arraybuffer";
        oReq.setRequestHeader("Content-Type", "application/zip");
        oReq.onload = function(e) {
            var arrayBuffer = oReq.response;
            var view = new Uint8Array(arrayBuffer);
            var blob = new Blob([view], {"type":"application/zip"});
            $.ajax({
                type: "MKCOL",
                url: HomeApplication.targetBoxPath(),
                data: blob,
                processData: false,
                headers: {
                    'Authorization':'Bearer ' + token, // createCellAPI's token
                    'Content-type':'application/zip'
                }
            }).done(function(data) {
                // domesomething
            }).fail(function(data) {
                var res = JSON.parse(data.responseText);
                alert("An error has occurred.\n" + res.message.value);
            });
        }
        oReq.send();
    }
};

$(document).ready(function(){
    i18next
        .use(i18nextXHRBackend)
        .use(i18nextBrowserLanguageDetector)
        .init({
            fallbackLng: 'en',
            debug: true,
            backend: {
                // load from i18next-gitbook repo
                loadPath: './locales/{{lng}}/wizard.json',
                crossDomain: true
            }
        }, function(err, t) {
            initJqueryI18next();
            
            // define your own additionalCallback for each App/screen
            if ((typeof additionalCallback !== "undefined") && $.isFunction(additionalCallback)) {
                additionalCallback();
            }

            updateContent();

            // Initialize profile
            initializeProfile(defaultProfileUrl);

            // Special routine for reshowing the rendered contents (originally hidden bare HTML)
            $('#loading_spinner').hide();
            $('#wizardProfile').css('visibility', 'visible');
        });
});

initJqueryI18next = function() {
    // for options see
    // https://github.com/i18next/jquery-i18next#initialize-the-plugin
    jqueryI18next.init(i18next, $, {
        useOptionsAttr: true
    });
};

updateContent = function() {
    // start localizing, details:
    // https://github.com/i18next/jquery-i18next#usage-of-selector-function
    $('[data-i18n]').localize();

    /*
     * Activate the tooltips after i18next has translated the title attributes
     */
    $('[rel="tooltip"]').tooltip();
};

changeLanaguage = function(lang) {
    i18next.changeLanguage(lang, function() {
        setMessagesLanguage(lang);
        updateContent();
    });
}

configureJQueryValidation = function() {
    createExtraRules();

    setMessagesLanguage(i18next.language);

    configureTarget();
};

createExtraRules = function() {
    $.validator.addMethod("cellName", function(value, element) {
        return this.optional(element) || /^[a-zA-Z0-9][a-zA-Z0-9-_]{0,127}$/.test(value);
    }, i18next.t("wizard_pane.cell_info.cell_name.spec"));
    $.validator.addMethod("adminName", function(value, element) {
        return this.optional(element) || /^[a-zA-Z0-9][a-zA-Z0-9-_!$*=^`{|}~.@]{0,127}$/.test(value);
    }, i18next.t("wizard_pane.account.admin.name.spec"));
    $.validator.addMethod("adminPassword", function(value, element) {
        return this.optional(element) || /^[a-zA-Z0-9-_]{0,}$/.test(value);
    }, i18next.t("wizard_pane.account.admin.password.spec"));
};

setMessagesLanguage = function(lang) {
    switch(lang) {
    case "ja":
    case "ja-JP":
        setMessagesLanguage_ja();
        break;
    default:
        restoreDefaultValidatorMessages();
    }
};

setMessagesLanguage_ja = function() {
    /*
     * Translated default messages for the jQuery validation plugin.
     * Locale: JA (Japanese; 日本語)
     */
    $.extend(
        $.validator.messages,
        {
            required: "このフィールドは必須です。",
            remote: "このフィールドを修正してください。",
            email: "有効なEメールアドレスを入力してください。",
            url: "有効なURLを入力してください。",
            date: "有効な日付を入力してください。",
            dateISO: "有効な日付（ISO）を入力してください。",
            number: "有効な数字を入力してください。",
            digits: "数字のみを入力してください。",
            creditcard: "有効なクレジットカード番号を入力してください。",
            equalTo: "同じ値をもう一度入力してください。",
            extension: "有効な拡張子を含む値を入力してください。",
            maxlength: $.validator.format( "{0} 文字以内で入力してください。" ),
            minlength: $.validator.format( "{0} 文字以上で入力してください。" ),
            rangelength: $.validator.format( "{0} 文字から {1} 文字までの値を入力してください。" ),
            range: $.validator.format( "{0} から {1} までの値を入力してください。" ),
            step: $.validator.format( "{0} の倍数を入力してください。" ),
            max: $.validator.format( "{0} 以下の値を入力してください。" ),
            min: $.validator.format( "{0} 以上の値を入力してください。" ),
            cellName: i18next.t("wizard_pane.cell_info.cell_name.spec"),
            adminName: i18next.t("wizard_pane.account.admin.name.spec"),
            adminPassword: i18next.t("wizard_pane.account.admin.password.spec")
        }
    );
};

restoreDefaultValidatorMessages = function() {
    $.extend(
        $.validator.messages,
        {
            required: "This field is required.",
            remote: "Please fix this field.",
            email: "Please enter a valid email address.",
            url: "Please enter a valid URL.",
            date: "Please enter a valid date.",
            dateISO: "Please enter a valid date (ISO).",
            number: "Please enter a valid number.",
            digits: "Please enter only digits.",
            equalTo: "Please enter the same value again.",
            maxlength: $.validator.format( "Please enter no more than {0} characters." ),
            minlength: $.validator.format( "Please enter at least {0} characters." ),
            rangelength: $.validator.format( "Please enter a value between {0} and {1} characters long." ),
            range: $.validator.format( "Please enter a value between {0} and {1}." ),
            max: $.validator.format( "Please enter a value less than or equal to {0}." ),
            min: $.validator.format( "Please enter a value greater than or equal to {0}." ),
            step: $.validator.format( "Please enter a multiple of {0}." ),
            cellName: i18next.t("wizard_pane.cell_info.cell_name.spec"),
            adminName: i18next.t("wizard_pane.account.admin.name.spec"),
            adminPassword: i18next.t("wizard_pane.account.admin.password.spec")
        }
    );
};

configureTarget = function() {
    $validator = $('.wizard-card form').validate({
        rules: {
            cell_name: {
                required: true,
                cellName: true,
                rangelength: [1, 128]
            },
            admin_name: {
                required: true,
                adminName: true,
                rangelength: [1, 128]
                
            },
            admin_password: {
                required: true,
                adminPassword: true,
                rangelength: [6, 32]
            },
            admin_confirm_password: {
                required: true,
                equalTo: "#admin_password",
                adminPassword: true,
                rangelength: [6, 32]
            },
            name: {
                required: true,
                adminName: true,
                rangelength: [1, 128]
            },
            password: {
                required: true,
                adminPassword: true,
                rangelength: [6, 32]
            },
            confirm_password: {
                required: true,
                equalTo: "#password",
                adminPassword: true,
                rangelength: [6, 32]
            },
            DisplayName: {
                required: true,
                rangelength: [1, 128]
            }
        },
        submitHandler: function(form) {
            console.log("submit");
            createCell();
            return false;
        }
    });
};

checkCellExist = function (tab, navigation, nextIndex) {
    console.log("checkCellExist");
    $('#cell_name_spinner').show();
    let cellName = $("#cell_name").val();
    if (cellName) {
        getCell(cellName).done(function(data, status, xhr) {
            showErrorsCellName();
        }).fail(function(data) {
            if (getSelectedCellType() == "App") {
                $('#app_account').show();
            } else {
                $('#app_account').hide();
            }
            navigation.find('li:has([data-toggle="tab"])' + ':eq('+nextIndex+') a').tab('show');
        }).always(function(){
            $('#cell_name_spinner').hide();
        });
    }
};

getCell = function (cellName) {
    return $.ajax({
        type: "GET",
        url: targetRootUrl + cellName + "/", // Target Personium URL (can be another Personium server)
        headers:{
            'Accept':'application/xml'
        }
    });
};

/*
 * Need to tell jQuery Validation that the field is invalid so that
 * $validator.numberOfInvalids() can return the correct count.
 */
showErrorsCellName = function() {
    $validator.invalid.cell_name = true;
    $validator.showErrors({
        "cell_name": i18next.t("wizard_pane.cell_info.cell_name.cell_already_exist")
    });
};

getSelectedCellType = function () {
    return $("input[type='radio'][name='cell_type']:checked").val();
};

initializeProfile = function(defaultProfileUrl) {
    getProfile(defaultProfileUrl).done(function(profData) {
        defaultProfile = _.clone(profData);
        $('#DisplayName').val(profData.DisplayName);
    });
};

getProfile = function(url) {
    return $.ajax({
        type: "GET",
        url: url,
        dataType: 'json',
        headers: {'Accept':'application/json'}
    });
};

createCell = function () {
    createCellAPI().done(function(data) {
        let access_token = data.access_token;
        let cellProfileUrl = [
            targetRootUrl,
            $("#cell_name").val(),
            '/__/profile.json'
        ].join("");

        setMainBoxACL(access_token).done(function() {
            openCommonDialog('resultDialog.title', 'create_form.msg.info.cell_created');
        }).fail(function() {
            openCommonDialog('resultDialog.title', 'create_form.msg.info.private_profile_cell_created');
        }).always(function() {
            uploadDefaultProfile(access_token, cellProfileUrl);

            if (HomeApplication.enableInstall()) {
                HomeApplication.installHomeApplicationBox(access_token);
            };

            if (getSelectedCellType() == "App") {

                let appUserInfo = $('<p>', {
                    style: "word-wrap: break-word;"
                });

                restCreateAccountAPI(access_token).done(function() {
                    console.log("Succeeded in created: " + $('#name').val());
                    appUserInfo.attr('data-i18n', 'create_form.msg.info.app_user_created');
                }).fail(function(data) {
                    let res = JSON.parse(data.responseText);
                    console.log("Failed to created: " + $('#name').val());
                    console.log("An error has occurred.\n" + res.message.value);
                    appUserInfo.attr('data-i18n', 'create_form.msg.error.fail_to_create_app_user');
                }).always(function() {
                    displayCellInfo(appUserInfo);
                });
            } else {
                displayCellInfo();
            }
        });
    }).fail(function() {
        openCommonDialog('resultDialog.title', 'create_form.msg.error.fail_to_create_cell');
    });
};

createCellAPI = function () {
    return $.ajax({
        type:"POST",
        url: createCellApiUrl, // unitService engine URL (where this service is deployed)
        data: {
            'cellName': $("#cell_name").val(),
            'accName': $("#admin_name").val(),
            'accPass': $("#admin_password").val()
        },
        headers: {
            'Accept':'application/json'
        }
    });
};

setMainBoxACL = function (token) {
    var cellName = $("#cell_name").val();
    return $.ajax({
        type: "ACL",
        url: targetRootUrl + cellName + "/__/", // Target Personium URL (can be another Personium server)
        data: "<?xml version=\"1.0\" encoding=\"utf-8\" ?><D:acl xmlns:p=\"urn:x-personium:xmlns\" xmlns:D=\"DAV:\" xml:base=\"" + rootUrl + cellName + "/__role/__/\"><D:ace><D:principal><D:all/></D:principal><D:grant><D:privilege><p:read/></D:privilege></D:grant></D:ace></D:acl>",
        headers: {
            'Accept':'application/json',
            'Authorization':'Bearer ' + token
        }
    });
};

uploadDefaultProfile = function(token, cellProfileUrl) {
    let tempProfile = _.clone(defaultProfile);
    let cellProfile = $.extend(
        true,
        tempProfile,
        {
            "CellType": getSelectedCellType(),
            "DisplayName": $('#DisplayName').val(),
            "Description": $('#Description').val(),
            "Image": _.isEmpty($('#ProfileImageName').val()) ? "" : $('#wizardPicturePreview').attr('src'),
            "ProfileImageName": $('#ProfileImageName').val()
        }
    );

    $.ajax({
        type: "PUT",
        url: cellProfileUrl,
        data: JSON.stringify(cellProfile),
        headers: {'Accept':'application/json',
                  'Authorization':'Bearer ' + token}
    })
};

restCreateAccountAPI = function(token) {
    let createAccountRESTURL = [
        targetRootUrl,
        $("#cell_name").val(),
        '/__ctl/Account'
    ].join("");

    let json = {
        'Name': $("#name").val()
    }

    return $.ajax({
        type: "POST",
        url: createAccountRESTURL,
        data: JSON.stringify(json),
        headers: {
            'Authorization':'Bearer ' + token, // get from createCell
            'X-Personium-Credential': $("#password").val()
        }
    });
};

displayCellInfo = function(appUserInfo) {
    displayCellName();

    displayCellType();

    displayAdminName();

    if ((typeof appUserInfo !== "undefined") && _.isObject(appUserInfo)) {
        displayAppAccountName(appUserInfo);
    };

    if (HomeApplication.enableInstall()) {
        displayLoginURL();
        displayQRCode();
    };

    $("#modal-common .modal-body [data-i18n]").localize();
    new Clipboard('#modal-common .row .btn');
    $('#modal-common .modal-body [rel="tooltip"]').tooltip({
        trigger: "hover"
    });
};

displayCellName = function() {
    displayRow('[html]wizard_pane.cell_info.cell_name.confirm_label', $("#cell_name").val());
};

displayCellType = function() {
    displayRow('[html]wizard_pane.cell_info.cell_type.confirm_label', getSelectedCellType());
};

displayAdminName = function() {
    displayRow('[html]wizard_pane.account.admin.name.confirm_label', $('#admin_name').val());
};

displayAppAccountName = function(appUserInfo) {
    displayRow('[html]wizard_pane.account.app.name.confirm_label', $('#name').val());
};

displayRow = function(labelKey, value) {
    let aDiv = $('<div>', {
        class: 'row'
    });
    let leftDiv = $('<div>', {
        class: 'col-sm-3 col-sm-offset-1 left',
        'data-i18n': labelKey
    });
    let rightDiv = $('<div>', {
        class: 'col-sm-7 right',
        style: 'overflow: hidden;text-overflow: ellipsis;'
    }).html(value);

    aDiv.append($(leftDiv), $(rightDiv));

    $("#modal-common .modal-body").append($(aDiv));
};

displayLoginURL = function(appUserInfo) {
    displayRowWithCopyToCliboard('[html]wizard_pane.cell_info.home_app_url.confirm_label', HomeApplication.loginUrl());
};

displayRowWithCopyToCliboard = function(labelKey, value) {
    let aDiv = $('<div>', {
        class: 'row'
    });
    let leftDiv = $('<div>', {
        class: 'col-sm-3 col-sm-offset-1 left',
        style: 'height: 42px', // button's height is 40px + 2px border
        'data-i18n': labelKey
    });
    let rightDiv = $('<div>', {
        id: 'foo',
        class: 'col-sm-6 right',
        style: 'height: 42px;overflow: hidden;text-overflow: ellipsis;'
    }).html(value);
    let btnDiv = $('<div>', {
        class: 'col-sm-1 clipboardBtn'
    });
    let aBtn = $('<button>', {
        id: 'copy2Clipboard',
        class: 'btn',
        rel: 'tooltip',
        'data-i18n': '[title]wizard_pane.buttons.copy2Clipboard.hover;[data-original-title]wizard_pane.buttons.copy2Clipboard.hover',
        'data-clipboard-target': "#foo"
    }).append($('<i>', {
        class: "fa fa-clipboard"
    }));
    aBtn
        .click(function(){
            $(this)
                .attr('data-i18n', '[title]wizard_pane.buttons.copy2Clipboard.copied;[data-original-title]wizard_pane.buttons.copy2Clipboard.copied')
                .localize()
                .tooltip('fixTitle')
                .tooltip('setContent')
                .tooltip('show');
        }).blur(function(){
            console.log('blur');
            $(this)
                .tooltip('hide')
                .attr('data-i18n', '[title]wizard_pane.buttons.copy2Clipboard.hover;[data-original-title]wizard_pane.buttons.copy2Clipboard.hover')
                .localize()
                .tooltip('fixTitle')
                .tooltip('setContent');
        });
    btnDiv.append($(aBtn));

    aDiv.append($(leftDiv), $(rightDiv), $(btnDiv));

    $("#modal-common .modal-body").append($(aDiv));
};

displayQRCode = function() {
    let aImg = createQRCodeImg(HomeApplication.loginUrl());
    let aDiv = $('<div>', {
        class: 'row'
    });
    let leftDiv = $('<div>', {
        class: 'col-sm-3 col-sm-offset-1 left',
        style: 'height: 202px', // QR Code's height is 200px + 2px border
        'data-i18n': '[html]wizard_pane.cell_info.home_app_url.qr_code'
    });
    let rightDiv = $('<div>', {
        class: 'col-sm-7 right',
    }).append($(aImg));
    
    aDiv.append($(leftDiv), $(rightDiv));

    $("#modal-common .modal-body").append($(aDiv));
};

createQRCodeImg = function(url) {
    let googleAPI = 'https://chart.googleapis.com/chart?cht=qr&chs=177x177&chl=';
    let qrURL = googleAPI + url;
    let aImg = $('<img>', {
        src: qrURL,
        alt: url,
        style: 'width: 200px; height: 200px; padding: 1px;'
    })

    return aImg;
};

appendCommonDialog = function() {
    var html = [
        '<div id="modal-common" class="modal fade" role="dialog" data-backdrop="static">',
            '<div class="modal-dialog modal-lg">',
                '<div class="modal-content">',
                    '<div class="modal-header login-header">',
                        '<h4 class="modal-title"></h4>',
                    '</div>',
                    '<div class="modal-body"></div>',
                    '<div class="modal-footer">',
                        '<input type="button" class="btn btn-fill btn-warning btn-wd btn-sm" id="b-common-ok" data-i18n="[value]label.ok"></button>',
                    '</div>',
               '</div>',
           '</div>',
        '</div>'
    ].join("");
    $("body").append(html);
    $('#b-common-ok').on('click', function() { 
        closeTab();
    });
};

openCommonDialog = function(title_key, message_key) {
    $("#modal-common .modal-title")
        .attr('data-i18n', title_key);

    let aP = $('<p>', {
        style: "word-wrap: break-word;",
        'data-i18n': '[html]' + message_key
    }).appendTo("#modal-common .modal-body");

    $("#modal-common")
        .localize()
        .modal('show');
};

/*
 * clean up data and close tab/window
 */
closeTab = function() {
    // define your own cleanupData for each App/screen
    if ((typeof cleanUpData !== "undefined") && $.isFunction(cleanUpData)) {
        cleanUpData();
    }
    $("#modal-common .modal-body").empty();
    $("#modal-common").modal('hide');
};

cleanUpData = function() {
    $('#cell_name').val("");
    $('input:radio[name=cell_type]:first').click();
    $("input[type='password']").val("");
    $('form a:first').tab('show');
}
