<h1 align="center">
  <br />
  <br />
  Node Models
  <br />
  <br />
  <br />
</h1>

<h5 align="center">A package that uses lowdb[*](#future-drivers) to create interactive models.</h5>
<p align="center">
  <a href="https://www.npmjs.com/package/@ninetynine/node-models">
    <img src="https://badgen.net/npm/v/@ninetynine/node-models" />
  </a>
  <a href="https://www.npmjs.com/package/@ninetynine/node-models">
    <img src="https://badgen.net/npm/dt/@ninetynine/node-models" />
  </a>
  <a href="https://www.npmjs.com/package/@ninetynine/node-models">
    <img src="http://img.badgesize.io/https://cdn.jsdelivr.net/npm/@ninetynine/node-models@latest/" />
  </a>
</p>

<br />
<br />

#### Contents

* [Installation](#installation)
* [Initial Setup](#initial-setup)
* [Usage](#usage)
* [FAQ](#faq)

<hr />

## Installation

`node-models` can be installed with NPM or Yarn.

```
# Installing with NPM
npm i --save @ninetynine/node-models
```

```
# Installing with Yarn
yarn add @ninetynine/node-models
```

<hr />

## Initial Setup

Currently the only supported driver is `lowdb`, check it out [here][lowdb]. There are plans for [supporting more drivers](#future-drivers)- feel free to open a PR to implement other drivers.

By default lowdb's store file will be placed in the project root under the directory `storage`:

```
# Default path for store file
<root>/storage/db/lowdb.json
```

You can change the default path (not filename) by setting `process.env.STORAGE_PATH`, this can be accomplished easily by using [dotenv][dotenv].

<hr />

## Usage

### Creating

To create a model simply extend the `Model` class from `@ninetynine/node-models`:

```js
// An example of a minimal model
// ./models/user.js
const Model = require('@ninetynine/node-models')

class User extends Model {
  //
}

module.exports = User
```

<hr />

#### Defining The Table

By default the table name is assumed by making use of [pluralize][pluralize]:

```
User -> users
UserLog -> user_logs
```

To define your own table `return` a `string` from the `table` `get`:

```js
// An example of defining the table name
// ./models/user.js
const Model = require('@ninetynine/node-models')

class User extends Model {
  get table() {
    return 'unexpected_table_name'
  }
}

module.exports = User
```

<small><i>The table name is used when `storing` and `finding` instance of the model.</i></small>

<hr />

#### Defining The Primary Key

By default the primary key is assumed `id`. To define your own primary key `return` a `string` from the `primaryKey` `get`:

```js
// An example of defining the primary key
// ./models/user.js
const Model = require('@ninetynine/node-models')

class User extends Model {
  // <snip>

  get primaryKey () {
    return 'unexpected_primary_key'
  }
}

module.exports = User
```

<small><i>This key is used when `storing` and `finding` instances of the model.</small></i>

<hr />

#### Defining The Foreign Key

By default the foreign key is assumed as the snake case name of the model suffixed by `_id`:

```
User -> user_id
UserLog -> user_log_id
```

To define your own foreign key `return` a `string` from the `foreignKey` `get`:

```js
// An example of defining the foreign key
// ./models/user.js
const Model = require('@ninetynine/node-models')

class User extends Model {
  // <snip>

  get foreignKey () {
    return 'unexpected_foreign_key'
  }
}

module.exports = User
```

<small><i>This key is used when referencing the model from a `relation`.</small></i>

<hr />

#### Defining Model Relationships

To define relations `return` an `object` from the `relations` `get`:

```js
// An example of defining relations
// ./models/user.js
const Model, { util } = require('@ninetynine/node-models')

const Address = require('./address')
const Role = require('./role')

class User extends Model {
  // <snip>

  get relations () {
    return {
      address: {
        type: util.relation.belongsTo,
        model: Address
      }
      role: {
        type: util.relation.hasOne,
        model: Role,
        key: 'role_id'
      }
    }
  }

  get fillables() {
    return [
      'address_id'
    ]
  }
}

module.exports = User
```

Reltions work as you might expect:
  - `belongsTo` will check the ID on the current model (`address_id`) against the model (`Address`) and return one instance
  - `hasOne` will check the current ID (`id`) as a foreign key (`user_id`) of the instance against the model (`Address`) and return one instance
  - `hasMany` will check the current ID (`id`) as a foreign key (`user_id`) of the instance against the model (`Address`) and return multiple instances

If no relation is found then `undefined` is returned.

<small><i>A relation will be `return`ed if an attribute with the same name doesn't exist.</i></small>

<hr />

#### Defining Fillable Attributes

To define fillable attributes `return` an `array` of `strings` from the `fillables` `get`:

```js
// An example of defining fillable attributes
// ./models/user.js
const Model = require('@ninetynine/node-models')

class User extends Model {
  // <snip>

  get fillables () {
    return [
      'first_name',
      'last_name',
      'email_address',
      'password'
    ]
  }
}

module.exports = User
```

<small><i>Fillable attributes allow you to `set` an attribute safely.</i></small>

<hr />

#### Defining Hidden Attributes

To define hidden attributes `return` an `array` of `strings` from the `hidden` `get`:

```js
// An example of defining hidden attributes
// ./models/user.js
const Model = require('@ninetynine/node-models')

class User extends Model {
  // <snip>

  get hidden () {
    return [
      'password'
    ]
  }
}

module.exports = User
```

<small><i>Hidden attributes hide specific attributes when return a model instance as an `object`.</small></i>

<hr />

#### Defining Attribute Setters

To define attribute setters `return` an `object` of `functions` from the `setters` `get`:

```js
// An example of defining attribute setters
// ./models/user.js
const Model = require('@ninetynine/node-models')

class User extends Model {
  // <snip>
  
  get setters () {
    return {
      password: value => (
        require('password-hash').generate(value)
      )
    }
  }
}

module.exports = User
```

<small><i>Attribute setters are called before an attribute gets `set`.</small></i>

<hr />

#### Defining Attribute Getters

To define attribute setters `return` an `object` of `functions` from the `setters` `get`:

```js
// An example of defining attribute getters
// ./models/user.js
const Model = require('@ninetynine/node-models')

function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt){
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

class User extends Model {
  // <snip>
  
  get getters () {
    return {
      first_name: value => (
        toTitleCase(value)
      ),
      last_name: value => (
        toTitleCase(value)
      )
    }
  }
}

module.exports = User
```

<small><i>Attribute setters are called before an attribute gets `returned`.</small></i>

<hr />

### Getting And Setting Attributes

#### Set

There are a few different ways of setting an attribute.

```js
const user = new User

// An example of safetly setting an attribute
user.set('first_name', 'john')

// An example of safely setting multiple attributes
user.fill({
  first_name: 'john',
  last_name: 'doe'
})

// An example of unsafely setting an attribute
user.setRaw('first_name', 'john')
```

<small><i>When safely setting an attribute we check to see that the attribute is in `fillables` and then check for a `setter`. Using `setRaw` skips both these steps.</i></small>

<hr />

#### Get

There are a few different ways of getting an attribute.

```js
const user = new User

// An example of safely getting an attribute
user.get('first_name')
// > John

// An example of directly getting a relation
user.getRelation('address')
// > Address

// An example of safely getting all attributes
user.object
user.toObject()
// > { first_name, last_name, email_address }

// An example of unsafely getting an attribute
user.getRaw('first_name')
// > john
```

<small><i>When safely getting an attribute we check to see if that attribute is set, then if there is a `getter` for that attribute. If no attribute is set then we check the `relations`, after that we return `undefined`. `getRaw` simply returns a key from the internal data object.</i></small>

<small><i>`toObject` and `object` return all the attributes that are not in `hidden` and runs them through optional `getters`.</i></small>

<hr />

### Utilities

#### Model

To retrieve the current model simply get `model`:

```js
// An example of getting the current model
const user = new User

user.model
// > User
```

<hr />

#### Auto Increment

By default auto increment is assumed `true`. To disable it pass `false` into the `getIncrement` `get`:

```js
// An example of setting auto increment
// ./models/user.js
const Model = require('@ninetynine/node-models')

class User extends Model {
  // <snip>

  get autoIncrement () {
    return false
  }

  // <snip>
}

module.exports = User
```

<small><i>This is used when `creating` a new model.</i></small>

<hr />

#### Identifier

To get the current identifier simply get `id`:

```js
// An example of getting an instance ID
const user = new User(1)

user.id
// > 1
```

<hr />

#### Next Identifier

To get the _next identifier_ simply get `nextId`:

```js
// An example of getting the next instance ID
const user = new User(1)

user.nextId
// > 2
```

<small><i>This is really only useful if you have `autoIncrement` set to `true`, otherwise a [uuid][uuid] will be generated each time the property is called.</i></small>

<hr />

#### Exists

To check if an instance exists in the data store simply get `exists`:

```js
// An example of checking if an instance exists
const user

user = new User
user.exists
// > false

user = new User(1)
user.exists
// > true
```

<hr />

#### Dirty

To check if an instance has unsaved changes simply get `dirty`:

```js
// An example of checking if an instance is dirty
const user

user = new User(1)
user.set('first_name', 'john')

user.dirty
// > true

user.isDirty()
// > true
```

##### Set

To directly set an attribute to be dirty simply call `setDirty`:

```js
// An example of setting dirty attributes directly
const user = new User(1)

user.dirty
// > false

user.setDirty('first_name')

user.dirty
// > true
```

##### Clear

To directly clean an attribute from being dirty simply call `clearDirty`:

```js
// An example of clearing dirty attributes directly
const user = new User(1)

user.setDirty('first_name')

user.clearDirty('first_name')
user.dirty
// > false

user.setDirty('first_name')
user.setDirty('last_name')

user.clearDirty()
user.dirty
// > false
```

<small><i>If no attribute is passed into `clearDirty` then all attributes are marked as clean.</i></small>

<hr />

## FAQ

<i id="future-drivers"></i>
- Will there be more database drivers in the future?
> Yes, there are plans to include `mysql` and `sqlite` in the future

[lowdb]: https://github.com/typicode/lowdb#readme
[dotenv]: https://github.com/motdotla/dotenv#readme
[pluralize]: https://github.com/blakeembrey/pluralize#readme
[uuid]: https://github.com/kelektiv/node-uuid#readme