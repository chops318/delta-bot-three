export const escapeUnderscore = string => string.replace(/_/g, '\\_')

export const checkCommentForDelta = comment => {
  const { body_html } = comment
  // this removes the text that are in quotes
  const removedBodyHTML = (
    body_html
      .replace(/blockquote&gt;[^]*?\/blockquote&gt;/, '')
      .replace(/pre&gt;[^]*?\/pre&gt;/, '')
  )
  // this checks for deltas
  if (
    !!removedBodyHTML.match(/&amp;#8710;|&#8710;|∆|Δ/) ||
    !!removedBodyHTML.match(/!delta/i)
  ) {
    return true
  }
  return false
}

export const checkForReplyByAuthor = ({ comment, author }) => {
  for (const commentReply of comment.replies) {
    if (commentReply.author.name === author) return commentReply
  }
  return null
}
