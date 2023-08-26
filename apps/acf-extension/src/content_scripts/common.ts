import { DataStore, Logger } from '@dhruv-techapps/core-common';
import { ActionSettings, LOCAL_STORAGE_KEY, RETRY_OPTIONS, Settings } from '@dhruv-techapps/acf-common';
import { ActionService } from '@dhruv-techapps/core-service';
import { ConfigError } from './error/config-error';
import { wait } from './util';
import Sandbox from './sandbox';

const LOGGER_LETTER = 'Common';
const Common = (() => {
  const retryFunc = async (retry, retryInterval) => {
    if (retry > 0 || retry < -1) {
      ActionService.setBadgeBackgroundColor(chrome.runtime.id, { color: [102, 16, 242, 1] });
      ActionService.setBadgeText(chrome.runtime.id, { text: 'Retry' });
      await wait(retryInterval, 'Retry', retry, '<interval>');
      return true;
    }
    return false;
  };

  const sandboxEval = async (code, context?) => {
    if (!code) {
      return context;
    }
    const name = crypto.randomUUID();
    try {
      return await Sandbox.sendMessage({ command: 'eval', name, context: context ? `'${context}'.${code}` : code });
    } catch (error) {
      throw new ConfigError(error.message, `Invalid ${code}`);
    }
  };

  // eslint-disable-next-line no-eval
  /**
   * @deprecated since 31/10/2020
   * @param {*} stringFunc
   * @param {*} parent
   * @returns
   */
  const stringFunction = (stringFunc, parent: any = window) => {
    if (!stringFunc) {
      return parent;
    }
    const functions = stringFunc.replace(/^func::/gi, '').split('.');
    if (functions[0].includes('new')) {
      const newFunc = functions.shift();
      if (newFunc === 'new Date()') {
        parent = new Date();
      } else {
        throw new ConfigError(`${newFunc} is not available contact extension developer`, 'Invalid Addon Func');
      }
    }
    return functions.reduce((acc, current) => {
      if (current.includes('(')) {
        const values = current
          .split('(')[1]
          .replace(')', '')
          .replace(/(["'].+?['"])/g, (group) => group.replace(',', '&sbquo;'))
          .split(',')
          .map((value) => value.replace('&sbquo;', ',').trim().replace(/["']/g, ''));
        return acc[current.replace(/\(.*\)/, '')](...values);
      }
      return acc[current];
    }, parent);
  };

  const getElements = async (document: Document, elementFinder: string, retry: number, retryInterval: number) => {
    Logger.colorDebug('GetElements', elementFinder);
    let elements: Element[];
    if (/^(id::|#)/gi.test(elementFinder)) {
      const element = document.getElementById(elementFinder.replace(/^(id::|#)/gi, ''));
      elements = element ? [element] : undefined;
    } else if (/^Selector::/gi.test(elementFinder)) {
      const element = document.querySelector(elementFinder.replace(/^Selector::/gi, ''));
      elements = element ? [element] : undefined;
    } else if (/^ClassName::/gi.test(elementFinder)) {
      const classElements = document.getElementsByClassName(elementFinder.replace(/^ClassName::/gi, ''));
      elements = classElements.length !== 0 ? Array.from(classElements) : undefined;
    } else if (/^Name::/gi.test(elementFinder)) {
      const nameElements = document.getElementsByName(elementFinder.replace(/^Name::/gi, ''));
      elements = nameElements.length !== 0 ? Array.from(nameElements) : undefined;
    } else if (/^TagName::/gi.test(elementFinder)) {
      const tagElements = document.getElementsByTagName(elementFinder.replace(/^TagName::/gi, ''));
      elements = tagElements.length !== 0 ? Array.from(tagElements) : undefined;
    } else if (/^SelectorAll::/gi.test(elementFinder)) {
      const querySelectAll = document.querySelectorAll(elementFinder.replace(/^SelectorAll::/gi, ''));
      elements = querySelectAll.length !== 0 ? Array.from(querySelectAll) : undefined;
    } else {
      try {
        const nodes = document.evaluate(elementFinder, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        if (nodes.snapshotLength !== 0) {
          elements = [];
          let i = 0;
          while (i < nodes.snapshotLength) {
            elements.push(nodes.snapshotItem(i) as Element);
            i += 1;
          }
        }
      } catch (e) {
        throw new ConfigError(`elementFinder: ${e.message.split(':')[1]}`, 'Invalid Xpath');
      }
    }
    if (!elements) {
      const doRetry = await retryFunc(retry, retryInterval);
      if (doRetry) {
        elements = await getElements(document, elementFinder, retry - 1, retryInterval);
      }
    }
    return elements;
  };

  const main = async (elementFinder: string, retry: number, retryInterval: number) => await getElements(document, elementFinder, retry, retryInterval);

  const checkIframe = async (elementFinder: string, retry: number, retryInterval: number) => {
    Logger.colorDebug('CheckIframe');
    const iFrames = document.getElementsByTagName('iframe');
    let elements;
    for (let index = 0; index < iFrames.length; index += 1) {
      if (!iFrames[index].src || iFrames[index].src === 'about:blank') {
        const { contentDocument } = iFrames[index];
        if (contentDocument) {
          elements = await getElements(contentDocument, elementFinder, retry, retryInterval);
          if (elements) {
            break;
          }
        }
      }
    }
    return elements;
  };

  const checkRetryOption = (retryOption, elementFinder) => {
    if (retryOption === RETRY_OPTIONS.RELOAD) {
      if (document.readyState === 'complete') {
        window.location.reload();
      } else {
        window.addEventListener('load', window.location.reload);
      }
      throw new ConfigError(`elementFinder: ${elementFinder}`, 'Not Found - RELOAD');
    } else if (retryOption === RETRY_OPTIONS.STOP) {
      throw new ConfigError(`elementFinder: ${elementFinder}`, 'Not Found - STOP');
    }
    Logger.colorInfo('RetryOption', retryOption);
  };

  const start = async (elementFinder: string, settings: ActionSettings) => {
    try {
      if (!elementFinder) {
        throw new ConfigError('elementFinder can not be empty!', 'Element Finder');
      }
      console.groupCollapsed(LOGGER_LETTER);
      const { retryOption, retryInterval, retry, checkiFrames, iframeFirst } = { ...DataStore.getInst().getItem<Settings>(LOCAL_STORAGE_KEY.SETTINGS), ...settings };
      let elements: Element[];
      if (iframeFirst) {
        elements = await checkIframe(elementFinder, retry, retryInterval);
      } else {
        elements = await main(elementFinder, retry, retryInterval);
      }
      if (!elements || elements.length === 0) {
        if (iframeFirst) {
          elements = await main(elementFinder, retry, retryInterval);
        } else if (checkiFrames) {
          elements = await checkIframe(elementFinder, retry, retryInterval);
        }
      }
      if (!elements || elements.length === 0) {
        checkRetryOption(retryOption, elementFinder);
      }
      console.groupEnd();
      return elements;
    } catch (error) {
      console.groupEnd();
      throw error;
    }
  };

  const getNotificationIcon = () => chrome.runtime.getManifest().action.default_icon;

  return { start, stringFunction, getElements, sandboxEval, getNotificationIcon };
})();

export default Common;
