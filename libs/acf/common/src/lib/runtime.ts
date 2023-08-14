export enum RUNTIME_MESSAGE_ACF {
    DISCORD_LOGIN = 'discord-login',
  GOOGLE_SHEETS = 'google-sheets',
  GOOGLE_OAUTH2 = 'google-oauth',
  GOOGLE_BACKUP = 'google-backup',
}

export type RuntimeMessageRequest = {
  messenger: RUNTIME_MESSAGE_ACF;
  methodName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  message?: any;
};
