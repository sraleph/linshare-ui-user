/**
 * lsLeftSidebarController Controller
 * @namespace linshareUiUserApp
 */
(function() {
  'use strict';

  angular
    .module('linshareUiUserApp')
    .controller('lsLeftSidebarController', lsLeftSidebarController);

  lsLeftSidebarController.$inject = ['$http', '$timeout', 'authenticationRestService', 'MenuService'];

  /**
   * @namespace lsLeftSidebarController
   * @desc Manage left sidebar's controller
   * @memberOf linshareUiUserApp
   */
  function lsLeftSidebarController($http, $timeout, authenticationRestService, MenuService) {
    /* jshint validthis: true */
    var lsLeftSidebarVm = this;
    lsLeftSidebarVm.$timeout = $timeout;
    lsLeftSidebarVm.changeColor = changeColor;
    lsLeftSidebarVm.productVersion = 'dev';
    lsLeftSidebarVm.tabs = {};

    activate();

    ////////////

    /**
     * @name activate
     * @desc Activation function of the controller, launch at every instantiation
     * @memberOf linshareUiUserApp.lsLeftSidebarController
     */
    function activate() {
      lsLeftSidebarVm.tabs = MenuService.getAvailableTabs();
      getCoreVersion();
      getProductVersion();
    }

    /**
     * @name changeColor
     * @desc Change color of mouse hovered menu
     * @param {Object} link - tab details
     * @param {String} color - color to apply
     * @memberOf linshareUiUserApp.lsLeftSidebarController
     */
    function changeColor(link, color) {
      if(link.disabled === false) {
        lsLeftSidebarVm.customColor = {'color': color};
      }
    }

    /**
     * @name getCoreVersion
     * @desc Get LinShare core version
     * @memberOf linshareUiUserApp.lsLeftSidebarController
     */
    function getCoreVersion() {
      authenticationRestService.version().then(function(data) {
        lsLeftSidebarVm.coreVersion = data.version;
      });
    }

    /**
     * @name getProductVersion
     * @desc Get LinShare product version
     * @memberOf linshareUiUserApp.lsLeftSidebarController
     */
    function getProductVersion() {
      $http.get('/about.json').success(function(data) {
        lsLeftSidebarVm.productVersion = data.version;
      });
    }
  }
})();
