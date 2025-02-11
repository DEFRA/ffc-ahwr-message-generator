import joi from 'joi'
import appInsights from 'applicationinsights'

export const getConfig = () => {
  const schema = joi.object({
    appInsights: joi.object(),
    env: joi.string().valid('development', 'test', 'production'),
    isDev: joi.bool(),
    port: joi.number()
  })

  const config = {
    appInsights,
    env: process.env.NODE_ENV || 'development',
    isDev: process.env.NODE_ENV === 'development',
    port: Number(process.env.PORT) || 3000
  }

  const { error } = schema.validate(config, {
    abortEarly: false,
    convert: false
  })

  if (error) {
    throw new Error(`The server config is invalid. ${error.message}`)
  }

  return config
}

export const config = getConfig()
