import { ActionService, NotificationsService } from '@dhruv-techapps/core-service';
import { Logger } from '@dhruv-techapps/core-common';
import { Configuration, START_TYPES, Settings, SettingsNotifications, defaultConfig, defaultHotkey } from '@dhruv-techapps/acf-common';
import { wait } from './util';
import BatchProcessor from './batch';
import { ConfigError } from './error';
import { Hotkey } from './hotkey';
import GoogleSheets from './util/google-sheets';
import Common from './common';
import DiscordMessaging from './store/discord-messaging';

const LOGGER_LETTER = 'Config';
const ConfigProcessor = (() => {
  const getFields = (config) => {
    Logger.colorDebug('GetFields', { url: config.url, name: config.name });
    const fields = [{ name: 'URL', value: config.url }];
    if (config.name) {
      fields.unshift({ name: 'name', value: config.name });
    }
    return fields;
  };

  const start = async (config: Configuration, notifications: SettingsNotifications) => {
    Logger.colorDebug('Config Start');
    const { onConfig, onError, sound, discord } = notifications;
    const sheets = await new GoogleSheets().getValues(config);

    try {
      await BatchProcessor.start(config.batch, config.actions, sheets);
      ActionService.setBadgeBackgroundColor(chrome.runtime.id, { color: [25, 135, 84, 1] });
      ActionService.setBadgeText(chrome.runtime.id, { text: 'Done' });
      if (onConfig) {
        NotificationsService.create(chrome.runtime.id, { type: 'basic', title: 'Config Completed', message: config.name || config.url, silent: !sound, iconUrl: Common.getNotificationIcon() });
        if (discord) {
          DiscordMessaging.push({ title: 'Configuration Finished', fields: getFields(config), color: '#198754' }).catch(Logger.colorError);
        }
      }
    } catch (e) {
      if (e instanceof ConfigError) {
        const error = { title: e.title, message: `url : ${config.url}\n${e.message}` };
        Logger.colorError(e.title, e.message);
        ActionService.setBadgeBackgroundColor(chrome.runtime.id, { color: [220, 53, 69, 1] });
        ActionService.setBadgeText(chrome.runtime.id, { text: 'Error' });
        if (onError) {
          NotificationsService.create(chrome.runtime.id, { type: 'basic', ...error, silent: !sound, iconUrl: Common.getNotificationIcon() }, 'error');
          if (discord) {
            DiscordMessaging.push({
              title: e.title || 'Configuration Error',
              fields: [
                ...getFields(config),
                ...e.message.split('\n').map((info) => {
                  const [name, value] = info.split(':');
                  return { name, value: value.replace(/'/g, '`') };
                }),
              ],
              color: '#dc3545',
            }).catch(Logger.colorError);
          }
        }
      } else {
        throw e;
      }
    }
  };

  const schedule = async (config: Configuration) => {
    Logger.colorDebug('Schedule', { startTime: config.startTime });
    const rDate = new Date();
    rDate.setHours(Number(config.startTime.split(':')[0]));
    rDate.setMinutes(Number(config.startTime.split(':')[1]));
    rDate.setSeconds(Number(config.startTime.split(':')[2]));
    rDate.setMilliseconds(Number(config.startTime.split(':')[3]));
    Logger.colorDebug('Schedule', { date: rDate });
    await new Promise((resolve) => {
      setTimeout(resolve, rDate.getTime() - new Date().getTime());
    });
  };

  const checkStartTime = async (config: Configuration) => {
    if (config.startTime?.match(/^\d{2}:\d{2}:\d{2}:\d{3}$/)) {
      await schedule(config);
    } else {
      await wait(config.initWait, `${LOGGER_LETTER} initWait`);
    }
  };

  const checkStartType = async ({ notifications }: Settings, config: Configuration) => {
    ActionService.setBadgeBackgroundColor(chrome.runtime.id, { color: [13, 110, 253, 1] });
    if (config.startType === START_TYPES.MANUAL) {
      Logger.colorDebug('Config Start Manually');
      ActionService.setBadgeText(chrome.runtime.id, { text: 'Manual' });
      ActionService.setTitle(chrome.runtime.id, { title: 'Start Manually' });
      Hotkey.setup(config.hotkey || defaultHotkey, start.bind(this, config, notifications));
    } else {
      Logger.colorDebug('Config Start Automatically');
      ActionService.setBadgeText(chrome.runtime.id, { text: 'Auto' });
      ActionService.setTitle(chrome.runtime.id, { title: 'Start Automatically' });
      await checkStartTime(config);
      await start(config, notifications);
    }
  };

  return { checkStartType };
})();

export default ConfigProcessor;
