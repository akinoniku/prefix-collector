#!/usr/bin/env node

const levenshtein = require('fast-levenshtein')
const common = require('common-prefix')
const prog = require('caporal')
const shell = require('shelljs')
const path = require('path')
const fs = require('fs')
const lodash = require('lodash')

const trimDirName = (originalPathName) => {
  let trimmedName = originalPathName
  const match1 = /S\d{1,2}E?/.exec(originalPathName)
  if(match1) {
    trimmedName = trimmedName.slice(0, match1.index)
  }
  let lastChar = trimmedName.slice(trimmedName.length - 1)
  while (lastChar.match(/[\d]|[\[ -.]/)) {
    trimmedName = trimmedName.slice(0, trimmedName.length - 1)
    lastChar = trimmedName.slice(trimmedName.length - 1)
  }
  return trimmedName
}

prog
  .version('1.0.0')
  .argument('<path>', 'path to run collection')
  .argument('[deviation]', 'optional number: acceptable deviation, default 7')
  .action((args, options, logger) => {
    const {path: mainPath, deviation: defaultDeviation} = args
    const deviation = defaultDeviation || 7
    const allFilesAndDir = shell.ls(mainPath)
    const allFiles = allFilesAndDir.filter(filename => fs.statSync(path.join(mainPath, filename)).isFile()).sort()
    const allFileArraysResult = allFiles.reduce((result, currentFile) => {
      const {arrays, currentArray} = result
      const lastFile = lodash.last(currentArray)
      if(currentFile === lastFile) return result
      const isFileLengthAcceptable = lastFile && currentFile && (currentFile.length > deviation + 3)
      const isFileLevenshteinAcceptable = isFileLengthAcceptable && levenshtein.get(currentFile, lastFile) < deviation
      if (isFileLevenshteinAcceptable) {
        return {arrays: arrays, currentArray: [...currentArray, currentFile]}
      } else {
        return {arrays: [...arrays, [...currentArray]], currentArray: [currentFile]}
      }
    }, {arrays: [], currentArray: [allFiles[0]]})
    const fileArrays = [...allFileArraysResult.arrays, allFileArraysResult.currentArray].filter(arr => arr.length > 1)
    fileArrays.forEach(fileArr => {
      const commName = common(fileArr)
      const pathName = trimDirName(commName)
      const newDir = path.join(mainPath, pathName)
      shell.mkdir(newDir)
      fileArr.forEach((fileName)=> {
        const oldPath = path.join(mainPath, fileName)
        const newPath = path.join(newDir, fileName)
        shell.mv(oldPath, newPath)
      })
      console.log(pathName, 'ok~')
    })
    console.log('all done')
  })

prog.parse(process.argv)

/*
const result = levenshtein.get('[DHR][Boruto - Naruto Next Generations][01][BIG5][720P][AVC_AAC].mp4', '[DHR][Boruto - Naruto Next Generations][02][BIG5][720P][AVC_AAC].mp4')
const com = common(['[DHR][Boruto - Naruto Next Generations][01][BIG5][720P][AVC_AAC].mp4', '[DHR][Boruto - Naruto Next Generations][02][BIG5][720P][AVC_AAC].mp4'])
console.log('com', com)
console.log('result', result)
*/