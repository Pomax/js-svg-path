var API = require("./library.js");
const outline = API.parse("M 68.8 49 V 21.9 c 0 -8.3 -2.8 -11.5 -8.2 -11.5 c -6.6 0 -9.3 4.7 -9.3 11.4 v 16.8 h 6.4 V 49 H 37.6 V 21.9 c 0 -8.3 -2.8 -11.5 -8.2 -11.5 c -6.6 0 -9.3 4.7 -9.3 11.4 v 16.8 h 9.2 V 49 H 0 V 38.7 h 6.4 V 11.4 H 0.1 V 1 h 20 v 7.2 C 23 3.1 28 0 34.7 0 C 41.6 0 48 3.3 50.4 10.3 C 53 3.9 58.5 0 66 0 c 8.6 0 16.5 5.2 16.5 16.6 v 22 h 6.4 V 49 H 68.8 Z");
const bbox = [ 0, 0, 88.9, 49 ];
outline.bounds.forEach( (v,idx) => { if (bbox[idx]!==v) process.exit(1); });
