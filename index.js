const v = require('validator');
const _ = require('lodash');
const async = require('async');
const Promise = require('promise');

var SCHEMA_TYPES = {
  'any': {filters: [], validators: []},
  'string': {
    filters: [
      function(val){ return val + ''; }
    ],
    validators: []
  },
  'number': {
    filters: [
      function(val){ return Number(val); }
    ],
    validators: [ 'isNumeric' ]
  },
  'integer': {
    filters: [ 'toInt' ],
    validators: [ 'isInt' ],
    errorMessage: 'Invalid value'
  },
  'float': {
    filters: [ 'toFloat' ],
    validators: [ 'isFloat' ],
    errorMessage: 'Invalid value'
  },
  'bool': {
    filters: [ 'toBoolean' ],
    validators: [ 'isBoolean' ],
    errorMessage: 'Invalid value'
  },
  'date': {
    filters: [ 'toDate' ],
    validators: [ 'isDate' ],
    errorMessage: 'Invalid value'
  },
  'email': {
    filters: [ 'normalizeEmail' ],
    validators: [ 'isEmail' ],
    errorMessage: 'Invalid email address'
  },
  'alpha': {
    filters: [],
    validators: [ 'isAlpha' ],
    errorMessage: 'Invalid value'
  },
  'alnum': {
    filters: [],
    validators: [ 'isAlphanumeric' ],
    errorMessage: 'Invalid value'
  },
  'decimal': {
    filters: [],
    validators: [ 'isDecimal' ],
    errorMessage: 'Invalid value'
  },
  'mongoid': {
    filters: [],
    validators: [ 'isMongoId' ],
    errorMessage: 'Invalid value'
  },
  'url': {
    filters: [],
    validators: [ 'isURL' ],
    errorMessage: 'Invalid URL'
  },
  'uuid': {
    filters: [],
    validators: [ 'isUUID' ],
    errorMessage: 'Invalid value'
  },
  'radio': {
    filters: [],
    validators: [function(val, field){
      return field.options.hasOwnProperty(val)
    }],
    errorMessage: 'Invalid value'
  },
  'select': {
    filters: [],
    validators: [function(val, field){
      return field.options.hasOwnProperty(val)
    }],
    errorMessage: 'Invalid value'
  },
  'checkbox': {
    filters: [],
    validators: [function(val, field){
      for(var i=0; i < val.length; i++){
        if(!field.options.hasOwnProperty(val)){
          return false
        }
      }
      return true
    }],
    errorMessage: 'Invalid value'
  },
  'schema': {
    filters: [],
    validators: [],
    fields: []
  }
};


var checkSchemaField = function(field){
  return new Promise(function(resolve, reject){
    var f = _.assign({}, field);

    if(!f.type){
      f.type = 'any';
    }

    // Check name property
    if(typeof f.name === undefined){
      return reject('Missing name property');
    }

    // Check type
    if(!SCHEMA_TYPES[f.type]){
      return reject('Unknown field type: ' + f.type);
    }
    else{
      f = _.assign(f, SCHEMA_TYPES[f.type]);
    }

    // Add default validators and filters if available

    f.validators = _.concat(SCHEMA_TYPES[f.type].validators, field.validators || []);
    f.filters = _.concat(SCHEMA_TYPES[f.type].filters, field.filters || []);

    return resolve(f);
  });
}


var validateField = function(field, value){
  // Use default if value is empty
  if((value === null || value === '' || value === undefined) && field.default){
    value = field.default;
  }

  var fieldSchema = field;

  if(_.isArray(fieldSchema)){
    fieldSchema = field[0];
  }

  return new Promise(function(resolve, reject){
    checkSchemaField(fieldSchema)
    .then(function(field){
      var todo = [];
      var values = _.isArray(value) ? value : [value];

      _.forEach(values, function(val){

        // Check if required
        if(field.hasOwnProperty('required') && field.required === true){
          if((_.isArray(value) && values.length < 1) || (value === null || value === '' || value === undefined)){
            return reject(fieldSchema.errorMessage || 'This field is required');
          }
        }


        _.forEach(field.validators, function(validator){
          if(['string', 'function'].indexOf(typeof validator) < 0){
            return;
          }

          todo.push(function(cb){
            var result = typeof validator === 'function' ? validator(val, field) : v[validator](val);
            var errorMessage = fieldSchema.errorMessage || field.errorMessage;

            if(result.hasOwnProperty('then') && typeof result.then === 'function'){ // Promise returned
              result.then(function(result){
                cb(null, val);
              }, function(err){
                cb(errorMessage || err, val);
              });
            }
            else{
              cb(result === true ? null : (errorMessage || result || val), val);
            }
          });
        });

      });



      async.parallel(todo, function(err, result){
        if(err !== null){
          reject(err);
        }
        else {
          // Run filters on value before resolving it
          var newVal = value;

          _.forEach(field.filters, function(filtr){
            newVal = typeof filtr === 'function' ? filtr(newVal) : v[filtr](newVal);
          });

          resolve(newVal);
        }
      });
    }, reject);
  });
}


var validate = function(schema, data){
  return new Promise(function(resolve, reject){
    var todo = [];
    var fnames = [];

    _.forEach(schema, function(field, fname){

      field['name'] = field.name || fname;
      const value = data[field.name] || null;

      // console.log(field.name + ' = ' + value);

      fnames.push(fname);

      todo.push(function(cb){
        validateField(field, value)
        .then(function(value){
          cb(null, value);
        }, function(err){
          cb(err);
        })
      });
    });

    async.parallel(todo, function(err, results){
      if(err !== null){
        reject(err);
      }
      else{
        var final = {};
        for(var i=0; i < fnames.length; i++){
          final[fnames[i]] = results[i];
        }
        resolve(final);
      }
    })
  });
}



module.exports = {
  checkSchemaField: checkSchemaField,
  validateField: validateField,
  validate: validate
};
