const pluralize = require('pluralize')
const uuid = require('uuid')

const { relation } = require('./util')
const db = require('./db')

class Model {
  constructor (id, fill) {
    this._data = {}
    this._dirty = {}

    if (!this.hasStore()) {
      this.createStore()
    }

    if (id) {
      if (typeof id === 'object') {
        this.fill(id)
      }

      if (fill && typeof fill === 'object') {
        return this.findOrCreate(id, fill)
      }

      return this.find(id)
    }
  }

  get model () {
    return this.constructor.name
  }

  get table () {
    return pluralize.plural(
      this.snakeCase
    )
  }

  get autoIncrement () {
    return true
  }

  get primaryKey () {
    return 'id'
  }

  get foreignKey () {
    return `${this.snakeCase}_id`
  }

  get id () {
    return this.getRaw(this.primaryKey)
  }

  get nextId () {
    if (!this.autoIncrement) {
      return uuid()
    }

    const obj = db
      .get(this.table)
      .sortBy(this.primaryKey)
      .last()
      .value()

    if (obj) {
      return obj[this.primaryKey] + 1
    }

    return 1
  }

  get exists () {
    if (!this.id) {
      return false
    }

    return !!db
      .get(this.table)
      .find({ [this.primaryKey]: this.id })
      .value()
  }

  get dirty () {
    return this.isDirty()
  }

  get snakeCase () {
    return this.model
      .split(/(?=[A-Z])/)
      .join('_')
      .toLowerCase()
  }

  get object () {
    return this.toObject()
  }

  get relations () {
    return {}
  }

  get fillables () {
    return []
  }

  get hidden () {
    return []
  }

  get setters () {
    return {}
  }

  get getters () {
    return {}
  }

  hasAttribute (attr) {
    return this._data.hasOwnProperty(attr)
  }

  hasRelation (attr) {
    return this.relations.hasOwnProperty(attr)
  }

  hasGetter (attr) {
    return this.getters.hasOwnProperty(attr)
  }

  hasSetter (attr) {
    return this.setters.hasOwnProperty(attr)
  }

  isFillable (attr) {
    return this.fillables.includes(attr)
  }

  isHidden (attr) {
    return this.hidden.includes(attr)
  }

  isDirty (attr) {
    if (attr) {
      return this._dirty.hasOwnProperty(attr)
    }

    return Object
      .keys(this._dirty)
      .filter(d => d)
      .length > 0
  }

  getRaw (attr) {
    return this._data[attr]
  }

  getRelation (attr) {
    const { type, model: Model, key } = this.relations[attr]
    let instance = new Model()

    if (type === relation.type.belongsTo) {
      const id = this.getRaw(key || instance.foreignKey)
      instance = instance.find(id)

      if (instance.exists) {
        return instance
      }
    }

    if (type === relation.type.hasOne) {
      instance = instance.where({ [key || this.foreignKey]: this.id }, 1)

      if (instance.exists) {
        return instance
      }
    }

    if (type === relation.type.hasMany) {
      const instances = instance.where({ [key || this.foreignKey]: this.id })

      return instances.filter(instance => instance.exists)
    }

    return undefined
  }

  get (attr) {
    if (this.hasAttribute(attr)) {
      if (this.hasGetter(attr)) {
        return this.getters[attr]()
      }

      return this.getRaw(attr)
    }

    if (this.hasRelation(attr)) {
      return this.getRelation(attr)
    }

    return undefined
  }

  setRaw (attr, value) {
    this._data[attr] = value

    return this
  }

  setDirty (attr) {
    this._dirty[attr] = true

    return this
  }

  clearDirty (attr) {
    if (attr) {
      this._dirty[attr] = false
    } else {
      this._dirty = {}
    }

    return this
  }

  fill (obj) {
    Object.entries(obj).forEach(data => (
      this.set(...data)
    ))
  }

  set (attr, value) {
    if (this.isFillable(attr)) {
      this.setDirty(attr)

      if (this.hasSetter(attr)) {
        this._data[attr] = this.setters[attr](value)
      } else {
        this.setRaw(attr, value)
      }
    }

    return this
  }

  hasStore () {
    return db
      .has(this.table)
      .value()
  }

  createStore () {
    db.set(this.table, [])
      .write()

    return this
  }

  find (id) {
    const data = db
      .get(this.table)
      .find({ [this.primaryKey]: id })
      .value()

    if (data) {
      Object.entries(data).forEach(([attr, value]) => (
        this.setRaw(attr, value)
      ))
    }

    return this
  }

  findOrCreate (id, fill = {}) {
    let instance = this.find(id)

    if (instance.exists) {
      return instance
    }

    instance = new this.constructor()

    instance.fill(fill)
    instance.save()

    return instance
  }

  where (obj, limit) {
    const data = db
      .get(this.table)
      .filter(item => {
        let valid = true

        for (const attr in obj) {
          if (obj.hasOwnProperty(attr)) {
            const value = obj[attr]

            if (item.hasOwnProperty(attr)) {
              let remote = null

              if (this.hasGetter(attr)) {
                remote = this.getters[attr](item[attr])
              } else {
                remote = item[attr]
              }

              if (remote === value) {
                continue
              }
            }

            valid = false

            break
          }
        }

        return valid
      })
      .value()

    if (Array.isArray(data)) {
      const instances = []

      for (let i = 0; i < data.length; i++) {
        if (limit && i === limit) {
          break
        }

        const instance = new this.constructor()
        const current = data[i]

        Object.entries(current).forEach(([attr, value]) => (
          instance.setRaw(attr, value)
        ))

        instances.push(instance)
      }

      if (limit) {
        if (limit === 1) {
          return instances[0] || this
        }

        return instances.slice(0, limit)
      }

      return instances
    }

    if (typeof data === 'object') {
      Object.entries(data).forEach(([attr, value]) => (
        this.setRaw(attr, value)
      ))
    }

    return this
  }

  update (obj, value) {
    if (obj) {
      if (typeof obj === 'string') {
        this.set(obj, value)
      } else if (typeof obj === 'object') {
        Object.entries(obj).forEach(([attr, value]) => (
          this.set(attr, value)
        ))
      }
    }

    return this.save()
  }

  save () {
    const data = {}

    this.fillables.forEach(fillable => {
      if (this.hasAttribute(fillable)) {
        data[fillable] = this.get(fillable)
      }
    })

    if (this.exists) {
      db
        .get(this.table)
        .find({
          [this.primaryKey]:
            this.getRaw(this.primaryKey)
        })
        .assign(data)
        .write()
    } else {
      this.setRaw(this.primaryKey, this.nextId)

      data[this.primaryKey] = this.id

      db
        .get(this.table)
        .push(data)
        .write()
    }

    this.clearDirty()

    return this
  }

  toObject () {
    const obj = {}
    const keys = Object.keys(this._data)
      .filter(key => (
        !this.hidden.includes(key)
      ))

    keys.forEach(key => {
      obj[key] = this.get(key)
    })

    return obj
  }
}

module.exports = Model
