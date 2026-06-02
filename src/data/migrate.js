import {
  saveMaintRecords, saveHeliConfig, saveMaintStatus, saveSavedCalcs, saveUsers
} from './db';

const FLEET = ['7T-VWD', '7T-VWE', '7T-VWF', '7T-VWG', '7T-VWH', '7T-VWI'];

export async function migrateFromLocalStorage() {
  if (!window.__TAURI__) return;

  for (const reg of FLEET) {
    try {
      const maintRaw = localStorage.getItem('aw139_maint_' + reg);
      if (maintRaw) await saveMaintRecords(reg, JSON.parse(maintRaw));

      const cfgRaw = localStorage.getItem('aw139_maintcfg_' + reg);
      if (cfgRaw) await saveHeliConfig(reg, JSON.parse(cfgRaw));

      const statusRaw = localStorage.getItem('aw139_maint_status_' + reg);
      if (statusRaw) await saveMaintStatus(reg, statusRaw);

      const calcsRaw = localStorage.getItem('aw139_saved_calcs_' + reg);
      if (calcsRaw) await saveSavedCalcs(reg, JSON.parse(calcsRaw));
    } catch (e) {
      console.warn('Migration error for', reg, e);
    }
  }

  try {
    const usersRaw = localStorage.getItem('aw139_users');
    if (usersRaw) await saveUsers(JSON.parse(usersRaw));
  } catch (e) {
    console.warn('Migration error for users', e);
  }
}
