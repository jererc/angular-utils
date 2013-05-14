'use strict';

(function() {

    var MOBILE_USER_AGENT = /iPhone|iPod|iPad|Android|WebOS|Blackberry|Symbian|Bada/i;

    var module = angular.module('angularUtils', []);


    //
    // Services
    //
    module.service('eventSvc', function($rootScope) {

        this.emit = function(event, args) {
            $rootScope.$broadcast(event, args);
        };

    });

    module.service('utilsSvc', function() {

        this.mobile = (navigator.userAgent.match(MOBILE_USER_AGENT) != null);
        this.focus = true;

        var self = this;
        $(window).
            blur(function() {
                self.focus = false;
            }).
            focus(function() {
                self.focus = true;
            });

        this.now = function() {
            return new Date().getTime();
        };

        this.updateUrlQuery = function(url, key, value) {
            var sep = (url.indexOf('?') == -1) ? '?' : '&';
            return url + sep + key + '=' + value;
        };

        // Supposed to be faster than indexOf()
        this.getIndex = function(value, array) {
            for (var i = 0, len = array.length; i < len; i++) {
                if (array[i] == value) {
                    return i;
                }
            }
            return -1;
        };

        this.getActiveNode = function() {
            return document.activeElement.nodeName.toLowerCase();
        };

        this.updateList = function(src, dst, key, skip, limit) {
            var skip = (skip != undefined) ? skip : 0;
            var limit = (limit != undefined) ? limit : Math.max(src.length, dst.length);
            var key = (key != undefined) ? key : 'id';
            var toRemove = 0;
            var i0;

            for (var i1 = 0; i1 < limit; i1++) {
                i0 = i1 + skip;
                if (src[i0] || dst[i1]) {
                    if (src[i0] && dst[i1]) {
                        if (src[i0][key] == dst[i1][key]) {
                            angular.extend(src[i0], dst[i1])
                        } else {
                            src[i0] = dst[i1];
                        }
                    } else if (!src[i0]) {
                        src.push(dst[i1]);
                    } else if (!dst[i1]) {
                        toRemove++;
                        src[i0] = null;
                    }
                }
            }

            if (toRemove) {
                for (var i = src.length; i--;) {
                    if (src[i] == null) {
                        src.splice(i, 1);
                    }
                }
            }
        };

        this.formatPrimitives = function(data, keys, toObj) {
            for (var key in data) {
                if (angular.isArray(data[key]) && this.getIndex(key, keys) != -1) {
                    var val = angular.copy(data[key]);
                    data[key] = [];
                    val.map(function(v) {
                        var isObj = angular.isObject(v);
                        if (isObj == !!toObj) {
                            data[key].push(v);
                        } else {
                            data[key].push(isObj ? v.val : {val: v});
                        }
                    });
                } else if (angular.isObject(data[key])) {
                    this.formatPrimitives(data[key], keys, toObj);
                }
            }
        };

    });

    module.service('rootScopeSvc', function($rootScope, $location, utilsSvc) {

        $rootScope.isMenuActive = function(path) {
            if ($location.path().substr(0, path.length) == path) {
                return 'active';
            }
            return '';
        };

        $rootScope.inArray = function(value, array) {
            if (!array) {
                return -1;
            }
            return utilsSvc.getIndex(value, array) != -1;
        };

        $rootScope.hasKeys = function(obj) {
            for(var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    return true;
                }
            }
            return false;
        };

        $rootScope.exists = function(val) {
            if (angular.isArray(val)) {
                return !!val.length;
            } else if (typeof(val) == 'object') {
                return $rootScope.hasKeys(val);
            }
            return !!val;
        };

    });


    //
    // Directives
    //
    module.directive('whenScrolled', function() {
        return function(scope, element, attrs) {
            $(window).scroll(function() {
                scope.$eval(attrs.whenScrolled);
                if (!scope.$$phase) scope.$apply();
            });
            scope.$on('$destroy', function() {
                $(window).unbind('scroll');
            });
        };
    });

    module.directive('whenResized', function() {
        return function(scope, element, attrs) {
            $(window).resize(function() {
                scope.$eval(attrs.whenResized);
                if (!scope.$$phase) scope.$apply();
            });
            scope.$on('$destroy', function() {
                $(window).unbind('resize');
            });
        };
    });

    module.directive('openModal', function(eventSvc) {
        return function(scope, element, attrs) {
            element.click(function() {
                if (!element.hasClass('disabled')) {
                    if (attrs.openModalEvent) {
                        eventSvc.emit(attrs.openModalEvent);
                    }
                    if (!scope.$$phase) scope.$apply();
                    $(attrs.openModal).modal('show');
                }
            });
        };
    });

    module.directive('modalFocus', function() {
        return function(scope, element, attrs) {
            element.on('shown', function() {
                $(attrs.modalFocus).focus();
            });
        };
    });

    module.directive('submitModal', function(utilsSvc) {
        return function(scope, element, attrs) {
            var modal = element.parents('.modal');

            element.click(function() {
                scope.$eval(attrs.submitModal);
                modal.modal('hide');
            });

            modal.
                on('shown', function() {
                    modal.keyup(function(e) {
                        if (e.keyCode == 13 && utilsSvc.getActiveNode() != 'textarea') {
                            var form = scope[modal.find('form').attr('name')];
                            if (!form.$invalid) {
                                scope.$eval(attrs.submitModal);
                                modal.modal('hide');
                            }
                        }
                    })
                }).
                on('hidden', function() {
                    modal.unbind('keyup');
                });
        };
    });

    module.directive('clickNoDefault', function() {
        return function(scope, element, attrs) {
            element.click(function(event) {
                scope.$eval(attrs.clickNoDefault);
                event.preventDefault();
                event.stopPropagation();
                if (!scope.$$phase) scope.$apply();
            });
        };
    });

    module.directive('scrollToTop', function() {
        return function(scope, element, attrs) {
            element.click(function() {
                $('html, body').animate({scrollTop: 0}, 500);
            });
        };
    });


    //
    // Filters
    //
    module.filter('ifList', function() {
        return function(input) {
            return angular.isArray(input) ? input.join(', ') : input;
        };
    });

    module.filter('ifDate', function($filter) {
        return function(input) {
            return !!input ? $filter('date')(input * 1000, 'MMM d yyyy HH:mm') : '';
        };
    });

    module.filter('truncate', function() {
        return function(text, length, end) {
            length = (!isNaN(length)) ? length : 10;
            end = (end !== undefined) ? end : '...';
            if (text.length <= length || text.length - end.length <= length) {
                return text;
            }
            return String(text).substring(0, length-end.length) + end;
        };
    });


})();
