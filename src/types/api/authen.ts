import type { User } from './user'

export interface AuthLoginData {
  access_token: string
  refresh_token: string
  token_type?: string
  expires_in?: string
}

export interface AuthMeData {
  user: User
}
