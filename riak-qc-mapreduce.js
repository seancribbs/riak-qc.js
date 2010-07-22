// This requires Spidermonkey stand-alone to emulate Riak's internal JS engine

load("mapred_builtins.js");
load("qc.js");

var SpidermonkeyListener = function(maxCollected){
    this.maxCollected = maxCollected || 0;
};

SpidermonkeyListener.prototype = new ConsoleListener();
SpidermonkeyListener.prototype.stringify = function(obj){
    var toStrClasses = ["String", "Fail", "Pass", "Invalid", "Stats"];
    var className = Riak.getClassName(obj);
    if(toStrClasses.indexOf(className) != -1)
        return obj.toString();
    else
        return JSON.stringify(obj);
};
SpidermonkeyListener.prototype.log = function(arg){
  print(this.stringify(arg));
};
SpidermonkeyListener.prototype.passed = function(arg){
  print('\033[32m' + this.stringify(arg) + '\033[0m');
};
SpidermonkeyListener.prototype.invalid = function (arg) {
    //print message in yellow
    print('\033[33m' + this.stringify(arg) + '\033[0m');
}
SpidermonkeyListener.prototype.failure = function (arg) {
    //print message in red
    this.hadFailures = true;
    print('\033[31m' + this.stringify(arg) + '\033[0m');
}


function ejsLog(message, file){
    print("ejsLog: [" + file + "] " + message);
}

var config = new Config(100,100,5);

Riak.QC = {
    isSaneMap: function(result){
        return Riak.getClassName(result) == "Array";
    },
    isChainableMap: function(result){
        return this.isSaneMap(result) && result.every(function(v){
                                                          return Riak.getClassName(v) == "Array" &&
                                                              (v.length == 2 || v.length == 3) &&
                                                              Riak.getClassName(v[0]) == "String" &&
                                                              Riak.getClassName(v[1]) == "String";
                                                    });  
    },
    isSaneReduce: function(result){
        return Riak.getClassName(result) == "Array";
    },
    verify: function(){
        var _config = arguments[0] || config;
        var listener = new SpidermonkeyListener();
        runAllProps(_config, listener);
        return listener.hadFailures ? 1 : 0;
    },
    genNotFound: {
        arb: function(){
            var bucket = arbString.arb(30).replace(/\W/g, '');
            var key = arbString.arb(30).replace(/\W/g, '');;
            var nf = new Object();
            nf.not_found = new Object();
            nf.not_found.bucket = bucket;
            nf.not_found.key = key;
            return nf;
        }
    },
    filtersNotFounds: function(arr){
        if(arr.every)
            return arr.every(function(v){ return v === undefined || !v.not_found; });
        else
            return false;
    }
};
