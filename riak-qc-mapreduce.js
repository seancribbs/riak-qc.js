// This requires Spidermonkey stand-alone to emulate Riak's internal JS engine

load("mapred_builtins.js");
load("qc.js");

/*
 * A QC Listener for the Spidermonkey runtime that prints to the console.
 */
var SpidermonkeyListener = function(maxCollected){
    this.maxCollected = maxCollected || 0;
};

SpidermonkeyListener.prototype = new ConsoleListener();
SpidermonkeyListener.prototype.stringify = function(obj){
    var toStrClasses = ["String", "Fail", "Pass", "Invalid", "Stats"];
    var className = Riak.Util.getClassName(obj);
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

/*
 * Stubs the erlang_js built-in ejsLog function.
 * @param [String] file the file that would be logged to
 * @param [String] message the message to print
 */
function ejsLog(file, message){
    print("ejsLog: [" + file + "] " + message);
}

var config = new Config(100,100,5);

/*
 * Contains QC-related functions for Riak
 */
Riak.QC = {
    /*
     * Checks that the output of a map function is valid output.
     * Map functions must return Arrays.
     * @param result the result of the map function
     * @returns [true,false] whether the map result is valid output.
     */
    isSaneMap: function(result){
        return Riak.Util.getClassName(result) == "Array";
    },
    /*
     * Checks that the output of a map function can be used as input
     * to another map phase. Map functions must return Arrays of bucket-key pairs
     * or bucket-key-keyData triples to be valid input for another map
     * phase.
     * @param result the result of the map function
     * @returns [true,false] whether the map result is valid output and valid input for another map phase.
     */
    isChainableMap: function(result){
        return this.isSaneMap(result) && result.every(function(v){
                                                          return Riak.getClassName(v) == "Array" &&
                                                              (v.length == 2 || v.length == 3) &&
                                                              Riak.getClassName(v[0]) == "String" &&
                                                              Riak.getClassName(v[1]) == "String";
                                                      });
    },
    /*
     * Checks that the output of a reduce function is valid output.
     * Reduce functions must return Arrays.
     * @param result the result of the reduce function
     * @returns [true,false] whether the reduce result is valid output.
     */
    isSaneReduce: function(result){
        return Riak.Util.getClassName(result) == "Array";
    },
    /*
     * Run all defined QC properties.
     * @returns 1 if a property failed
     * @returns 0 if all properties passed
     */
    verify: function(){
        var _config = arguments[0] || config;
        var listener = new SpidermonkeyListener();
        runAllProps(_config, listener);
        return listener.hadFailures ? 1 : 0;
    },
    /*
     * Generates an fake "not_found" result. These occur in Riak
     * when the input to a map phase cannot be retrieved.
     */
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
    /*
     * Verifies that the given Array contains no "not_found" objects.
     * @returns [true,false] Whether the Array contains no "no_found" objects.
     */
    filtersNotFounds: function(arr){
        if(arr.every)
            return arr.every(function(v){ return v === undefined || !v.not_found; });
        else
            return false;
    }
};
