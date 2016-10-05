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
