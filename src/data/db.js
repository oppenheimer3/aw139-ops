const isTauri = typeof window !== 'undefined' && window.__TAURI__;

const ls = {
  get(key) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }
    catch { return null; }
  },
  set(key, val) { localStorage.setItem(key, JSON.stringify(val)); },
  remove(key) { localStorage.removeItem(key); },
  getString(key) { try { return localStorage.getItem(key); } catch { return null; } },
  setString(key, val) { localStorage.setItem(key, val); },
};

let dbConn = null;
async function getConn() {
  if (!isTauri) return null;
  if (!dbConn) {
    try {
      const { default: Database } = await import('@tauri-apps/plugin-sql');
      dbConn = await Database.load('sqlite:aw139.db');
    } catch {
      return null;
    }
  }
  return dbConn;
}

// ----- Maint Records -----
export async function getMaintRecords(reg) {
  const db = await getConn();
  if (db) return await db.select('SELECT * FROM maint_records WHERE registration = $1 ORDER BY id', [reg]);
  return ls.get('aw139_maint_' + reg) || [];
}

export async function saveMaintRecords(reg, records) {
  const db = await getConn();
  if (db) {
    await db.execute('DELETE FROM maint_records WHERE registration = $1', [reg]);
    for (const r of records) {
      await db.execute(
        `INSERT INTO maint_records (registration, date, action, denomination, weight_change_kg, sta_cg_mm, long_moment_kgmm, bl_cg_mm, lat_moment_kgmm, total_weight_kg, total_long_moment_kgmm, total_sta_cg_mm, total_lat_moment_kgmm, total_bl_cg_mm, signature)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
        [reg, r.date, r.action, r.denomination, r.weightChange_kg ?? 0, r.staCg_mm ?? 0, r.longMoment_kgmm ?? 0,
         r.blCg_mm ?? 0, r.latMoment_kgmm ?? 0, r.totalWeight_kg ?? 0, r.totalLongMoment_kgmm ?? 0,
         r.totalStaCg_mm ?? 0, r.totalLatMoment_kgmm ?? 0, r.totalBlCg_mm ?? 0, r.signature ?? '']
      );
    }
  }
  ls.set('aw139_maint_' + reg, records);
}

// ----- Heli Config -----
export async function getHeliConfig(reg) {
  const db = await getConn();
  if (db) {
    const rows = await db.select('SELECT * FROM heli_config WHERE registration = $1', [reg]);
    if (rows.length > 0) {
      const r = rows[0];
      return { seats: JSON.parse(r.seats || '[]'), equipment: JSON.parse(r.equipment || '[]') };
    }
    return null;
  }
  return ls.get('aw139_maintcfg_' + reg);
}

export async function saveHeliConfig(reg, cfg) {
  const db = await getConn();
  if (db) {
    await db.execute(
      `INSERT INTO heli_config (registration, seats, equipment) VALUES ($1,$2,$3)
       ON CONFLICT(registration) DO UPDATE SET seats=$2, equipment=$3`,
      [reg, JSON.stringify(cfg.seats), JSON.stringify(cfg.equipment)]
    );
  }
  ls.set('aw139_maintcfg_' + reg, cfg);
}

// ----- Maint Status -----
export async function getMaintStatus(reg) {
  const db = await getConn();
  if (db) {
    const rows = await db.select('SELECT status FROM maint_status WHERE registration = $1', [reg]);
    return rows.length > 0 ? rows[0].status : 'ready';
  }
  return ls.getString('aw139_maint_status_' + reg) || 'ready';
}

export async function saveMaintStatus(reg, status) {
  const db = await getConn();
  if (db) {
    await db.execute(
      `INSERT INTO maint_status (registration, status) VALUES ($1,$2)
       ON CONFLICT(registration) DO UPDATE SET status=$2`,
      [reg, status]
    );
  }
  ls.setString('aw139_maint_status_' + reg, status);
}

// ----- Saved Calcs -----
export async function getSavedCalcs(reg) {
  const db = await getConn();
  if (db) {
    const rows = await db.select('SELECT * FROM saved_calcs WHERE registration = $1 ORDER BY id', [reg]);
    return rows.map(r => ({ ...JSON.parse(r.data), id: r.id, created_at: r.created_at }));
  }
  return ls.get('aw139_saved_calcs_' + reg) || [];
}

export async function saveSavedCalcs(reg, calcs) {
  const db = await getConn();
  if (db) {
    await db.execute('DELETE FROM saved_calcs WHERE registration = $1', [reg]);
    for (const c of calcs) {
      const { id, created_at, ...data } = c;
      await db.execute(
        'INSERT INTO saved_calcs (registration, data) VALUES ($1,$2)',
        [reg, JSON.stringify(data)]
      );
    }
  }
  ls.set('aw139_saved_calcs_' + reg, calcs);
}

export async function deleteSavedCalc(reg, idx) {
  const db = await getConn();
  if (db) {
    const rows = await db.select('SELECT id FROM saved_calcs WHERE registration = $1 ORDER BY id', [reg]);
    if (rows[idx]) {
      await db.execute('DELETE FROM saved_calcs WHERE id = $1', [rows[idx].id]);
    }
  }
  const calcs = ls.get('aw139_saved_calcs_' + reg) || [];
  calcs.splice(idx, 1);
  ls.set('aw139_saved_calcs_' + reg, calcs);
}

// ----- Users -----
export async function getUsers() {
  const db = await getConn();
  if (db) {
    const rows = await db.select('SELECT username, password, role FROM users');
    return rows;
  }
  return ls.get('aw139_users');
}

export async function saveUsers(users) {
  const db = await getConn();
  if (db) {
    await db.execute('DELETE FROM users');
    for (const u of users) {
      await db.execute(
        'INSERT INTO users (username, password, role) VALUES ($1,$2,$3)',
        [u.username, u.password, u.role]
      );
    }
  }
  ls.set('aw139_users', users);
}

// ----- Session -----
export function getSession() {
  try {
    const data = localStorage.getItem('aw139_session');
    return data ? JSON.parse(data) : null;
  } catch { return null; }
}

export function saveSession(session) {
  if (session) {
    localStorage.setItem('aw139_session', JSON.stringify(session));
  } else {
    localStorage.removeItem('aw139_session');
  }
}
