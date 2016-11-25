/*
import _ from 'lodash'
import { stringify } from 'query-string'
import Api from './../RedditAPIDriver'
import parseHiddenParams from './../parse-hidden-params'
import getWikiContent from './../get-wiki-content'
*/
import { checkCommentForDelta, checkForReplyByAuthor } from './utils'

class CheckEditedComments {
  constructor({ snoowrap }) {
    this.snoowrap = snoowrap // this is the Reddit API
    this.me = null
  }
  // this method is called by DB3 main code. It starts
  // the whole process of checking edited comments
  async initialStart() {
    this.me = await this.snoowrap.getMe()
    // start the scheduled time job
    this.startJob()
  }
  async startJob() {
    const { snoowrap: r } = this
    // first, grab all comments that were edited. It is limited to the last 25.
    let editedRaw
    try {
      editedRaw = await r.getSubreddit('changemyviewDB3Dev2').getEdited({ only: 'comments' })
    } catch (err) {
      console.log(err)
    }
    for (const commentFromEditedCall of editedRaw) {
      // we have to regrab the comment because we can't fetch replies from commentFromEditedCall
      const comment = await r.getComment(commentFromEditedCall.id).fetch()
      comment.replies = await comment.replies.fetchAll()
      const authorReply = checkForReplyByAuthor({ comment, author: this.me.name })
      if (authorReply) {
        console.log('The bot replied to this!')
        console.log(authorReply)
      } else if (checkCommentForDelta(comment)) {
        console.log('There is a delta in here! Verify this delta comment!')
        console.log(comment)
      } else {
        console.log(comment)
        console.log(comment.replies)
      }
    }
    // set the timeout here in case it takes long or hangs,
    // so it doesn't fire off multiple time at once
    // setTimeout(() => this.startJob(), 60000)
  }
}

export default CheckEditedComments
