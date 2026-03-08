import Dexie from "dexie";

const db = new Dexie('FintrackDB');

db.version(1).stores({
    user_profiles: 'id, syncStatus',
    accounts: 'id, user_id, type, syncStatus',
    categories: 'id, user_id, type, syncStatus',
    transactions: 'id, user_id, category_id, account_id, to_account_id, type, date, syncStatus'
});

export default db;