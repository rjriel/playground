let MyPlaygroundMain = ng.core.Component({
  selector: 'playground-my-playground-main',
  directives: [ng.router.ROUTER_DIRECTIVES],
  templateUrl: '/views/my-playground/my-playground-main.html'
})
.Class({
  constructor: [UserService, DataConnectionService, SampleDataService, function(userService, dataConnectionService, sampleDataService){
    this.dataConnectionService = dataConnectionService;
    this.sampleDataService = sampleDataService;
    this.userService = userService;
    this.setActiveTab(0);
    this.isTabDetail = false;
    this.selectedItem = {};
    this.myConns;
    this.myParsedConns = {};
    this.myConnKeys;
    this.apps;
    this.appKeys;
    this.conns;
    this.connKeys;
    this.sampleProjects;
    userService.getUser((user) => {
      console.log(user);
      this.user = user.user;
      this.apiKey = user.apiKey;
    });
    this.getSampleProjects();
  }],
  getConnections: function(){
    if(!this.conns){
      this.dataConnectionService.getDataConnections((conns)=>{
        this.conns = conns;
        this.connKeys = Object.keys(conns);
        this.getMyConnections((userConns)=>{
          if(userConns.err){

          }
          else {
            for(let c=0;c<userConns.connections.length;c++){
              if(this.conns[userConns.connections[c].connection]){
                this.conns[userConns.connections[c].connection].authorised = true;
                this.myParsedConns[userConns.connections[c].connection] = this.conns[userConns.connections[c].connection];
              }
              else{
                this.conns[userConns.connections[c].connection].authorised = false;
              }
            }
            this.myConnKeys = Object.keys(this.myParsedConns);
          }
        });
      });
    }
  },
  getMyConnections: function(callbackFn){
    if(this.myConns){
      if(callbackFn){
        callbackFn(this.myConns);
      }
    }
    else{
      this.userService.getUserConnections((userConns)=>{
        this.myConns = userConns;
        if(callbackFn){
          callbackFn(this.myConns);
        }
      });
    }
  },
  getSampleData: function(){
    if(!this.apps){
      this.sampleDataService.getSampleData((apps)=>{
        this.apps = apps;
        this.appKeys = Object.keys(apps);
      });
    }
  },
  getSampleProjects: function(){
    if(!this.sampleProjects){
      this.sampleDataService.getSampleProjects((projects)=>{
        console.log(projects);
        this.sampleProjects = projects;
      });
    }
  },
  setActiveTab: function(index){
    this.activeTab = index;
    switch (index) {
      case 0:
        this.getConnections();
        break;
      case 1:
        this.getSampleData();
        break;
      case 2:
        this.getConnections();
        break;
      default:

    }
  },
  showDetail: function(key, itemType){
    switch (itemType) {
      case "connection":
        this.selectedItem = this.conns[key];
        this.isTabDetail = true;
        break;
      default:

    }
  },
  hideDetail: function(){
    this.selectedItem = {};
    this.isTabDetail = false;
  },
  copyToClipboard: function(index){
    var itemInput = document.getElementById(index+"_clone_url");
    itemInput.select();
    document.execCommand('copy');
  }
})
