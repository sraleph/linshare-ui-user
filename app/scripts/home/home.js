/**
 * HomeController Controller
 * @namespace linshareUiUserApp
 */
(function() {
  'use strict';

  angular
    .module('linshareUiUserApp')
    .controller('HomeController', homeController);

  homeController.$inject = [
    '_',
    '$q',
    '$scope',
    '$stateParams',
    '$timeout',
    '$translate',
    '$translatePartialLoader',
    'functionalities',
    'languageService',
    'lsAppConfig',
    'welcomeMessageRestService',
    'user',
  ];

  /**
   * @namespace homeController
   * @desc Application home management system controller
   * @memberOf linshareUiUserApp
   */
  function homeController(
    _,
    $q,
    $scope,
    $stateParams,
    $timeout,
    $translate,
    $translatePartialLoader,
    functionalities,
    languageService,
    lsAppConfig,
    welcomeMessageRestService,
    user
  )
  {
    const LANG_CONVERTER = {
      ENGLISH: {
        lang: 'ENGLISH',
        key: lsAppConfig.lang.en
      },
      FRENCH: {
        lang: 'FRENCH',
        key: lsAppConfig.lang.fr
      },
      VIETNAMESE: {
        lang: 'VIETNAMESE',
        key: lsAppConfig.lang.vi
      }
      SPANISH: {
        lang: 'SPANISH',
        key: lsAppConfig.lang.es
      }
    };

    $scope.lsAppConfig = lsAppConfig;

    activate();

    ////////////

    /**
     * @name activate
     * @desc Activation function of the controller, launch at every instantiation
     * @memberOf linshareUiUserApp.homeController
     */
    // TODO : IAB externalize fab into directive
    function activate() {
      $scope.cards = {
        myFilesSpace: false,
        uploadShare: false,
        uploadGroup: false,
        uploadRequest: false
      };

      $scope.cards.myFilesSpace = user.canUpload;
      $scope.cards.uploadGroup = functionalities.WORK_GROUP.enable;
      $scope.cards.uploadShare = ($scope.cards.myFilesSpace || $scope.cards.uploadGroup);
      $scope.cards.receivedShare = !functionalities.ANONYMOUS_URL__HIDE_RECEIVED_SHARE_MENU.enable;
      $scope.fabButton = {
        toolbar: {
          activate: true,
          label: 'BOUTON_ADD_FILE_TITLE'
        },
        actions: [{
          action: 'documents.upload({from: lsAppConfig.mySpacePage, openSidebar: true})',
          label: 'ADD_FILES_DROPDOWN.UPLOAD_AND_SHARE',
          icon: 'ls-share-file',
          flowBtn: true
        }, {
          action: 'documents.files',
          label: 'ADD_FILES_DROPDOWN.UPLOAD_IN_MY_FILES',
          icon: 'ls-upload-fill',
          flowBtn: true
        }, {
          action: null,
          label: 'ADD_FILES_DROPDOWN.UPLOAD_IN_WORKGROUP',
          icon: 'ls-shared-space disabled-work-in-progress',
          disabled: true,
          hide: lsAppConfig.linshareModeProduction
        }]
      };

      $translatePartialLoader.addPart('home');

      getWelcomeMessage();
    }

    function getWelcomeMessage() {
      welcomeMessageRestService.getList().then(function(data) {
        var langObject = _.find(LANG_CONVERTER, {
          key: $translate.use()
        });
        var lang = langObject ? langObject.lang : 'ENGLISH';
        $scope.welcomeMessage = data[0][lang];
      });
    }
  }
})();
