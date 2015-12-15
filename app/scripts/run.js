'use strict';

angular.module('linshareUiUserApp')
  .factory('MyErrorHandler', function ($q, $log, $http, lsAppConfig) {
    return function (part, lang) {
      $log.error('The "' + lsAppConfig.localPath + '/' + lang + '/' + part +'.json' + '" part was not loaded.');
      var path = 'i18n/original/' + lang + '/' + part +'.json';
      var content = null;
      return $q.when(
        $http.get(path).then(function(data) {
          return data.data;
        })
      );
    };
  })
  .config(function(RestangularProvider, flowFactoryProvider, $compileProvider, $translateProvider, $translatePartialLoaderProvider, lsAppConfig) {
    var pathToLocal = (lsAppConfig.localPath) ? lsAppConfig.localPath : 'i18n/original/';
    $translateProvider.useLoader('$translatePartialLoader', {
      urlTemplate: pathToLocal + '/{lang}/{part}.json',
      loadFailureHandler: 'MyErrorHandler'
    });
    $translatePartialLoaderProvider.addPart('general');
    $translateProvider.preferredLanguage('fr');
    RestangularProvider.setDefaultHttpFields({cache: false});
    RestangularProvider.setDefaultHeaders({'Content-Type': 'application/json;'});
    RestangularProvider.addFullRequestInterceptor(function(element, operation, route, url, headers) {
      headers['WWW-No-Authenticate'] = 'linshare';
    });
    flowFactoryProvider.defaults = {
      simultaneousUploads: 1,
      //testChunks:false,
      target: lsAppConfig.baseEndpoint + '/flow.json',
      permanentErrors: [401, 500, 501]
    };
    /*
    ** aHrefSanitizationWhitelist :
    ** The sanitization is a security measure aimed at preventing XSS attacks via html links.
    ** Any url about to be assigned to a[href] via data-binding is first normalized and turned into an absolute url.
    ** If a match is found, the original url is written into the dom.
    ** Otherwise, the absolute url is prefixed with 'unsafe:' string and only then is it written into the DOM.
    ** More info : https://docs.angularjs.org/api/ng/provider/$compileProvider
    */
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|tel|file|blob):/);
  })

  .config(function(localStorageServiceProvider) {
    localStorageServiceProvider
      .setPrefix('lsUser')
      .setNotify(true, true);
  })

  .run(function($rootScope, $location, $translate, Restangular, growlService, $log) {
    /**
     * Restangular Interceptor
     * Show message box when an error occured
     */
    Restangular.setErrorInterceptor(function(response) {
      if (response.status === 503) {
        growlService.growl('503 - Serveur Indisponible');
      }
      return true;
    });
    Restangular.addResponseInterceptor(function(data, operation, what, url, response, deferred) {
      $log.debug('my addresponseintercep', response);
      if (response.status === 401)  $rootScope.$emit('lsIntercept401', 'yoyo');
      return data;
    });

    $rootScope.$on('lsIntercept401', function(event, data) {
      $log.debug('data from lsIntercept401', data);
    });

    $rootScope.$on('$stateChangeStart', function(evt, toState, toParams, fromState, fromParams) {
      $log.debug('routechangestart', toState, 'my event', evt, 'toParams', toParams, 'fromState', fromState);

      if (toState.templateUrl === 'views/common/loginForm.html') {
        $log.debug('in there');
        $rootScope.$on('event:auth-loginConfirmed', function() {
          $log.debug('in event');
          $location.path('/home');
        });
      }
    });

    $rootScope.$on('$translatePartialLoaderStructureChanged', function () {
      $translate.refresh();
    });
  })

  .run(function ($rootScope, $state, $stateParams, Restangular, lsAppConfig, $window) {
    var protocol = $window.location.protocol;
    var host = $window.location.host.replace(/\/$/, '');
    var fqdn = protocol + '//' + host;
    lsAppConfig.backendUrl = [fqdn, validate(lsAppConfig.baseRestUrl)].join('/');
    Restangular.setBaseUrl(lsAppConfig.backendUrl);
    $rootScope.$state = $state;
    $rootScope.$stateParams = $stateParams;
  })

  .run(['$templateCache', '$http', function($templateCache, $http) {
    $http.get('views/includes/templates.html', {cache: $templateCache});
  }])

  .run(['$templateCache', function($templateCache) {

    $templateCache.get('views/includes/chat.html');

    $templateCache.get('views/includes/footer.html');

    $templateCache.get('views/includes/header.html');

    $templateCache.get('views/includes/profile-menu.html');

    $templateCache.get('views/includes/sidebar-left.html');

    $templateCache.put('views/includes/templates.html', "");

  }]);

function validate(str) {
  str = str.trim();
  str = str.replace(/^\/|\/$/g, ''); //remove first and last slash if present
  return str;
}