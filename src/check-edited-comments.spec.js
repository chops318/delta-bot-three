/* eslint-env jest */
import path from 'path'

// first, dynamically grab the file name of what we're testing
const fileName = path.basename(__filename)
const componentFileName = fileName.match(/([^]+).spec.js/)[1]

// bring in the component to be used in tests
const component = require(`./${componentFileName}.js`)

describe('checking from edited comments', () => {
  it('should make a call to retrieve edited comments', () => {
    // const { getEditedComments } = component
    const snoowrap = jest.genMockFromModule('snoowrap')
    console.log(snoowrap.getMe)
    expect(false).toBe(true)
  })
/*  it(
    'should filter comments for valid deltas organized into an object with parent author as key',
    () => {
      expect(false).toBe(true)
    }
  )
  it('should parse the delta comments and create new hidden params', () => {
    expect(false).toBe(true)
  })
  it('should get the children comments of the comment and check if the bot replied', () => {
    expect(false).toBe(true)
  })*/
})

/*describe('checking from the bot\'s comments', () => {
  it('should make a call to retrieve the bot\'s comments', () => {
    expect(false).toBe(true)
  })
  it(
    'should filter comments for invalid deltas organized into an object with parent author as key',
    () => {
      expect(false).toBe(true)
    }
  )
  it('should parse the delta comments and create new hidden params', () => {
    expect(false).toBe(true)
  })
})
ß
describe('combining the edited and bot\'s comments', () => {
  it('should filter out comments in the object with the same hidden params', () => {
    expect(false).toBe(true)
  })
  it('should edit the bot comment if there is already a comment', () => {
    expect(false).toBe(true)
  })
  it('should add a bot comment if there is no comment', () => {
    expect(false).toBe(true)
  })
  it('should update the wiki with a new comment', () => {
    expect(false).toBe(true)
  })
})*/
