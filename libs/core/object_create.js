 if (typeof Object.create !== 'function') {
     Object.create = function (o) {
         function F () {}
         F.prototype = o;
         return new F();
     };
 }
// call like
// newObject = Object.create(inheritFromThisObject); // don't need to use new or call util.inherits
