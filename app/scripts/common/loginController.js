/**
 * loginController Controller
 * @namespace linshareUiUserApp
 */
(function() {
  'use strict';

  angular
    .module('linshareUiUserApp')
    .controller('loginController', loginController);

  loginController.$inject = ['$translate', 'authenticationRestService', 'languageService', 'lsAppConfig',
    'toastService'
  ];

  /**
   * @namespace loginController
   * @desc Manage login page
   * @memberOf linshareUiUserApp
   */
  function loginController($translate, authenticationRestService, languageService, lsAppConfig, toastService) {
    /* jshint validthis: true */
    var loginVm = this;

    loginVm.changeLoginLanguage = changeLoginLanguage;
    loginVm.email = '';
    loginVm.lsAppConfig = lsAppConfig;
    loginVm.password = '';
    loginVm.submitForm = submitForm;

    activate();

    ////////////

    /**
     * @name activate
     * @desc Activation function of the controller, launch at every instantiation
     * @memberOf linshareUiUserApp.loginController
     */
    function activate() {
      var locale = languageService.getLocale();
      loginVm.loginLocale = splitLocale(locale);

      loginVm.inputType = lsAppConfig.loginWithMailOnly ? 'email' : 'text';
    }

    /**
     * @name splitLocale
     * @desc Split locale's string
     * @param {String} locale - location language value
     * @returns {Object} language details
     * @memberOf linshareUiUserApp.loginController
     */
    function splitLocale(locale) {
      locale = locale.split('-');
      var language = locale[0];
      var country;
      if (locale.length > 1) {
        country = locale[1].toLowerCase();
      }
      return {
        language: language,
        country: country
      };
    }

    /**
     * @name submitForm
     * @desc Submit login form to login user
     * @memberOf linshareUiUserApp.loginController
     */
    function submitForm() {
      authenticationRestService.login(loginVm.email, loginVm.password)
        .then(function(user) {
          toastService.info({
            key: 'LOGIN.NOTIFICATION.SUCCESS',
            params: {
              firstName: user.firstName
            }
          });
        })
        .catch(function(error) {
          switch (error.status) {
            case 401:
              toastService.error({key: 'LOGIN.NOTIFICATION.ERROR'});
              break;
          }
        });
    }

    /**
     * @name changeLoginLanguage
     * @desc Change language of login page
     * @param {String} lang - Language selected
     * @memberOf linshareUiUserApp.loginController
     */
    function changeLoginLanguage(lang) {
      languageService.changeLocale(lang)
        .then(function() {
          loginVm.loginLocale = splitLocale(lang);
        });
    }
  }
})();
