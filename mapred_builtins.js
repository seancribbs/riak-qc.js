var Riak = {
    mapValues: function(value, keyData, arg) {
        if (value["not_found"]) {
            return [value];
        }
        var data = value["values"][0]["data"];
        if (Riak.getClassName(data) !== "Array") {
            return [data];
        }
        else {
            return data;
        }},
    mapValuesJson: function(value, keyData, arg) {
        if (value["not_found"]) {
            return [value];
        }
        var newValues = Riak.mapValues(value, keyData, arg);
        return newValues.map(function(nv) { return JSON.parse(nv); });
    },
    mapByFields: function(value, keyData, fields) {
        if(!value.not_found) {
            var object = Riak.mapValuesJson(value)[0];
            for(field in fields) {
                if(object[field] != fields[field]) {
                    return [];
                }
            }
            return [object];
        }
        else {
            return [];
        }
    },
    reduceSum: function(values, arg) {
        values = Riak.Util.filterNotFound(values);
        if (values.length > 0) {
            return [values.reduce(function(prev, curr, index, array) { return prev + curr; } )];
        }
        else {
            return [0];
        }},
    reduceMin: function(values, arg) {
        if(values.length == 0)
            return [];
        else
            return [values.reduce(function(prev,next){ return (prev < next) ? prev: next; })];
    },
    reduceMax: function(values, arg) {
        if(values.length == 0)
            return [];
        else
            return [values.reduce(function(prev,next){ return (prev > next) ? prev: next; })];
    },
    reduceSort: function(values, arg) {
        if(arg){
            try {
                var c = eval(arg);
                return values.sort(c);
            }
            catch (e) {
                return values.sort();
            }
        } else {
            return values.sort();
        }
    },
    reduceNumericSort: function(value, arg) {
        value.sort(Riak.Util.numericSorter);
        return value;
    },
    reduceLimit: function(value, arg) {
        return value.slice(0, arg - 1);
    },
    reduceSlice: function(value, arg) {
        var start = arg[0];
        var end = arg[1];
        if (end > value.length) {
            return value;
        }
        else {
            return value.slice(start, end);
        }
    }
};

Riak.Util = {
    getClassName: function(obj) {
        if (obj && obj.constructor && obj.constructor.toString) {
            var arr = obj.constructor.toString().match(/function\s*(\w+)/);
            if (arr && arr.length == 2) {
                return arr[1];
            }
        }
        return undefined;
    },
    filterNotFound: function(values) {
        return values.filter(function(value, index, data) {
                                 return value ? !value.not_found : true;
                             });
    },
    numericSorter: function(first, second) {
        return first - second;
    }
};
