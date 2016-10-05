var assert = require('assert');
var Promise = require('promise');
// var should = require('chai').should();

var errorCallback = function(err){
  throw new Error('Test failed: ' + err);
}
var successCallback = function(value){
  assert(true, true);
}

const vschema = require('../index.js');



describe('Schema', function() {

  describe('#checkSchemaField()', function() {

    it('should resolve if field is valid', function() {
      return vschema.checkSchemaField({
        name: 'myfield'
      });
    });

    it('should not resolve if field type is invalid', function() {
      return vschema.checkSchemaField({
        name: 'myfield',
        type: 'unknown-type'
      })
      .then(function(f){
        console.log(f);
        throw new Error('Should not resolve');
      }, successCallback);
    });


  });

  describe('#checkSchema()', function() {

  });


  describe('#validateField()', function() {

    // For each one of those we will check check valid and invalid values as well as returned value type
    const validationData = [
      {
        type: 'string',
        valid: 'abcd'
      },
      {
        type: 'string',
        valid: 12345,
        expectedType: 'string'
      },
      {
        type: 'number',
        valid: '12345',
        invalid: 'abcd',
        expectedType: 'number'
      },
      {
        type: 'integer',
        valid: '1235',
        invalid: 'abcd',
        expectedType: 'number'
      },
      {
        type: 'float',
        valid: '123.45',
        invalid: 'abcd',
        expectedType: 'number'
      },
      {
        type: 'bool',
        valid: 'true',
        invalid: 'abcd',
        expectedType: 'boolean'
      },
      {
        type: 'bool',
        valid: 'false',
        invalid: 'abcd',
        expectedType: 'boolean'
      },
      {
        type: 'bool',
        valid: '1',
        invalid: 'abcd',
        expectedType: 'boolean'
      },
      {
        type: 'bool',
        valid: '0',
        invalid: 'abcd',
        expectedType: 'boolean'
      },
      {
        type: 'date',
        valid: '2016-01-01',
        invalid: 'abcd',
        expectedType: 'object'
      },
    ];

    var testValidator = function(validator){
      if(validator.valid !== undefined){
        it('should validate ' + validator.type + ' with valid data', function() {

          return vschema.validateField({
            name: 'myfield',
            type: validator.type
          }, validator.valid)
          .then(function(value){
            if(validator.expectedType !== undefined && typeof value !== validator.expectedType){
              throw new Error('Expected type ' + validator.expectedType);
            }
          });

        });
      }


      if(validator.invalid !== undefined){
        it('should validate ' + validator.type + ' with invalid data', function() {

          return vschema.validateField({
            name: 'myfield',
            type: validator.type
          }, validator.invalid)
          .then(errorCallback, successCallback);

        });
      }
    }

    for(var i=0; i < validationData.length; i++){
      testValidator(validationData[i]);
    }


    it('should resolve if no field type is provided', function() {
      return vschema.validateField({
        name: 'myfield'
      }, 'hello');
    });


    it('should use additional validators', function() {
      return vschema.validateField({
        name: 'myfield',
        type: 'string',
        validators: [
          function(val){ return false; }
        ]
      }, 'hello')
      .then(errorCallback, successCallback);
    });


    it('should use additional validators async', function() {
      return vschema.validateField({
        name: 'myfield',
        type: 'string',
        validators: [
          function(val){
            return new Promise(function(resolve, reject){
              setTimeout(function(){
                reject('Invalid');
              }, 200);
            });
          }
        ]
      }, 'hello')
      .then(errorCallback, successCallback);
    });


    it('should use additional filters', function() {
      return vschema.validateField({
        name: 'myfield',
        type: 'string',
        filters: [function(val){ return 'MYFILTER' }]
      }, 'hello')
      .then(function(value){
        assert.equal(value, 'MYFILTER');
      });
    });


    it('should use default value if no other value is given', function() {
      return vschema.validateField({
        name: 'myfield',
        type: 'email',
        default: 'hello@world.com'
      }, null)
      .then(function(value){
        assert.equal(value, 'hello@world.com');
      });
    });



    it('should check required fields', function() {
      return vschema.validateField({
        name: 'myfield',
        required: true
      }, '')
      .then(errorCallback, successCallback);
    });


    it('should use custom error messages', function() {
      return vschema.validateField({
        name: 'myfield',
        required: true,
        errorMessage: 'My Custom Error'
      }, '')
      .then(errorCallback, function(err){
        console.log(err);
        assert(err === 'My Custom Error', true);
      });
    });

  });


  describe('#validate()', function() {
    it('should validate schema', function() {
      return vschema.validate({
        name: {
          type: 'alpha',
        },
        email: {
          type: 'email',
        },
        phone: {
          type: 'number',
        },
        birthdate: {
          type: 'date',
        },
        favoriteColors: [{
          type: 'string',
          validators: [
            function(val){ // Hex Color
              return val.startsWith('#') && val.length === 7;
            }
          ],
          filters: [
            function(val){
              return val.toLowerCase();
            }
          ]
        }]
      }, {
        name: 'John',
        email: 'john@doe.com',
        phone: '001122334455',
        birthdate: '1985-01-01',
        favoriteColors: ['#AAAAAA', '#bbbbbb', '#cccccc']
      })
      .then(function(results){
        // console.log(results);
        assert(true, true);
      });
    });
  });

});
