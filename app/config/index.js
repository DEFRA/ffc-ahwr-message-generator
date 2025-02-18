import joi from 'joi'

const DEFAULT_PORT = 3000
export const getConfig = () => {
  const schema = joi.object({
    env: joi.string().valid('development', 'test', 'production').required(),
    isDev: joi.bool().required(),
    port: joi.number().required()
  })

  const config = {
    env: process.env.NODE_ENV || 'development',
    isDev: process.env.NODE_ENV === 'development',
    port: Number(process.env.PORT) || DEFAULT_PORT
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
