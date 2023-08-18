import { PayloadAction } from '@reduxjs/toolkit';

export * from './addon.slice';

type Addon = { name: string; value: any } | null;

export const actionAddonActions = {
  updateActionAddon: (state, action: PayloadAction<Addon>) => {
    if (action.payload) {
      const { configs, selectedActionIndex, selectedConfigIndex } = state;
      const { name, value } = action.payload;
      const { addon } = configs[selectedConfigIndex].actions[selectedActionIndex];
      if (addon) {
        addon[name] = value;
      }
    }
  },
  resetActionAddon: (state) => {
    const { configs, selectedActionIndex, selectedConfigIndex } = state;
    delete configs[selectedConfigIndex].actions[selectedActionIndex].addon;
  },
};
