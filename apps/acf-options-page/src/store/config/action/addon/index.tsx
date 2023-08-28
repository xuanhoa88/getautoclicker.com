import { PayloadAction } from '@reduxjs/toolkit';
import { ConfigStore } from '../../config.slice';
import { defaultAddon } from '@dhruv-techapps/acf-common';

export * from './addon.slice';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AddonRequest = { name: string; value: any };

export const actionAddonActions = {
  updateActionAddon: (state: ConfigStore, action: PayloadAction<AddonRequest>) => {
    const { configs, selectedActionIndex, selectedConfigIndex } = state;
    const { name, value: addonValue } = action.payload;
    const { addon } = configs[selectedConfigIndex].actions[selectedActionIndex];
    if (addon) {
      addon[name] = addonValue;
    } else {
      configs[selectedConfigIndex].actions[selectedActionIndex].addon = { ...defaultAddon, [name]: addonValue };
    }
  },
  resetActionAddon: (state: ConfigStore) => {
    const { configs, selectedActionIndex, selectedConfigIndex } = state;
    delete configs[selectedConfigIndex].actions[selectedActionIndex].addon;
  },
};
