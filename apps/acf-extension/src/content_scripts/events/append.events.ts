import { Logger } from '@dhruv-techapps/core-common';
import { RADIO_CHECKBOX_NODE_NAME } from '../../common/constant';
import CommonEvents, { UNKNOWN_ELEMENT_TYPE_ERROR } from './common.events';
import { SystemError } from '../error';

const CHANGE_EVENT = ['input', 'change'];
export const AppendEvents = (() => {
  const checkNode = (element: HTMLElement, value: string) => {
    if (element instanceof HTMLTextAreaElement || (element instanceof HTMLInputElement && !RADIO_CHECKBOX_NODE_NAME.test(element.type))) {
      element.value += value;
      element.dispatchEvent(CommonEvents.getFillEvent());
    } else if (element.isContentEditable) {
      element.textContent += value;
    } else {
      throw new SystemError(UNKNOWN_ELEMENT_TYPE_ERROR, 'Append Events');
    }
    CHANGE_EVENT.forEach((event) => {
      element.dispatchEvent(new MouseEvent(event, CommonEvents.getMouseEventProperties()));
    });
    element.focus();
  };

  const start = (elements: Array<HTMLElement>, value: string) => {
    value = value.replace(/^append::/i, '');
    Logger.colorDebug(`AppendEvents`, value);
    CommonEvents.loopElements(elements, value, checkNode);
  };

  return { start };
})();
