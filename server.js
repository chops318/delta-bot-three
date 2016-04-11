/*
Corner Cases
Deleted comments are affecting the get new comment
Edited comments are not handled
*/

import 'colors'
import _ from 'lodash'
import promisify from 'promisify-node'
import Koa from 'koa'
import Router from 'koa-router'
import Reddit from './RedditAPIDriver'
import i18n from './i18n'
import { stringify } from 'query-string'
let locale = 'en-us'
const dev = true
let subreddit = 'changemyview'
let botUsername = 'DeltaBot'
if (dev) {
  subreddit = 'changemyviewDB3Dev'
  botUsername = 'DeltaBot3'
}
const app = new Koa()
const router = new Router()
const fs = require('fs')
fs.writeFile = promisify(fs.writeFile)
let state = require('./state.json')
let lastParsedCommentID = state.lastParsedCommentID || null
console.log(`server.js called!`.gray)
try {
  var credentials = require('./credentials')
} catch (err) {
  console.log('Missing credentials! Please contact the author for credentials or create your own credentials json!'.red)
  console.log(`{
  "username": "Your Reddit username",
  "password": "Your Reddit password",
  "clientID": "Your application ID",
  "clientSecret": "Your application secret"
}`.red)
}
const reddit = new Reddit(credentials)
const entry = async (f) => {
  await reddit.connect()
  if (lastParsedCommentID) {
    const query = {after: lastParsedCommentID}
    let response = await reddit.query(`/r/${subreddit}/comments?${stringify(query)}`)
    if (!response.data.children.length) {
      lastParsedCommentID = null
      await fs.writeFile('./state.json', '{}')
      console.log('something up with lastparsedcommend. Removed')
    }
  }
};entry()

const getNewComments = async (recursiveList) => {
  recursiveList = recursiveList || []
  let query = {}
  if (lastParsedCommentID) query.before = lastParsedCommentID
  let response = await reddit.query(`/r/${subreddit}/comments?${stringify(query)}`)
  recursiveList = recursiveList.concat(response.data.children)
  const commentEntriesLength = response.data.children.length
  if (commentEntriesLength) {
    lastParsedCommentID = response.data.children[0].data.name
    await fs.writeFile('./state.json', JSON.stringify({ lastParsedCommentID }, null, 2))
  }
  switch (true) {
    case (commentEntriesLength === 25):
      return await getNewComments(recursiveList)
    case (commentEntriesLength !== 25):
    case (commentEntriesLength === 0):
      return recursiveList
  }
}

const checkForDeltas = async () => {
  try {
    let comments = await getNewComments()
    _.each(comments, (entry, index) => {
      const { link_title, link_id, author, body, body_html, edited, parent_id, name, author_flair_text, link_url, created_utc, created } = entry.data
      comments[index] = { link_title, link_id, author, body, body_html, edited, parent_id, name, author_flair_text, link_url, created_utc, created }
      const removedBodyHTML = body_html.replace(/blockquote&gt;[^]*\/blockquote&gt;/,'').replace(/pre&gt;[^]*\/pre&gt;/,'')
      if (!!removedBodyHTML.match(/&amp;#8710;|&#8710;|∆|Δ|!delta/)) verifyThenAward(comments[index])
    })
  } catch (err) {
    console.log('Error!'.red)
    err
  }
}

router.get('/getNewComments', async (ctx, next) => {
  try {
    let comments = await getNewComments()
    let body = comments
    ctx.body = body
  } catch (err) {
    console.log('Error!'.red)
    ctx.body = err
  }
  await next()
})
router.get('/checkForDeltas', async (ctx, next) => {
  try {
    let comments = await getNewComments()
    await checkForDeltas()
    let body = comments
    ctx.body = body
  } catch (err) {
    console.log('Error!'.red)
    ctx.body = err
  }
  await next()
})
router.get('/dynamic/*', async (ctx, next) => {
  let response = await reddit.query(`/${ctx.params['0']}?${stringify(ctx.query)}`)
  if (ctx.params['0'] === `r/${subreddit}/comments?`) {
    const { children } = response.data
    _.each(children, (entry, index) => {
      const { link_title, link_id, author, body, edited, parent_id, name, author_flair_text, link_url, created_utc, created } = entry.data
      children[index] = { link_title, link_id, author, body, edited, parent_id, name, author_flair_text, link_url, created_utc, created }
    })
  }
  ctx.body = response
  await next()
})

const verifyThenAward = async ({ author, body, link_id: linkID, name, parent_id: parentID }) => {
  try {
    console.log( author, body, linkID, parentID )
    let query = {
      parent: name,
      text: ''
    }
    let issueCount = 0
    let json = await reddit.query(`/r/${subreddit}/comments/${linkID.slice(3)}/?comment=${parentID.slice(3)}`)
    let parentThing = json[1].data.children[0].data
    if (!parentID.match(/^t1_/g)) {
      parentThing = json[0].data.children[0].data
      console.log('BAILOUT delta tried to be awarded to listing')
      console.log(parentID)
      let text = i18n[locale].noAward.op
      if (query.text.length) query.text += '\n\n'
      query.text += text
      ++issueCount
    }
    if (body.length < 50) {
      console.log(`BAILOUT body length, ${body.length}, is shorter than 50`)
      let text = i18n[locale].noAward.littleText
      text = text.replace(/PARENTUSERNAME/g, parentThing.author)
      if (query.text.length) query.text += '\n\n'
      query.text += text
      ++issueCount
    }
    if (parentThing.author === botUsername) {
      console.log(`BAILOUT parent author, ${parentThing.author} is bot, ${botUsername}`)
      let text = i18n[locale].noAward.db3
      if (query.text.length) query.text += '\n\n'
      query.text += text
      ++issueCount
    }
    if (parentThing.author === author) {
      console.log(`BAILOUT parent author, ${parentThing.author} is author, ${author}`)
      let text = i18n[locale].noAward.self
      if (query.text.length) query.text += '\n\n'
      query.text += text
      ++issueCount
    }
    if (!('text' in query)) {
      console.log('THIS ONE IS GOOD. AWARD IT')
      let text = i18n[locale].awardDelta
      text = text.replace(/USERNAME/g, author)
      if (query.text.length) query.text += '\n\n'
      query.text += text
    }
    query.text += `\n\n${i18n[locale].global}`
    if (issueCount >= 2) {
      let text = i18n[locale].noAward.issueCount
      text = text.replace(/ISSUECOUNT/g, issueCount)
      query.text = `${text}\n\n${query.text}`
    }
    await reddit.query({ URL: `/api/comment?${stringify(query)}`, method: 'POST' })
  } catch (err) {
    console.log(err)
  }
}

app
  .use(async (ctx, next) => {
    console.log(`${ctx.url}`.gray)
    await next()
  })
  .use(router.routes())
  .use(router.allowedMethods())
  .listen(80)

setInterval(checkForDeltas, 5000)
