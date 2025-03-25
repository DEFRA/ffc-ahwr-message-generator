import joi from 'joi'
import appInsights from 'applicationinsights'

export const getMessageQueueConfig = () => {
  const sharedConfigSchema = {
    appInsights: joi.object().optional(),
    host: joi.string().required(),
    password: joi.string(),
    username: joi.string(),
    useCredentialChain: joi.bool().required(),
    managedIdentityClientId: joi.string().optional(),
    retries: 50,
    retryWaitInMs: 100
  }

  const schema = joi.object({
    messageGeneratorQueue: {
      address: joi.string().required(),
      type: joi.string().required(),
      ...sharedConfigSchema
    },
    sfdMessageQueue: {
      address: joi.string().required(),
      type: joi.string().required(),
      ...sharedConfigSchema
    },
    eventQueue: {
      address: joi.string().required(),
      type: joi.string().required(),
      ...sharedConfigSchema
    }
  })

  const sharedConfig = {
    appInsights,
    host: process.env.MESSAGE_QUEUE_HOST ?? 'localhost',
    password: process.env.MESSAGE_QUEUE_PASSWORD,
    username: process.env.MESSAGE_QUEUE_USER,
    useCredentialChain: process.env.NODE_ENV === 'production',
    managedIdentityClientId: process.env.AZURE_CLIENT_ID
  }

  const config = {
    messageGeneratorQueue: {
      address: process.env.MESSAGE_GENERATOR_QUEUE_ADDRESS,
      type: 'queue',
      ...sharedConfig
    },
    sfdMessageQueue: {
      address: process.env.SFD_MESSAGE_QUEUE_ADDRESS,
      type: 'queue',
      ...sharedConfig
    },
    eventQueue: {
      address: process.env.EVENT_QUEUE_ADDRESS,
      type: 'queue',
      ...sharedConfig
    }
  }

  const { error } = schema.validate(config, { abortEarly: false })

  if (error) {
    throw new Error(`The message queue config is invalid. ${error.message}`)
  }

  return config
}

export const messageQueueConfig = getMessageQueueConfig()
