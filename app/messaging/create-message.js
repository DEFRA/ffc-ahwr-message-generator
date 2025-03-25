export const createMessage = (body, type, options) => {
  return {
    body,
    type,
    source: 'ffc-ahwr-message-generator',
    ...options
  }
}
