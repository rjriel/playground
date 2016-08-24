'use strict';

(function (app) {

  // //service declarations
  app.ResourceCenterService = ng.core.Injectable({}).Class({
    constructor: [ng.http.Http, function (http) {
      this.http = http;
    }],
    getResource: function getResource(id, callbackFn) {
      this.http.get('/server/resource/' + id).subscribe(function (response) {
        if (response._body !== "") {
          callbackFn(JSON.parse(response._body));
        } else {
          callbackFn();
        }
      });
    }
  });

  app.DataConnectionService = ng.core.Injectable({}).Class({
    constructor: [ng.http.Http, function (http) {
      this.http = http;
      this.data;
      this.showcaseItems;
    }],
    getDataConnections: function getDataConnections(force, callbackFn) {
      var _this = this;

      if (!this.data || force === true) {
        this.http.get('/server/dataconnections').subscribe(function (response) {
          if (response._body !== "") {
            response = JSON.parse(response._body);
            _this.data = response;
            callbackFn(_this.data);
          } else {
            callbackFn();
          }
        });
      } else {
        callbackFn(this.data);
      }
    },
    getConnectionInfo: function getConnectionInfo(connectionId, callbackFn) {
      this.http.get('/server/connectioninfo/' + connectionId).subscribe(function (response) {
        if (response._body !== "") {
          callbackFn(JSON.parse(response._body));
        } else {
          callbackFn();
        }
      });
    },
    getShowcaseItems: function getShowcaseItems(callbackFn) {
      var _this2 = this;

      if (!this.showcaseItems) {
        this.http.get("/server/showcaseitems").subscribe(function (response) {
          _this2.showcaseitems = JSON.parse(response._body);
          callbackFn(_this2.showcaseitems);
        });
      } else {
        callbackFn(this.showcaseItems);
      }
    },
    authoriseConnection: function authoriseConnection(connectionId, callbackFn) {
      this.http.post("/server/authorise/" + connectionId).subscribe(function (response) {
        callbackFn(JSON.parse(response._body));
      });
    },
    startApp: function startApp(connectionId, callbackFn) {
      this.http.get("/server/startapp/" + connectionId).subscribe(function (response) {
        callbackFn(JSON.parse(response._body));
      });
    },
    stopApp: function stopApp(connectionId, callbackFn) {
      this.http.get("/server/stopapp/" + connectionId).subscribe(function (response) {
        callbackFn(JSON.parse(response._body));
      });
    },
    reloadApp: function reloadApp(connectionId, callbackFn) {
      this.http.get("/server/reloadapp/" + connectionId).subscribe(function (response) {
        callbackFn(JSON.parse(response._body));
      });
    },
    deleteConnection: function deleteConnection(connectionId, callbackFn) {
      this.http.get("/server/deleteconnection/" + connectionId).subscribe(function (response) {
        callbackFn(JSON.parse(response._body));
      });
    }

  });

  app.UserService = ng.core.Injectable({}).Class({
    constructor: [ng.http.Http, function (http) {
      this.http = http;
      this.user;
    }],
    getUser: function getUser(force, callbackFn) {
      var _this3 = this;

      if (!this.user || force === true) {
        console.log('fetching user info from server');
        this.http.get('/server/currentuser').subscribe(function (response) {
          if (response._body !== "") {
            response = JSON.parse(response._body);
            _this3.user = response;
            if (response.user) {
              _this3.parseConnections();
            }
            callbackFn(_this3.user);
          } else {
            callbackFn();
          }
        });
      } else {
        callbackFn(this.user);
      }
    },
    getUserConnections: function getUserConnections(callbackFn) {
      this.http.get('/server/currentuserconnections').subscribe(function (response) {
        if (response._body !== "") {
          callbackFn(JSON.parse(response._body));
        } else {
          callbackFn();
        }
      });
    },
    parseConnections: function parseConnections(callbackFn) {
      this.user.myParsedConnections = {};
      this.user.runningAppCount = 0;
      for (var c = 0; c < this.user.myConnections.length; c++) {
        if (this.user.dataConnections[this.user.myConnections[c].connection]) {
          this.user.dataConnections[this.user.myConnections[c].connection].authorised = true;
          this.user.myParsedConnections[this.user.myConnections[c].connection] = this.user.dataConnections[this.user.myConnections[c].connection];
          if (this.user.myConnections[c].appid) {
            this.user.myParsedConnections[this.user.myConnections[c].connection].appid = this.user.myConnections[c].appid;
            this.user.runningAppCount++;
          }
        } else {
          this.user.dataConnections[this.user.myConnections[c].connection].authorised = false;
        }
      }
    }
  });

  app.PubSub = ng.core.Injectable({}).Class({
    constructor: [function () {
      this.publications = {};
    }],
    subscribe: function subscribe(publication, subscriber, fn) {
      if (!this.publications[publication]) {
        this.publications[publication] = {
          subscribers: {}
        };
      }
      this.publications[publication].subscribers[subscriber] = fn;
    },
    publish: function publish(publication, params) {
      if (this.publications[publication]) {
        for (var s in this.publications[publication].subscribers) {
          this.publications[publication].subscribers[s].call(null, params);
        }
      }
    }
  });

  app.QSocksService = ng.core.Injectable({}).Class({
    constructor: [ng.http.Http, app.PubSub, function (http, pubsub) {
      this.http = http;
      this.pubsub = pubsub;
      this.currentAppId;
      this.global;
      this.app;
      this.ticket;
    }],
    connect: function connect(config, callbackFn) {
      var _this4 = this;

      if (this.currentAppId != config.appname) {
        if (this.currentAppId) {
          this.disconnect();
        }
        this.currentAppId = config.appname;
      }
      if (!this.global) {
        this.authenticate(config, function (err, ticket) {
          if (err) {
            callbackFn(err);
          } else {
            config.ticket = ticket;
            qsocks.ConnectOpenApp(config).then(function (result) {
              _this4.global = result[0];
              _this4.app = result[1];
              callbackFn(null, _this4.global, _this4.app);
            });
          }
        });
      } else {
        config.ticket = this.ticket;
        qsocks.ConnectOpenApp(config).then(function (result) {
          _this4.global = result[0];
          _this4.app = result[1];
          callbackFn(null, _this4.global, _this4.app);
        });
      }
    },
    authenticate: function authenticate(config, callbackFn) {
      this.http.get('/api/ticket?apikey=' + config.apiKey).subscribe(function (response) {
        if (response._body !== "") {
          response = JSON.parse(response._body);
          config.ticket = response.ticket;
          callbackFn(null, response.ticket);
        } else {
          console.log('error getting ticket');
          callbackFn('error getting ticket');
        }
      });
    },
    disconnect: function disconnect() {
      if (this.app && this.app.connection) {
        this.app.connection.close();
      }
    }

  });

  //
  // //main component declarations
  app.Header = ng.core.Component({
    selector: 'playground-header',
    directives: [ng.router.ROUTER_DIRECTIVES],
    templateUrl: '/views/header.html'
  }).Class({
    constructor: [app.UserService, function (userService) {
      var _this5 = this;

      this.dialog;
      this.user;
      this.loginUrl;
      this.returnUrl;
      userService.getUser(false, function (user) {
        _this5.user = user.user;
        _this5.loginUrl = user.loginUrl;
        _this5.returnUrl = user.returnUrl;
      });
    }]
  });

  // app.FooterList = ng.core.Component({
  //   selector: 'playground-footer-list',
  //   inputs: ['data:data'],
  //   directives: [ng.router.ROUTER_DIRECTIVES],
  //   templateUrl: '/views/footer-list.html'
  // })
  // .Class({
  //   constructor: function(){
  //
  //   }
  // });

  app.FooterList = function () {
    function FooterList() {}
    FooterList.data = [];
  };

  app.FooterList.annotations = [new ng.core.Component({
    selector: 'playground-footer-list',
    inputs: ['data:data'],
    directives: [ng.router.ROUTER_DIRECTIVES],
    templateUrl: '/views/footer-list.html'
  })];

  app.FooterComponent = ng.core.Component({
    selector: 'playground-footer',
    directives: [ng.router.ROUTER_DIRECTIVES],
    templateUrl: '/views/footer.html'
  }).Class({
    constructor: function constructor() {
      this.sites = {
        header: "Qlik Sites",
        items: [{
          text: "Qlik.com",
          link: "http://www.qlik.com"
        }, {
          text: "Qlik Community",
          link: "http://community.qlik.com"
        }, {
          text: "Qlik Cloud",
          link: "http://www.qlikcloud.com"
        }]
      };
    }
  });

  app.ComingSoon = ng.core.Component({
    selector: 'coming-soon',
    template: '<div class=\'coming-soon\'>Coming Soon</div>'
  }).Class({
    constructor: function constructor() {}
  });

  app.Home = ng.core.Component({
    selector: 'playground-home',
    templateUrl: '/views/home.html'
  }).Class({
    constructor: function constructor() {
      console.log('constructor');
    }
  });

  app.Noobs = ng.core.Component({
    selector: 'playground-noobs',
    templateUrl: '/views/noobs.html'
  }).Class({
    constructor: function constructor() {
      console.log('constructor');
    }
  });

  app.Showcase = ng.core.Component({
    selector: 'playground-showcase',
    templateUrl: '/views/showcase.html'
  }).Class({
    constructor: [app.DataConnectionService, app.UserService, function (dataConnectionService, userService) {
      var _this6 = this;

      this.dataConnectionService = dataConnectionService;
      this.userService = userService;
      this.items;
      this.itemKeys;
      this.apiKey;
      this.userService.getUser(false, function (user) {
        if (user && user.user) {
          _this6.apiKey = user.user.apiKey;
        }
      });
      this.dataConnectionService.getShowcaseItems(function (items) {
        _this6.items = items;
        _this6.itemKeys = Object.keys(items);
        _this6.userService.getUserConnections(function (connections) {
          var connectionList = connections.connections;
          for (var i in _this6.items) {
            if (_this6.items[i].ownData) {
              for (var c in connectionList) {
                if (_this6.items[i].connectionId == connectionList[c].connection) {
                  if (connectionList[c].appid) {
                    _this6.items[i].canUseOwnData = true;
                    _this6.items[i].appid = connectionList[c].appid;
                  }
                  break;
                }
              }
            }
          }
        });
      });
    }]
  });

  app.Login = ng.core.Component({
    selector: 'playground-login',
    templateUrl: '/views/login.html'
  }).Class({
    constructor: [app.UserService, function (userService) {
      var _this7 = this;

      this.dialog;
      this.user;
      this.loginUrl;
      this.returnUrl;
      userService.getUser(false, function (user) {
        _this7.user = user.user;
        _this7.loginUrl = user.loginUrl;
        _this7.returnUrl = user.returnUrl;
      });
    }]
  });

  app.Apis = ng.core.Component({
    selector: 'playground-apis',
    directives: [ng.router.ROUTER_DIRECTIVES],
    templateUrl: '/views/apis/apis.html'
  }).Class({
    constructor: function constructor() {}
  });

  app.Engine = ng.core.Component({
    selector: 'playground-engine',
    directives: [ng.router.ROUTER_DIRECTIVES],
    templateUrl: '/views/apis/engine.html'
  }).Class({
    constructor: function constructor() {}
  });

  app.Capability = ng.core.Component({
    selector: 'playground-capability',
    directives: [ng.router.ROUTER_DIRECTIVES],
    templateUrl: '/views/apis/capability.html'
  }).Class({
    constructor: function constructor() {}
  });

  app.APIContent = ng.core.Component({
    selector: 'playground-api-content',
    directives: [ng.router.ROUTER_DIRECTIVES],
    templateUrl: '/views/apis/api-content.html'
  }).Class({
    constructor: [ng.router.ActivatedRoute, app.ResourceCenterService, function (route, resourceCenterService) {
      var _this8 = this;

      this.route = route;
      this.resourceCenterService = resourceCenterService;
      this.api = this.route.parent.url.value[0].path;
      route.params.subscribe(function (route) {
        var resourceSubject = route.subject;
        _this8.getResourceContent(resourceSubject);
      });
    }],
    getResourceContent: function getResourceContent(subject) {
      var _this9 = this;

      var resourceId = null;
      this.resourceTitle = "";
      this.content = "";
      switch (this.api) {
        case "engine":
          switch (subject) {
            case "overview":
              resourceId = "57bc65dc99eaed947c8e58c4";
              break;
            case "authenticating":
              resourceId = "57bc4c2482583d70eba9ef60";
              break;
            case "connecting":
              resourceId = "57bc6bdd99eaed947c8e5918";
              break;
            case "hypercube":
              resourceId = "57bc71b3b2f5fb393a3480d6";
              break;
            case "listobject":

              break;
            case "filtering":

              break;
            default:

          }
          break;
        case "capability":
          switch (subject) {
            case "overview":
              resourceId = "57b195052fe227f95f07cba4";
              break;
            case "authenticating":
              resourceId = "57bb1b4c9a9e3798414d5113";
              break;
            case "connecting":
              resourceId = "57a356c6a3c42710c3f23c1c";
              break;
            case "visualizations":
              resourceId = "57b1dd7dc3416b4035de71bc";
              break;
            case "filtering":

              break;
            default:

          }
          break;
        default:

      }
      if (resourceId) {
        this.resourceCenterService.getResource(resourceId, function (resource) {
          resource = JSON.parse(resource);
          if (resource && resource.data && resource.data.length > 0) {
            resource = resource.data[0];
            _this9.resourceTitle = resource.title;
            console.log(resource);
            _this9.content = marked(_this9.arrayBufferToBase64(resource.content.data));
            setTimeout(function () {
              $('pre code').each(function (i, block) {
                hljs.highlightBlock(block);
              });
            }, 100);
          }
        });
      }
    },
    arrayBufferToBase64: function arrayBufferToBase64(buffer) {
      var binary = '';
      var bytes = new Uint8Array(buffer);
      var len = bytes.byteLength;
      for (var i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return binary;
    }
  });

  app.MyDataList = ng.core.Component({
    selector: 'my-data-list',
    directives: [ng.router.ROUTER_DIRECTIVES],
    templateUrl: '/views/my-playground/my-data-list.html'
  }).Class({
    constructor: [app.UserService, function (userService) {
      var _this10 = this;

      this.MAX_RUNNING_APPS = 3;
      this.myRunningAppCount = 0;
      this.myConns;
      this.myConnKeys;
      userService.getUser(false, function (user) {
        if (user) {
          if (user.myParsedConnections) {
            _this10.myConns = user.myParsedConnections;
            _this10.myConnKeys = Object.keys(_this10.myConns);
          }
          if (user.runningAppCount) {
            _this10.myRunningAppCount = user.runningAppCount;
          }
        }
      });
    }]
  });

  app.SampleDataList = ng.core.Component({
    selector: 'sample-data-list',
    directives: [ng.router.ROUTER_DIRECTIVES],
    viewProviders: [],
    templateUrl: '/views/my-playground/sample-data-list.html'
  }).Class({
    constructor: [app.UserService, function (userService) {
      var _this11 = this;

      this.apps = {};
      this.appKeys = [];
      userService.getUser(false, function (user) {
        _this11.apps = user.sampleData;
        _this11.appKeys = Object.keys(_this11.apps);
      });
    }]
  });

  app.GenericDataDetailDelete = ng.core.Component({
    selector: 'playground-my-playground-generic-data-detail-delete',
    directives: [ng.router.ROUTER_DIRECTIVES],
    templateUrl: '/views/my-playground/generic-data-detail-delete.html'
  }).Class({
    constructor: [ng.router.ActivatedRoute, app.UserService, app.DataConnectionService, function (route, userService, dataConnectionService) {
      var _this12 = this;

      this.MAX_RUNNING_APPS = 3;
      this.myRunningAppCount = 0;
      this.dataConnectionService = dataConnectionService;
      this.connectionId = route.parent.url.value[0].path;
      this.connectionStatus = '';
      this.connectionStatusDetail = "";
      this.connection;
      this.isMyData = false;
      userService.getUser(false, function (user) {
        if (user.myParsedConnections[_this12.connectionId]) {
          _this12.isMyData = true;
          _this12.connection = user.myParsedConnections[_this12.connectionId];
        } else {
          _this12.connection = user.sampleData[_this12.connectionId];
        }
        _this12.myRunningAppCount = user.runningAppCount;
        _this12.getConnectionInfo(_this12.connectionId);
      });
    }],
    getConnectionInfo: function getConnectionInfo(connectionId) {
      var _this13 = this;

      this.dataConnectionService.getConnectionInfo(connectionId, function (connInfo) {
        _this13.onConnectionInfo(connInfo);
      });
    },
    onConnectionInfo: function onConnectionInfo(info) {
      if (info.appname) {
        this.connectionStatus = "Running";
      } else {
        this.connectionStatus = "Stopped";
        this.connectionStatusDetail = "";
      }
    },
    deleteAppAndConnection: function deleteAppAndConnection(connectionId) {
      var _this14 = this;

      this.connectionStatus = "Deleting";
      this.connectionStatusDetail = "Stopping application.";
      this.dataConnectionService.stopApp(connectionId, function (connInfo) {
        _this14.connectionStatusDetail = "Deleting application.";
        _this14.dataConnectionService.deleteConnection(connectionId, function (result) {
          if (result.err) {
            _this14.connectionStatus = "Error";
            _this14.connectionStatusDetail = err;
          } else {
            window.location.pathname = "myplayground/mydata";
          }
        });
      });
    }
  });

  app.GenericDataDetailGettingStarted = ng.core.Component({
    selector: 'playground-my-playground-generic-data-detail-gettingstarted',
    directives: [ng.router.ROUTER_DIRECTIVES],
    templateUrl: '/views/my-playground/generic-data-detail-gettingstarted.html'
  }).Class({
    constructor: [ng.router.ActivatedRoute, app.UserService, app.DataConnectionService, function (route, userService, dataConnectionService) {
      this.dataConnectionService = dataConnectionService;
      var connectionId = route.parent.url.value[0].path;
      this.connectionConfig;
      this.getConnectionInfo(connectionId);
    }],
    getConnectionInfo: function getConnectionInfo(connectionId) {
      var _this15 = this;

      this.dataConnectionService.getConnectionInfo(connectionId, function (connInfo) {
        _this15.onConnectionInfo(connInfo);
      });
    },
    onConnectionInfo: function onConnectionInfo(info) {
      if (info.appname) {
        this.connectionStatus = "Running";
      } else {
        this.connectionStatus = "Stopped";
      }
      var connInfoStr = JSON.stringify(info);
      //dirty method for styling text and removing quotes (required so that the capability api reads the properties correctly)
      connInfoStr = connInfoStr.replace(/\{/gim, '{\n\t').replace(/,/gim, ',\n\t').replace(/\}/gim, '\n}');
      var connStrComponents = connInfoStr.split(",");
      var parsedComponents = [];
      for (var i = 0; i < connStrComponents.length; i++) {
        var keyVal = connStrComponents[i].split(":");
        parsedComponents.push(keyVal[0].replace(/\"/gim, '') + ':' + keyVal[1]);
      }
      connInfoStr = parsedComponents.join(",");
      this.connectionConfig = connInfoStr.trim();
      setTimeout(function () {
        $('pre code').each(function (i, block) {
          hljs.highlightBlock(block);
        });
      }, 100);
    }
  });

  app.GenericDataDetailFieldExplorer = ng.core.Component({
    selector: 'playground-my-playground-generic-data-detail-field-explorer',
    directives: [ng.router.ROUTER_DIRECTIVES],
    templateUrl: '/views/my-playground/generic-data-detail-field-explorer.html'
  }).Class({
    constructor: [ng.router.ActivatedRoute, ng.core.ChangeDetectorRef, app.UserService, app.DataConnectionService, app.QSocksService, function (route, cdr, userService, dataConnectionService, qsocksService) {
      var _this16 = this;

      this.userService = userService;
      this.dataConnectionService = dataConnectionService;
      this.qsocksService = qsocksService;
      this.cdr = cdr;
      this.connectionStatus = "Please wait...";
      this.connectionDetail = "Connecting";
      this.connectionId = route.parent.url.value[0].path;
      this.loading = true;
      this.fields = {};
      this.fieldKeys;
      this.selectedFields = [];
      this.userService.getUser(false, function (user) {
        _this16.dataConnectionService.getConnectionInfo(_this16.connectionId, function (connInfo) {
          _this16.qsocksService.connect(connInfo, function (err, global, app) {
            if (err) {
              _this16.connectionStatus = "Error!";
              _this16.connectionDetail = err;
            }
            if (app) {
              var fieldListDef = {
                qInfo: {
                  qType: "FieldList"
                },
                qFieldListDef: {}
              };
              app.createSessionObject(fieldListDef).then(function (fieldsObject) {
                fieldsObject.getLayout().then(function (layout) {
                  _this16.loading = false;
                  layout.qFieldList.qItems.forEach(function (item, index) {
                    _this16.fields[item.qName] = { selected: false };
                  });
                  console.log(_this16.fields);
                  _this16.fieldKeys = Object.keys(_this16.fields).sort();
                  _this16.cdr.detectChanges();
                });
              });
            }
          });
        });
      });
    }],
    toggleField: function toggleField(field) {
      var fieldIndex = this.selectedFields.indexOf(field);
      if (fieldIndex == -1) {
        this.selectedFields.push(field);
      } else {
        this.selectedFields.splice(fieldIndex, 1);
      }
    }
  });

  app.GenericDataDetailTemplates = ng.core.Component({
    selector: 'playground-my-playground-generic-data-detail-templates',
    directives: [ng.router.ROUTER_DIRECTIVES],
    templateUrl: '/views/my-playground/generic-data-detail-templates.html'
  }).Class({
    constructor: [ng.router.ActivatedRoute, app.UserService, function (route, userService) {
      var _this17 = this;

      var connectionId = route.parent.url.value[0].path;
      this.connection = {};
      this.sampleProjects = {};
      this.isMyData = false;
      userService.getUser(false, function (user) {
        if (user.myParsedConnections[connectionId]) {
          _this17.isMyData = true;
          _this17.connection = user.myParsedConnections[connectionId];
        } else {
          _this17.connection = user.sampleData[connectionId];
        }
        _this17.sampleProjects = user.sampleProjects;
      });
    }],
    copyToClipboard: function copyToClipboard(index) {
      var itemInput = document.getElementById(index + "_clone_url");
      itemInput.select();
      document.execCommand('copy');
    }
  });

  app.GenericDataDetail = ng.core.Component({
    selector: 'playground-my-playground-generic-data-detail',
    directives: [ng.router.ROUTER_DIRECTIVES, ng.common.NgClass],
    templateUrl: '/views/my-playground/generic-data-detail.html'
  }).Class({
    constructor: [ng.router.ActivatedRoute, app.UserService, app.DataConnectionService, function (route, userService, dataConnectionService) {
      var _this18 = this;

      this.MAX_RUNNING_APPS = 3;
      this.myRunningAppCount = 0;
      this.dataConnectionService = dataConnectionService;
      var connectionId = route.url.value[0].path;
      this.parentPath = route.parent.url.value[0].path;
      this.connection = {};
      this.isMyData = false;
      userService.getUser(false, function (user) {
        _this18.myRunningAppCount = user.runningAppCount;
        if (user.myParsedConnections[connectionId]) {
          _this18.isMyData = true;
          _this18.connection = user.myParsedConnections[connectionId];
        } else {
          _this18.connectionStatus = "Running";
          _this18.connection = user.sampleData[connectionId];
        }
        _this18.getConnectionInfo(connectionId);
      });
    }],
    getConnectionInfo: function getConnectionInfo(connectionId) {
      var _this19 = this;

      this.dataConnectionService.getConnectionInfo(connectionId, function (connInfo) {
        _this19.onConnectionInfo(connInfo);
      });
    },
    onConnectionInfo: function onConnectionInfo(info) {
      if (info.appname) {
        this.connectionStatus = "Running";
      } else {
        this.connectionStatus = "Stopped";
        this.connectionStatusDetail = "";
      }
    },
    startApp: function startApp(connectionId) {
      var _this20 = this;

      this.connectionStatus = "Starting";
      this.connectionStatusDetail = "Starting application.";
      this.dataConnectionService.startApp(connectionId, function (connInfo) {
        _this20.getConnectionInfo(connectionId);
      });
    },
    stopApp: function stopApp(connectionId) {
      var _this21 = this;

      this.connectionStatus = "Stopping";
      this.connectionStatusDetail = "Stopping application.";
      this.dataConnectionService.stopApp(connectionId, function (connInfo) {
        _this21.getConnectionInfo(connectionId);
      });
    },
    reloadApp: function reloadApp(connectionId) {
      var _this22 = this;

      this.connectionStatus = "Reloading";
      this.connectionStatusDetail = "Reloading application.";
      this.dataConnectionService.reloadApp(connectionId, function (connInfo) {
        _this22.getConnectionInfo(connectionId);
      });
    }
  });

  app.MyPlaygroundMyData = ng.core.Component({
    selector: 'playground-my-playground-my-data',
    directives: [ng.router.ROUTER_DIRECTIVES],
    templateUrl: '/views/my-playground/my-playground-my-data.html'
  }).Class({
    constructor: function constructor() {}
  });

  app.MyPlaygroundSampleData = ng.core.Component({
    selector: 'playground-my-playground-sample-data',
    directives: [ng.router.ROUTER_DIRECTIVES],
    templateUrl: '/views/my-playground/my-playground-sample-data.html'
  }).Class({
    constructor: function constructor() {}
  });

  app.MyPlaygroundConnect = ng.core.Component({
    selector: 'playground-my-playground-connect',
    directives: [ng.router.ROUTER_DIRECTIVES],
    templateUrl: '/views/my-playground/my-playground-connect.html'
  }).Class({
    constructor: [app.UserService, function (userService) {
      var _this23 = this;

      this.conns;
      this.connKeys;
      userService.getUser(false, function (user) {
        _this23.conns = user.dataConnections;
        _this23.connKeys = Object.keys(_this23.conns);
      });
    }]
  });

  app.ListObject = ng.core.Component({
    selector: 'playground-vis-listobject',
    directives: [ng.router.ROUTER_DIRECTIVES],
    inputs: ['field:field'],
    templateUrl: '/views/vis/list-object.html'
  }).Class({
    constructor: [ng.core.ChangeDetectorRef, app.QSocksService, app.PubSub, function (cdr, qsocksService, pubsub) {
      this.cdr = cdr;
      this.qsocksService = qsocksService;
      this.pubsub = pubsub;
      this.field = "";
      this.listValues = [];
      this.genericObject;
    }],
    ngOnInit: function ngOnInit() {
      var _this24 = this;

      var def = {
        qInfo: {
          qType: "ListObject"
        },
        qListObjectDef: {
          qDef: {
            qFieldDefs: [//the name of the field to load
            this.field],
            qFieldLabels: [//the label we want to give the field
            this.field],
            qSortCriterias: [{
              qSortByState: 1 //we sort by state first asc
            }, {
              qSortByAscii: 1 //and then text value asc
            }]
          },
          qInitialDataFetch: [//an array of data pages we want to fetch when we first call 'getLayout()' on the list object
          {
            qTop: 0,
            qLeft: 0,
            qWidth: 1,
            qHeight: 100
          }]
        }
      };
      this.qsocksService.app.createSessionObject(def).then(function (genericObject) {
        _this24.pubsub.subscribe('update', genericObject.handle, _this24.getLayout.bind(_this24));
        _this24.genericObject = genericObject;
        _this24.getLayout();
      });
    },
    clearAll: function clearAll() {},
    search: function search() {},
    getLayout: function getLayout() {
      var _this25 = this;

      this.listValues = [];
      this.genericObject.getLayout().then(function (layout) {
        var matrix = layout.qListObject.qDataPages[0].qMatrix;
        matrix.forEach(function (row, index) {
          _this25.listValues.push(row[0]);
        });
        _this25.cdr.detectChanges();
      });
    },
    toggleValue: function toggleValue(elemNum, event) {
      var _this26 = this;

      this.genericObject.selectListObjectValues("/qListObjectDef", [parseInt(elemNum)], true).then(function (response) {
        event.target.parentElement.scrollTop = 0;
        _this26.pubsub.publish('update');
      });
    }
  });

  // app.ListObject = (function(){
  //   function ListObject(){
  //
  //   }
  //   ListObject.prototype = Object.create(Object.prototype({
  //     field: {
  //       writable: true,
  //       value: null
  //     },
  //
  //   }));
  // });
  //
  // app.ListObject.annotations = [
  //   new ng.core.Component({
  //     selector: 'playground-vis-listobject',
  //     inputs: ['field:field'],
  //     templateUrl: '/views/vis/list-object.html'
  //   })
  // ];


  // //my playground main component
  app.MyPlayground = ng.core.Component({
    selector: 'playground-my-playground',
    directives: [ng.router.ROUTER_DIRECTIVES],
    templateUrl: '/views/my-playground/my-playground.html'
  }).Class({
    constructor: [app.UserService, ng.router.Router, function (userService, route) {
      userService.getUser(false, function (user) {
        if (!user.user) {
          route.navigate(["/login"]);
          // window.location.pathname = "login";
        }
      });
    }]
  });

  //
  // //main routing
  var genericDataDetailRoutes = [{
    path: '',
    redirectTo: 'gettingstarted',
    pathMatch: 'full'
  }, {
    path: 'gettingstarted',
    component: app.GenericDataDetailGettingStarted
  }, {
    path: 'templates',
    component: app.GenericDataDetailTemplates
  }, {
    path: 'explorer',
    component: app.GenericDataDetailFieldExplorer
  }, {
    path: 'delete',
    component: app.GenericDataDetailDelete
  }];

  var mainRoutes = [{
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  }, {
    path: "home",
    component: app.Home
  }, {
    path: "noobs",
    component: app.Noobs
  }, {
    path: 'apis',
    component: app.Apis,
    children: [{
      path: '',
      pathMatch: 'full',
      redirectTo: 'engine'
    }, {
      path: 'engine',
      component: app.Engine,
      children: [{
        path: '',
        pathMatch: 'full',
        redirectTo: 'overview'
      }, {
        path: ':subject',
        component: app.APIContent
      }]
    }, {
      path: 'capability',
      component: app.Capability,
      children: [{
        path: '',
        pathMatch: 'full',
        redirectTo: 'overview'
      }, {
        path: ':subject',
        component: app.APIContent
      }]
    }]
  }, {
    path: 'myplayground',
    component: app.MyPlayground,
    children: [{
      path: '',
      pathMatch: 'full',
      redirectTo: 'mydata'
    }, {
      path: 'mydata',
      component: app.MyPlaygroundMyData,
      children: [{
        path: '',
        component: app.MyDataList
      }, {
        path: ':id',
        component: app.GenericDataDetail,
        children: genericDataDetailRoutes
      }]
    }, {
      path: 'sampledata',
      component: app.MyPlaygroundSampleData,
      children: [{
        path: '',
        component: app.SampleDataList
      }, {
        path: ':id',
        component: app.GenericDataDetail,
        children: genericDataDetailRoutes
      }]
    }, {
      path: 'connect',
      component: app.MyPlaygroundConnect
    }]
  }, {
    path: "showcase",
    component: app.Showcase
  }, {
    path: "login",
    component: app.Login
  }];

  app.MainRoutingProvider = ng.router.RouterModule.forRoot(mainRoutes);

  app.AppComponent = function () {};
  app.AppComponent.annotations = [new ng.core.Component({
    selector: 'app-component',
    directives: [ng.router.ROUTER_DIRECTIVES, app.Header, app.FooterComponent, app.FooterList],
    providers: [],
    template: '<playground-header></playground-header><router-outlet></router-outlet><playground-footer></playground-footer>'
  })];
  hljs.initHighlightingOnLoad();

  app.AppModule = ng.core.NgModule({
    imports: [ng.platformBrowser.BrowserModule, app.MainRoutingProvider],
    declarations: [app.AppComponent, app.Header, app.FooterComponent, app.FooterList, app.Home, app.Noobs, app.Apis, app.Engine, app.Capability, app.APIContent, app.MyPlayground, app.MyPlaygroundMyData, app.MyPlaygroundSampleData, app.MyPlaygroundConnect, app.MyDataList, app.SampleDataList, app.GenericDataDetail, app.GenericDataDetailDelete, app.GenericDataDetailGettingStarted, app.GenericDataDetailTemplates, app.GenericDataDetailFieldExplorer, app.GenericDataDetail, app.Showcase, app.ListObject, app.Login],
    providers: [ng.http.HTTP_PROVIDERS, app.ResourceCenterService, app.UserService, app.DataConnectionService, app.QSocksService, app.PubSub],
    bootstrap: [app.AppComponent]
  }).Class({
    constructor: function constructor() {}
  });

  document.addEventListener('DOMContentLoaded', function () {
    ng.platformBrowserDynamic.platformBrowserDynamic().bootstrapModule(app.AppModule);
  });
})(window.app || (window.app = {}));
