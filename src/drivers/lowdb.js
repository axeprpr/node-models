const path = require('path')
const fs = require('fs')

const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const storage = process.env.STORAGE_PATH || 'storage/db'
const storagePath = path.join(process.cwd(), storage, 'lowdb.json')

storage.split('/').forEach((bit, i, bits) => {
  let prefixed = bit

  if (i > 0) {
    prefixed = path.join(...bits.slice(0, i), prefixed)
  }

  prefixed = path.join(process.cwd(), prefixed)

  if (!fs.existsSync(prefixed)) {
    fs.mkdirSync(prefixed)
  }
})

const adapter = new FileSync(storagePath)
const instance = low(adapter)

module.exports = instance
