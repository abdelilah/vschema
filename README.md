# vschema

Schema validation can be used to validate data coming from forms, HTTPS requests and basically anything that needs to match a specific schema.


## Usage

```javascript
var vschema = require('vschema');
var mySchema = {
	name: {
      type: 'alpha',
    },
    email: {
      type: 'email',
      required: true
    },
    phone: {
      type: 'number',
    },
    birthdate: {
      type: 'date',
    },
    gender: {
      type: 'radio',
      options: {
      	male: 'Male',
      	female: 'Female'
      }
    },
    favoriteColors: [{ // An array of elements
      type: 'string',
      validators: [ // Custom validation
        function(val){ // Hex Color
          return val.startsWith('#') && val.length === 7;
        }
      ],
      filters: [ // Custom filters
        function(val){
          return val.toLowerCase();
        }
      ]
    }]
};

var myData = {
	name: 'John',
    email: 'john@doe.com',
    phone: '001122334455',
    birthdate: '1985-01-01',
    favoriteColors: ['#AAAAAA', '#bbbbbb', '#cccccc']
};

// Validate myData against mySchema
vschema.validate(mySchema, myData)
.then(function(values){
	console.log(values); // Final values after applying filters on them
}, function(errors){
	console.log(errors);
});


// You can also validate a single field like this:
/*
vschema.validateField({
	name: 'fieldname',
	type: 'email'
}, 'invalidEmailAddress').then(...);
*/

```

## Built in data types

* string
* number
* integer
* float
* select
* radio
* checkbox
* bool
* date
* color
* email
* alpha
* alnum
* decimal
* mongoid
* url
* uuid
* schema

## Built in filters

* escape:  replace <, >, &, ', " and / with HTML entities
* unescape: replaces HTML encoded entities with <, >, &, ', " and /
* ltrim: trim characters from the left-side of the input
* normalizeEmail: canonicalizes an email address
* rtrim: trim characters from the right-side of the input
* stripLow: remove characters with a numerical value < 32 and 127, mostly control characters
* toBoolean: convert the input string to a boolean. Everything except for '0', 'false' and '' returns true
* toDate: convert the input string to a date, or null if the input is not a date
* toFloat: convert the input string to a float, or NaN if the input is not a float
* toInt: convert the input string to an integer, or NaN if the input is not an integer
* trim: trim characters (whitespace by default) from both sides of the input

## Custom validators

In addition to built in validators, you can also use your own either synchronously or asynchronously:

```javascript
vschema.validateField({
	name: 'myfield',
	type: 'string',
	validators: [
	  function(val){ // Synchronous validation: either return true or anything else describing the error
	  	return true;
	  },
	  function(val){ // To do async validation, simply return a promise
	    return new Promise(function(resolve, reject){
	      setTimeout(function(){
	        reject('Invalid');
	      }, 200);
	    });
	  }
]
}, 'hello');

```


## Custom filters

Please see the usage section
