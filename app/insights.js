import appInsights from 'applicationinsights'

export const setup = () => {
  if (process.env.APPINSIGHTS_CONNECTIONSTRING) {
    appInsights.setup().start()
    const cloudRoleTag = appInsights.defaultClient.context.keys.cloudRole
    appInsights.defaultClient.context.tags[cloudRoleTag] = process.env.APPINSIGHTS_CLOUDROLE ?? 'ffc-ahwr-message-generator'
    return true
  }

  return false
}
