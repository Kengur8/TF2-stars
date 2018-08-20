DEBUG = 0;

function log(obj, obj2) {
    if (DEBUG) {
        console.log(obj);
        if (obj2) console.log(obj2);

    }

}

function isFunction(func) {
    var getType = {};
    return func && getType.toString.call(func) === '[object Function]';
}

var XHR = function(obj, source) {
    //log("XHR " + source.name, obj.id64);
    var req = new XMLHttpRequest();
    req.open("GET", source.url, true);
    if (source.type) req.setRequestHeader("Accept", source.type);
    req.onreadystatechange = function() {
        if (req.readyState == 4) {
            if (req.status == 200) {
                if (source.next) XHR(obj, source.next);
                obj[source.onload](req); //Parser
            } else {
                //log(req.statusText + " " + source.url, obj);
                obj.callback();
            }
        }
    };
    //req.timeout = source.timeout;
    req.ontimeout = function(resp) {
        //log("Timeout " + source.url, obj);
        obj.callback();
    };
    req.send();

};

NBSP = String.fromCharCode(160);

function sortNumber(a, b) {
    return a - b;

}

function isEmpty(obj) {
    if (obj !== undefined && obj !== null) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop))
                return false;

        }


    }
    return true;

}

function inArray(obj, array) {
    if (DEBUG) {
        if (array !== undefined && array !== null && array.length === undefined) {
            throw new Error(array + " is not an array (inArray)");
        }
    }
    if (array !== undefined && array !== null && array.indexOf(obj) >= 0) return true;
    return false;

}

function atIndex(obj, index) {
    if (obj !== undefined && obj !== null) {
        var len = Object.keys(obj).length;
        if (index >= 0 && index < len) return Object.keys(obj)[index];
        else if (index < 0 && -index <= len) return Object.keys(obj)[len + index];

    }
    return null;

}

function randArray(array) {
    return array[~~(Math.random() * array.length)];

}

function matchString(match, list) {
    var mylist = [];
    if (!isEmpty(list)) {
        for (var i = 0; i < list.length; i++) {
            if (list[i].indexOf(match) >= 0) mylist.push(list[i]);

        }

    }
    return mylist;

}

function sizeBytes(size) {
    var i = -1;
    var byteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB'];
    do {
        size = size / 1024;
        i++;

    } while (size > 1024);
    return size.toFixed(1) + byteUnits[i];


}

function unixtime(seconds) {
    var time = new Date(0);
    time.setSeconds(seconds);
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var year = time.getFullYear();
    var month = months[time.getMonth()];
    var date = time.getDate();
    var string = date + '&nbsp;' + month + '&nbsp;' + year;
    return string;

}

function unixtime_years_since(seconds) {
    var time = new Date(0);
    time.setSeconds(seconds);
    var diff = new Date(Date.now() - time.getTime());
    return Math.abs(diff.getFullYear() - 1970);

}

function dayssince(seconds) {
    return (Date.now() - seconds) / (1000 * 3600 * 24);
}

function addStyle(e) {
    var t = document.createElement("style");
    t.type = "text/css";
    t.appendChild(document.createTextNode(e));
    document.getElementsByTagName("head")[0].appendChild(t);
}

function addElement(e) {
    document.getElementsByTagName("body")[0].appendChild(e);
}

function addContent(e) {
    var t = document.createElement("div");
    t.innerHTML = e;
    document.getElementsByTagName("body")[0].appendChild(t);
}

function extScript(id, url) {
    var t = document.createElement("script");
    t.type = "text/javascript";
    t.id = id;
    t.src = url;
    document.getElementsByTagName("head")[0].appendChild(t);
}

function extStyle(id, url) {
    var t = document.createElement("link");
    t.type = "text/javascript";
    t.rel = "stylesheet";
    t.id = id;
    t.href = url;
    document.getElementsByTagName("head")[0].appendChild(t);
}

function addScript(id, e) {
    var t = document.createElement("script");
    t.type = "text/javascript";
    if (id) {
        if (document.getElementById(id) !== null) removeElement(id);
        t.id = id;
    }
    t.appendChild(document.createTextNode("/*<![CDATA[*/ \n" + e + "\n/*]]>*/ "));
    document.getElementsByTagName("head")[0].appendChild(t);
}

function removeElement(id) {
    var e = document.getElementById(id);
    if (e !== null) e.parentNode.removeChild(e);
}

function matchString(match, list) {
    var mylist = [];
    if (!isEmpty(list)) {
        for (var i = 0; i < list.length; i++) {
            if (list[i].indexOf(match) >= 0) mylist.push(list[i]);
        }
    }
    return mylist;
}
