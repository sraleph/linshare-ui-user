'use strict';

/**
 * @ngdoc overview
 * @name linshare.share
 * @description
 *
 * This module has two services written
 * to make all http calls about sharing file.
 */
angular.module('linshare.share', ['restangular', 'ui.bootstrap', 'linshare.components'])

/**
 * @ngdoc service
 * @name linshare.share.service:LinshareShareService
 * @description
 *
 * Service to get and post all information about files shared by the user
 */
  .factory('LinshareShareService', function (Restangular, $log) {
    return {
      getMyShares: function () {
        $log.debug('LinshareShareService : getMyShares');
        return Restangular.all('shares').getList();
      },
      getShare: function(uuid) {
        $log.debug('LinshareShareService : getShare');
        return Restangular.one('shares', uuid).get();
      },
      shareDocuments: function (shareDocument) {
        $log.debug('LinshareShareService : shareDocuments');
        return Restangular.all('shares').post(shareDocument);
      },
      download: function(uuid) {
        $log.debug('LinshareShareService : downloadShare');
        return Restangular.one('shares', uuid).one('download').get();
      },
      downloadThumbnail: function(uuid) {
        $log.debug('LinshareShareService : downloadThumbnail');
        return Restangular.one('shares', uuid).one('thumbnail').get();
      },
      delete: function(uuid) {
        $log.debug('LinshareShareService : delete');
        return Restangular.one('shares', uuid).remove();
      },
      autocomplete: function(pattern) {
        $log.debug('FileService:autocomplete');
        return Restangular.all('autocomplete').one(pattern).get({type: 'SHARING'});
      }
    };
  })
  .factory('LinshareFunctionalityService', function(Restangular, $log, $q) {
    var allFunctionalities = {};
    var deferred = $q.defer();
    return {
      getAll: function() {
        $log.debug('Functionality:getAll');
        return Restangular.all('functionalities').getList().then(function(allfunc) {
          angular.forEach(allfunc, function(elm) {
            allFunctionalities[elm.identifier] = elm;
          });
          deferred.resolve(allFunctionalities);
          return deferred.promise;
        });
      },
      get: function(funcId) {
        $log.debug('Functionality:get');
        return Restangular.all('functionalities').one(funcId).get();
      }
    };
  })

  .factory('ShareObjectService', function($log, LinshareFunctionalityService) {

    var
      recipients = [],
      documents = [],
      mailingListUuid = [],
      functionalities = {},
      expirationDate = {enable: false, value: '', userCanOverride: false},
      creationAcknowledgement = {enable: false, value: '', userCanOverride: false},
      enableUSDA = {},
      notificationDateForUSDA = {enable: false, value: '', userCanOverride: false},
      secured = {enable: false, value: '', userCanOverride: false},
      submitShare = false;


    LinshareFunctionalityService.getAll().then(function(func) {
      //Getting functionalities in map format
      angular.forEach(func, function(elm) {
        functionalities[elm.identifier] = elm;
      });

      //if share_expiration is activated, then set default value
      if(functionalities.SHARE_EXPIRATION.enable) {
        expirationDate.enable = true;
        expirationDate.value = moment().endOf('day').add(functionalities.SHARE_EXPIRATION.value,
          functionalities.SHARE_EXPIRATION.unit).subtract(1, 'd');
        expirationDate.userCanOverride = functionalities.SHARE_EXPIRATION.canOverride
      }

      //if creationAcknowledgement is activated, then set default value
      if(functionalities.SHARE_CREATION_ACKNOWLEDGEMENT_FOR_OWNER.enable) {
        creationAcknowledgement.enable = true;
        creationAcknowledgement.value = functionalities.SHARE_CREATION_ACKNOWLEDGEMENT_FOR_OWNER.value;
        creationAcknowledgement.userCanOverride = functionalities.SHARE_CREATION_ACKNOWLEDGEMENT_FOR_OWNER.canOverride;
      }

      if(functionalities.UNDOWNLOADED_SHARED_DOCUMENTS_ALERT.enable) {
        enableUSDA.enable = true;
        enableUSDA.value = functionalities.UNDOWNLOADED_SHARED_DOCUMENTS_ALERT.value;
        enableUSDA.userCanOverride = functionalities.UNDOWNLOADED_SHARED_DOCUMENTS_ALERT.canOverride;
      }

      if(functionalities.UNDOWNLOADED_SHARED_DOCUMENTS_ALERT__DURATION.enable) {
        notificationDateForUSDA.enable = true;
        notificationDateForUSDA.value = moment().add(functionalities.UNDOWNLOADED_SHARED_DOCUMENTS_ALERT__DURATION.value,
        'days');
        notificationDateForUSDA.userCanOverride = functionalities.UNDOWNLOADED_SHARED_DOCUMENTS_ALERT__DURATION.canOverride;
      }

      if(functionalities.ANONYMOUS_URL.enable) {
        secured.enable = true;
        secured.value = functionalities.ANONYMOUS_URL.value;
        secured.userCanOverride = functionalities.ANONYMOUS_URL.canOverride;
      }
    });


    function shareObjectForm() {

      this.secured = secured;
      this.creationAcknowledgement = creationAcknowledgement;

      this.expirationDate = expirationDate;
      this.enableUSDA = enableUSDA;
      this.notificationDateForUSDA = notificationDateForUSDA;

      this.sharingNote = '';
      this.subject = '';
      this.message = '';

      this.asyncShare = false;
      this.setAsyncShare = function(state) {
        self.asyncShare = state;
      };

      this.flowObjectFiles = {};

      var self = this;

      this.addRecipient = function(contact) {
        var exists = false;
        if(contact.type === 'ListAutoCompleteResultDto') {
          angular.forEach(mailingListUuid, function(element) {
            if(element.identifier === contact.identifier) {
              exists = true;
              $log.info('The list ' + contact.listName + ' is already in the mailinglist');
            }
          });
          if (!exists) {
            mailingListUuid.push(contact.identifier);
          }
        } else if(contact.type === 'UserAutoCompleteResultDto') {
          angular.forEach(recipients, function (elem) {
            if (elem.mail === contact.mail && elem.domain === contact.domain) {
              exists = true;
              $log.info('The user ' + contact.mail + ' is already in the recipients list');
            }
          });
          if (!exists) {
            recipients.push(_.omit(contact, 'restrictedContacts', 'type', 'display', 'identifier'));
          }
        }
      };

      this.removeRecipient = function(index) {
        recipients.splice(index, 1);
      };

      this.removeMailingList = function(index) {
        mailingListUuid.splice(index, 1);
      };

      this.addDocuments = function (documentList) {
        angular.forEach(documentList, function (doc) {
          documents.push(doc.uuid);
        });
      };

      this.getFormObj = function() {
        return {
          recipients: recipients,
          documents: documents,
          mailingListUuid: mailingListUuid,
          secured: secured.value,
          creationAcknowledgement: creationAcknowledgement.value,
          expirationDate: expirationDate.value,
          enableUSDA: enableUSDA.value,
          notificationDateForUSDA: notificationDateForUSDA.value,
          sharingNote: self.sharingNote,
          subject: self.subject,
          message: self.message
        }
      };

      this.getRecipients = function() {
        return recipients;
      };

      this.getDocuments = function() {
        return documents;
      };

      this.getMailingListUuid = function() {
        return mailingListUuid;
      };

      this.isValid = function() {
        return documents.length > 0 && (recipients.length || mailingListUuid.length > 0);
      }
    }
    return shareObjectForm;
  })


/**
 * @ngdoc controller
 * @name linshare.share.controller:LinshareShareController
 * @description
 *
 * The controller to manage shared documents
 */
  .controller('LinshareShareController', function($scope, $filter, NgTableParams, sharedDocumentsList) {
    $scope.tableParams = new NgTableParams({
      page: 1,
      sorting: {modificationDate: 'desc'},
      count: 20
    }, {
      getData: function($defer, params) {
        var files =  params.sorting() ? $filter('orderBy')(sharedDocumentsList, params.orderBy()) : sharedDocumentsList;
        params.total(files.length);
        $defer.resolve(files.slice((params.page() - 1) * params.count(), params.page() * params.count()));
      }
    });
  })

  .controller('LinshareShareActionController', function($scope, LinshareShareService, $log, $stateParams, growlService, $translate) {

    //Share Object
    $scope.share = {
      recipients: [],
      documents: []
    };

    $translate('GROWL_ALERT.SHARE').then(function(translations) {
      $scope.growlMsgShareSuccess = translations;
    });

    $scope.selectedContact = {};
    $scope.submitShare = function(shareCreationDto) {
      angular.forEach($scope.selectedDocuments, function(doc) {
        shareCreationDto.documents.push(doc.uuid);
      });
      if ($scope.selectedContact.length > 0) {
        shareCreationDto.recipients.push({mail: $scope.selectedContact});
      }
      LinshareShareService.shareDocuments(shareCreationDto.getFormObj()).then(function() {
        growlService.notifyTopRight($scope.growlMsgShareSuccess, 'success');
        $scope.$emit('linshare-upload-complete');
        $scope.mactrl.sidebarToggle.right = false;
        angular.element('tr').removeClass('info');
        $scope.initSelectedDocuments();
      });
    };

    $scope.filesToShare = $stateParams.selected;
    })
    .controller('LinshareAdvancedShareController', function($scope, $log, LinshareShareService, growlService, $translate) {

    $translate('GROWL_ALERT.SHARE').then(function(translations) {
      $scope.growlMsgShareSuccess = translations;
    });

    $scope.submitShare = function(shareCreationDto, now) {
      if(now) {
        LinshareShareService.shareDocuments(shareCreationDto.getFormObj()).then(function() {
          growlService.notifyTopRight($scope.growlMsgShareSuccess, 'success');
          $scope.$emit('linshare-upload-complete');
          $scope.mactrl.sidebarToggle.right = false;
          angular.element('tr').removeClass('info');
          $scope.initSelectedDocuments();
        }, function(errorData) {
          growlService.notifyTopRight(errorData.statusText, 'danger');
        });
      } else {
        shareCreationDto.setAsyncShare(!now);
      }
    };
  })
  .controller('LinshareAdvancedShareController', function($scope) {
    angular.forEach($scope.filesToShare, function(doc) {
      $scope.share.documents.push(doc.uuid);
    });
    $scope.id = 1;
    var dropDownIsOpen = false;
    // list - upon clicking on any contact list item, it is removed
    $scope.removeItem = function($event) {
      var currItem = $event.currentTarget;
      $(currItem).parent().parent().css("display", "none");
    };

    // pop up :  save recipients to a list
    // once the  : "save as list" button is clicked it sets the field to focus
    $scope.toggled = function() {
      dropDownIsOpen = !dropDownIsOpen;
      if (dropDownIsOpen) {
        $("#labelList").focus();
      }
    };
    /* once the "create button" is clicked (located within the "save as list" pop up) it launches a function and then
     closes the drop down pop up
     */
    $scope.createRecipientList = function($event) {
      closeDropdownPopUp($event)
    };
    /* once the cancel button is clicked (located within the "save as list" pop up) it launches a function and then
     closes the drop down pop up
     */
    $scope.closeDropdown = function($event) {
      closeDropdownPopUp($event);
    };

    $scope.addUploadedDocument = function(file, message, flow) {
      var documentResponse = [angular.fromJson(message)];
      $scope.share_array[1].addDocuments(documentResponse);
    };
    $scope.isComplete = false;
    $scope.onCompleteUpload = function(shareCreationDto) {
      $scope.isComplete = true;
      if(shareCreationDto.asyncShare) {
        $scope.submitShare(shareCreationDto, true);
      }
    };
    var dropDownIsOpen = false;
    // list - upon clicking on any contact list item, it is removed
    $scope.removeItem = function($event) {
      var currItem = $event.currentTarget;
      $(currItem).parent().parent().css("display", "none");
    };

    // pop up :  save recipients to a list
    // once the  : "save as list" button is clicked it sets the field to focus
    $scope.toggled = function() {
      dropDownIsOpen = !dropDownIsOpen;
      if (dropDownIsOpen) {
        $("#labelList").focus();
      }
    };
    /* once the "create button" is clicked (located within the "save as list" pop up) it launches a function and then
     closes the drop down pop up
     */
    $scope.createRecipientList = function($event) {
      closeDropdownPopUp($event)
    };
    /* once the cancel button is clicked (located within the "save as list" pop up) it launches a function and then
     closes the drop down pop up
     */
    $scope.closeDropdown = function($event) {
      closeDropdownPopUp($event);
    };

    function closeDropdownPopUp($event) {
      $(".savelistBtn").click();
    }

    /* chosen : if the user selects an item located within the select dropdown, it launches a function
     in order to create a new contact chip  */
    $(".chosen-select").chosen({
      width: "100%"
    });
    $('.chosen-results').on('change', function(evt, params) {
      createNewItem();
    });

    function createNewItem() {}
    /* affix : slide 2 recipients: set up required in order to maintain the left sidebar recipient selection
     onto the screen after the users scrolls down beyond the "add recipient" first field's position*/
    $(function() {
      setSticky();
      $(window).resize(function() {
        setSticky();
      });

      function setSticky() {
        var wWidth = $(".sticky").parent().width();
        if (wWidth > 768) {
          if (!!$('.sticky').offset()) {
            var widthSticky = (wWidth * 41) / 100;
            $(".sticky").css("max-width", widthSticky);
            var stickyTop = $('.sticky').offset().top;
            stickyTop -= 50; // our header height
            $(window).scroll(function() { // scroll event
              var windowTop = $(window).scrollTop();
              if (stickyTop < windowTop) {
                $('.sticky').css({
                  position: 'fixed',
                  top: 50
                });
              } else {
                $('.sticky').css({
                  position: 'static',
                  clear: 'both'
                });
              }
            });
          }
          $("#recipientsCtn").removeClass("w768");
          $(".custumListContainer").css({
            width: '58%'
          });
        }
        if (wWidth < 450) {
          $("#recipientsCtn").addClass("w450");
        }
        if ((wWidth > 450) && ($("#recipientsCtn").hasClass("w450"))) {
          $("#recipientsCtn").removeClass("w450");
        }
        if (wWidth < 750) {
          $(".sticky").css("max-width", "100%");
          $(".custumListContainer").css({
            width: '100%'
          });
          $("#recipientsCtn").addClass("w768");
        }
      }
    });
    /*slider navigation code */
    $scope.currSlide = 1;

    function clearNavClasses() {
      $(".slideCtn").removeClass('goToSlide1 goToSlide2 goToSlide3');
    }

    function closeDropdownPopUp($event) {
      $(".savelistBtn").click();
    }

    /* chosen : if the user selects an item located within the select dropdown, it launches a function
     in order to create a new contact chip  */
    $(".chosen-select").chosen({
      width: "100%"
    });
    $('.chosen-results').on('change', function(evt, params) {
      createNewItem();
    });

    function createNewItem() {}
    /* affix : slide 2 recipients: set up required in order to maintain the left sidebar recipient selection
     onto the screen after the users scrolls down beyond the "add recipient" first field's position*/
    $(function() {
      setSticky();
      $(window).resize(function() {
        setSticky();
      });

      function setSticky() {
        var wWidth = $(".sticky").parent().width();
        if (wWidth > 768) {
          if (!!$('.sticky').offset()) {
            var widthSticky = (wWidth * 41) / 100;
            $(".sticky").css("max-width", widthSticky);
            var stickyTop = $('.sticky').offset().top;
            stickyTop -= 50; // our header height
            $(window).scroll(function() { // scroll event
              var windowTop = $(window).scrollTop();
              if (stickyTop < windowTop) {
                $('.sticky').css({
                  position: 'fixed',
                  top: 50
                });
              } else {
                $('.sticky').css({
                  position: 'static',
                  clear: 'both'
                });
              }
            });
          }
          $("#recipientsCtn").removeClass("w768");
          $(".custumListContainer").css({
            width: '58%'
          });
        }
        if (wWidth < 450) {
          $("#recipientsCtn").addClass("w450");
        }
        if ((wWidth > 450) && ($("#recipientsCtn").hasClass("w450"))) {
          $("#recipientsCtn").removeClass("w450");
        }
        if (wWidth < 750) {
          $(".sticky").css("max-width", "100%");
          $(".custumListContainer").css({
            width: '100%'
          });
          $("#recipientsCtn").addClass("w768");
        }
      }
    });
    /*slider navigation code */
    $scope.currSlide = 1;

    function clearNavClasses() {
      $(".slideCtn").removeClass('goToSlide1 goToSlide2 goToSlide3');
    }

    function setSendLink() {
      $(".transfertFilesBtnCtn .nextLink").addClass('hide');
      $(".transfertFilesBtnCtn .sendLink").removeClass('hide');
    }

    function resetSendLink() {
      $(".transfertFilesBtnCtn .sendLink").addClass('hide');
      $(".transfertFilesBtnCtn .nextLink").removeClass('hide');
    }

    function goToNextSlide(currNum) {
      var currSlideNum = currNum;
      var nextNumSlide = currSlideNum + 1;
      clearNavClasses();
      resetSendLink();
      if (currNum == 1) {
        var isSlideDone = $(".sliderLinksCtn div:nth-child(" + currSlideNum + ")").hasClass('done');
        if (!isSlideDone) $(".form-wizard-nav .progress-bar").css('width', '50%');
      } else if (currNum == 2) {
        $(".form-wizard-nav .progress-bar").css('width', '100%');
        setSendLink();
      } else if (currNum == 3) {
        nextNumSlide = 1;
      }
      $(".slideCtn").addClass('goToSlide' + nextNumSlide + '');
      $(".form-wizard-nav div.active").removeClass('active');
      $(".sliderLinksCtn div:nth-child(" + nextNumSlide + ")").addClass('active');
      $(".sliderLinksCtn div:nth-child(" + currSlideNum + ")").addClass('done');
      $scope.currSlide = nextNumSlide;
    }

    function goToPreviousSlide(currNum) {
      var currSlideNum = currNum;
      var prevNumSlide = currSlideNum - 1;
      clearNavClasses();
      resetSendLink();
      if (currNum == 1) {
        prevNumSlide = 1;
      }
      $(".slideCtn").addClass('goToSlide' + prevNumSlide + '');
      $(".form-wizard-nav div.active").removeClass('active');
      $(".sliderLinksCtn div:nth-child(" + prevNumSlide + ")").addClass('active');
      $scope.currSlide = prevNumSlide;
    }
    $scope.moveSliderForward = function() {
      goToNextSlide($scope.currSlide);
    };

    $scope.moveSliderBackwards = function() {
      goToPreviousSlide($scope.currSlide);
    };
    $scope.goToSlide = function(numSlide) {
      resetSendLink();
      clearNavClasses();
      if (numSlide == 3) {
        setSendLink();
      }
      $(".slideCtn").addClass('goToSlide' + numSlide);
      $(".form-wizard-nav div.active").removeClass('active');
      $(".sliderLinksCtn div:nth-child(" + numSlide + ")").addClass('active');
      $scope.currSlide = numSlide;
    }
    $scope.showBtnList = function($event) {
      var showBtnListElem = $event.currentTarget;
      if ($(showBtnListElem).hasClass('activeShowMore')) {
        $(showBtnListElem).parent().prev().find('div').first().removeClass('dataListSlideToggle');
        $(showBtnListElem).removeClass('activeShowMore');
        $(showBtnListElem).css('display:none !important;');
      } else {
        $(showBtnListElem).addClass('activeShowMore').parent().prev().find('div').first().addClass('dataListSlideToggle');
      }
    };

    $scope.numSelectedItems = [];

    $scope.isAllSelected = {status: false, origin: ''};
    $scope.$watch('isAllSelected', function(n, o) {
      if(n.status === true) {
        var numItems=$(".media-body").length;

        angular.element('.media-body').addClass('highlightListElem');

        $scope.numSelectedItems.length=numItems;
      }
       else {
        if(n.origin !== 'directive') {

          angular.element('.media-body').removeClass('highlightListElem');
          $scope.numSelectedItems.pop($scope.numSelectedItems.length);
        }
      }
    }, true);
   // once a file has been uploaded we hide the drag and drop background and display the multi-select menu
    $scope.$on('flow::fileAdded', function (event, $flow, flowFile) {
      $("#selection-actions").addClass("showMultiMenu");
      $(".dragNDropCtn").addClass("outOfFocus");
      //pertains to upload-box
      if(angular.element("upload-box") !== null){
        $(".infoPartager").css("opacity","1");
      }
    });
    // display the files pertaining to the clicked share
    $scope.showSharingItems=function(numIndex){
      $scope.isCurrentPartage=true;
      numIndex++;
      angular.element('.media-body').each(function( index ) {
        if($(this).hasClass("partage"+numIndex)){
          $(this).addClass("highlightListElem");
        };
      });
      $scope.numSelectedItems.length=$(".partage"+numIndex+"").length;
      $("#selection-actions").addClass("showMultiMenu");
          $scope.currentSharingIndex = numIndex;
          $scope.isUpdate=true;
    };

    // add numbered classes onto each file list item
    $scope.createSharing= function(){
      // if new share
      if(!$scope.isUpdate) {
        $scope.numberOfSharings++;
        $scope.resetSelection();
        $scope.sharingsBtn.push(1);
        // slide up the multiselect menu
        $scope.closeMultiSelectMenu();
        $scope.numSelectedItems.length=0;
      }else{
        $scope.updateSharing();
      }
    };
    // update the selection of the files  for the current or newly created share
    $scope.resetSelection=function(){
      $('.media-body').each(function( index ) {
        $(this).removeClass("partage" + $scope.numberOfSharings);
        if($( this ).hasClass("highlightListElem")){
          if(!$scope.isUpdate) {
            $(this).addClass("partage" + $scope.numberOfSharings);
          }else{
            $(this).addClass("partage" + $scope.currentSharingIndex);
          }
        }
      });
    };
    $scope.updateSharing= function(){
      $scope.resetSelection();
      $scope.numSelectedItems.pop($scope.numSelectedItems.length);
      $scope.closeMultiSelectMenu()
      $scope.currentSharingIndex=0;
      $scope.isUpdate=false;
      $scope.isCurrentPartage=true;
    };
    // if closure of multiselect reset state
    angular.element(".exitSelection").bind('click',function() {
      $scope.isCurrentPartage=false;
      $scope.isUpdate=false;
    });
    // if share link has been clicked show quishare here
    angular.element(".partageLink").click(function(){
      $scope.$apply(function() {
        $scope.isCurrentPartage = true;
      });
    });
    // if closure of multiselect reset state
    $scope.closeMultiSelectMenu=function(){
      $("#selection-actions").removeClass("showMultiMenu");
      angular.element('.media-body').removeClass('highlightListElem');
    };

    $scope.currentSharingIndex=0;
    $scope.numberOfSharings=0;
    $scope.isUpdate=false;
    $scope.isCurrentPartage=false;
    $scope.sharingsBtn=[];
    $scope.onShare = function() {
      $('#focusInputShare').focus();
      $scope.sidebarData = 'more-options';
    };

  })
  .controller('DemoCtrl', function() {

    this.isOpen = false;
    this.selectedMode = 'md-scale';
    this.selectedDirection = 'left';
  }).directive('uploadBoxSelection', function() {
    var initSelectedItem = [];

      return {
      restrict: 'A',
      scope: false,
      link: function(scope, elm, attrs) {
        elm.bind('click', function(event) {
          var numItems=$(".media-body").length;
          var isCurrentlySelected=elm.hasClass("highlightListElem");
          elm.toggleClass("highlightListElem","removeListElem");
          checkifMultiMenuVisible();

        if(scope.isAllSelected.status == true) {
            scope.$apply(function() {
              scope.isAllSelected.status = false;
              scope.isAllSelected.origin = 'directive';
            })
        }
          if(isCurrentlySelected){
            scope.$apply(function() {
              scope.numSelectedItems.pop(1);
            })
          }else {
            scope.$apply(function() {
              scope.numSelectedItems.push(1);
              var numSelectedItems=scope.numSelectedItems.length;
              if(numSelectedItems == numItems) {
                elm.addClass("highlightListElem");
                scope.isAllSelected.status = true;
              }
            })
          }

          if(numItems ==0){
            $(".dragNDropCtn").removeClass("outOfFocus");
          }
        });

            angular.element(".exitSelection").bind('click',function(){
           scope.closeContextualToolBar();
         });
        function checkifMultiMenuVisible(){
          if(scope.numSelectedItems.length ==0){
            angular.element("#selection-actions").addClass("showMultiMenu");
          }
        }

        scope.closeContextualToolBar = function(){

          scope.$apply(function() {
            scope.numSelectedItems.pop(scope.numSelectedItems.length);
          });
          $("#selection-actions").removeClass("showMultiMenu");
          angular.element('.media-body').removeClass('highlightListElem');
        }
      }

    };
  });
