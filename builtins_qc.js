load("riak-qc-mapreduce.js");

declare("Riak.Util.getClassName",
        [arbArray(arbInt),arbDate],
        function(c,arr,date){
            c.assert(Riak.Util.getClassName(arr) == "Array");
            c.assert(Riak.Util.getClassName(date) == "Date");
        });

declare("Riak.Util.filterNotFound",
        [arbArray(arbChoose(Riak.QC.genNotFound, arbInt))],
        function(c,values){
            // The "every" check is abstracted into Riak.QC.filtersNotFounds but is explicit here for clarity
            c.assert(Riak.Util.filterNotFound(values).every(function(v){ return v.not_found ? false : true; }));
        });

declare("Riak.Util.numericSorter",
        [arbFloatUnit, arbFloatUnit],
        function(c, a, b){
            var actual = Riak.Util.numericSorter(a,b);
            if(a < b)
                c.assert(actual < 0);
            if(a > b)
                c.assert(actual > 0);
            if(a === b)
                c.assert(actual === 0);
        });

declare("Riak.reduceSum",
        [arbArray(arbChoose(Riak.QC.genNotFound,arbInt))],
        function(c, values){
            var result = Riak.reduceSum(values);
            c.assert(Riak.QC.isSaneReduce(result));
            c.assert(Riak.QC.filtersNotFounds(result));
            c.assert(result.length == 1);
            var validValues = Riak.Util.filterNotFound(values);
            var expected = 0;
            for(var i = 0; i < validValues.length; i++)
                expected += validValues[i];
            c.assert(result[0] === expected);
            if(values.length == 0)
                c.assert(result[0] === 0);
        });

declare("Riak.reduceMax",
        [arbArray(arbInt)],
        function(c, values){
            var result = Riak.reduceMax(values);
            c.assert(Riak.QC.isSaneReduce(result));
            c.assert(values.length == 0 || result.length == 1);
            if(values.length > 0)
                c.assert(values.every(function(v){ return result[0] >= v;}));
        });

declare("Riak.reduceMin",
        [arbArray(arbInt)],
        function(c, values){
            var result = Riak.reduceMin(values);
            c.assert(Riak.QC.isSaneReduce(result));
            c.assert(values.length == 0 || result.length == 1);
            if(values.length > 0)
                c.assert(values.every(function(v){ return result[0] <= v;}));
        });

declare("Riak.reduceNumericSort",
        [arbArray(arbInt)],
        function(c, values){
            var result = Riak.reduceNumericSort(values);
            c.assert(Riak.QC.isSaneReduce(result));
            c.assert(result.length == values.length);
            if(values.length > 0) {
                for(var i = 0; i < result.length - 1; i++)
                    c.assert(result[i] <= result[i+1]);
            }
        });

declare("Riak.reduceSort",
        [arbArray(arbString)],
        function(c, values){
            var result = Riak.reduceSort(values);
            c.assert(Riak.QC.isSaneReduce(result));
            c.assert(result.length == values.length);
            if(values.length > 0) {
                for(var i = 0; i < result.length - 1; i++)
                    c.assert(result[i] <= result[i+1]);
            }
        });

quit(Riak.QC.verify());
