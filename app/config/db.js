import { DefaultAzureCredential, getBearerTokenProvider } from '@azure/identity'

const DEFAULT_POSTGRES_PORT = '5432'

function isProd () {
  return process.env.NODE_ENV === 'production'
}

const hooks = {
  beforeConnect: async (cfg) => {
    if (isProd()) {
      const credential = new DefaultAzureCredential({ managedIdentityClientId: process.env.AZURE_CLIENT_ID })
      cfg.password = getBearerTokenProvider(
        credential,
        'https://ossrdbms-aad.database.windows.net/.default'
      )
    }
  }
}

const retry = {
  backoffBase: 500,
  backoffExponent: 1.1,
  match: [/SequelizeConnectionError/],
  max: 10,
  name: 'connection',
  timeout: 60000
}

const buildConfig = () => {
  return {
    database: process.env.POSTGRES_DB || 'ffc-ahwr-message-generator',
    dialect: 'postgres',
    dialectOptions: {
      ssl: isProd()
    },
    hooks,
    host: process.env.POSTGRES_HOST || 'ffc-ahwr-message-generator-postgres',
    password: process.env.POSTGRES_PASSWORD,
    port: Number.parseInt(process.env.POSTGRES_PORT || DEFAULT_POSTGRES_PORT),
    logging: process.env.POSTGRES_LOGGING || false,
    retry,
    schema: process.env.POSTGRES_SCHEMA_NAME || 'public',
    username: process.env.POSTGRES_USERNAME
  }
}

export const getConfig = () => buildConfig()
