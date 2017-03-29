/**
 * FilterBoxController Controller
 * @namespace linshare.component
 */
(function() {
  'use strict';

  angular
    .module('linshare.components')
    .controller('FilterBoxController', FilterBoxController);

  FilterBoxController.$inject = ['$scope', '$timeout', '$translate', 'autocompleteUserRestService', 'lsAppConfig',
    'tableParamsService', 'unitService'
  ];

  /**
   * @namespace FilterBoxController
   * @desc Controller of the filtering component
   * @memberOf linshare.components
   */
  function FilterBoxController($scope, $timeout, $translate, autocompleteUserRestService, lsAppConfig,
                               tableParamsService, unitService) {
    const FR_DATE_FORMAT = lsAppConfig.date_fr_format;
    const EN_DATE_FORMAT = lsAppConfig.date_en_format;

    var filterBoxVm = this;
    filterBoxVm.unitService = unitService;
    filterBoxVm.filterBoxItemsInit = _.cloneDeep(filterBoxVm.filterBoxItems);
    filterBoxVm.autocompleteUserRestService = autocompleteUserRestService;
    filterBoxVm.clearParams = clearParams;
    filterBoxVm.formatLabel = formatLabel;
    filterBoxVm.format = $translate.use() === 'fr' ? FR_DATE_FORMAT : EN_DATE_FORMAT;
    filterBoxVm.maxDate = $scope.maxDate ? null : new Date();
    filterBoxVm.updateFilters = updateFilters;
    filterBoxVm.userRepresentation = userRepresentation;

    ////////////

    /**
     * @name clearParams
     * @desc Remove filter element
     * @memberOf linshare.components.FilterBoxController
     */
    function clearParams() {
      filterBoxVm.sizeStart = undefined;
      filterBoxVm.sizeEnd = undefined;
      filterBoxVm.dateStart = undefined;
      filterBoxVm.dateEnd = undefined;
      filterBoxVm.selectedContact = undefined;

      filterBoxVm.filterBoxItems = _.cloneDeep(filterBoxVm.filterBoxItemsInit);
      delete filterBoxVm.filterBoxTable.filter().sender;
      reloadTable();
    }

    /**
     * @name formatLabel
     * @desc Format representation of object user
     * @param {string} user - Object containing user information
     * @returns {string} Concatenation of string 'firstName' and 'lastName'
     * @memberOf linshare.components.FilterBoxController
     */
    function formatLabel(user) {
      if (!_.isUndefined(user)) {
        if (user.firstName !== '') {
          return user.firstName.concat(' ', user.lastName);
        }
      }
    }

    /**
     * @name updateFilters
     * @desc Update the filters to apply to the list of element in the table
     * @memberOf linshare.components.FilterBoxController
     */
    function updateFilters() {
      if (filterBoxVm.showUnit) {
        var sizeStart = filterBoxVm.sizeStart ?
          filterBoxVm.unitService.toByte(filterBoxVm.sizeStart, filterBoxVm.unitSize.value, false) : 0;
        var sizeEnd = filterBoxVm.sizeEnd ?
          filterBoxVm.unitService.toByte(filterBoxVm.sizeEnd, filterBoxVm.unitSize.value, false) : 999999999999;
      }
      if (filterBoxVm.showDateRange) {
        var dateStart = filterBoxVm.dateStart ?
          moment(filterBoxVm.dateStart) : moment('0000-01-01');
        var dateEnd = filterBoxVm.dateEnd ?
          moment(filterBoxVm.dateEnd).add('day', +1) : moment().add('day', +1);
      }

      filterBoxVm.filterBoxItems = _.filter(filterBoxVm.filterBoxItemsInit, function(item) {
        var sizeIsValid = true,
          dateIsValid = true;
        if (filterBoxVm.showUnit) {
          var size = item.size.toFixed(1);
          sizeIsValid = (size >= sizeStart && size <= sizeEnd);
        }
        if (filterBoxVm.showDateRange) {
          var date = filterBoxVm.dateType === '1' ? item.modificationDate : item.creationDate;
          dateIsValid = (date >= dateStart && date <= dateEnd);
        }
        return (sizeIsValid && dateIsValid);
      });

      if (filterBoxVm.showRecipients && !_.isUndefined(filterBoxVm.selectedContact)) {
        _.extend(filterBoxVm.filterBoxTable.filter(), {
          sender: {
            firstName: filterBoxVm.selectedContact.firstName,
            lastName: filterBoxVm.selectedContact.lastName,
            mail: filterBoxVm.selectedContact.mail
          }
        });
      } else {
        delete filterBoxVm.filterBoxTable.filter().sender;
      }

      reloadTable();
    }

    /**
     * @name reloadTable
     * @desc Reload the table
     * @memberOf linshare.components.FilterBoxController
     */
    function reloadTable() {
      tableParamsService.reloadTableParams(filterBoxVm.filterBoxItems).then(function(data) {
        var params = filterBoxVm.filterBoxTable._params;
        var valueShown = (filterBoxVm.filterBoxItems.slice((params.page - 1) * params.count, params.page *
          params.count));
        if (!_.isEqual(data.length, valueShown.length)) {
          $timeout(function() {
            reloadTable();
          }, 0);
        }
      });
    }

    /**
     * @name UserRepresentation
     * @desc Format the reprensation of a user in the sender field
     * @param {string} user - Object containing user information
     * @returns {string} Formatted reprensation of the user
     * @memberOf linshare.components.FilterBoxController
     */
    function userRepresentation(user) {
      if (_.isString(user)) {
        return user;
      }
      if (_.isObject(user)) {
        return '<span>' + user.firstName + ' ' + user.lastName + '</span> <span >' +
          ' <i class="zmdi zmdi-email"></i> &nbsp;' + user.mail + '</span>';
      }
    }
  }
})();
