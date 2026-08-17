const DB_NAME = 'VaultFlowDB';
const DB_VERSION = 1;
const STORE_NAME = 'statements';

let db;

const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

const initDB = () => new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => reject(event.target.error);
    
    request.onsuccess = (event) => {
        db = event.target.result;
        resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
        const database = event.target.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) {
            const store = database.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            store.createIndex('date', 'date', { unique: false });
            store.createIndex('type', 'type', { unique: false });
            store.createIndex('method', 'method', { unique: false });
        }
    };
});

const addStatement = async (statement, file) => {
    if (file) {
        statement.proof = await fileToBase64(file);
        statement.proofName = file.name;
        statement.proofType = file.type;
    }
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.add(statement);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
    });
};

const getStatements = () => new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onsuccess = () => {
        const data = request.result.sort((a, b) => new Date(b.date) - new Date(a.date));
        resolve(data);
    };
    
    request.onerror = (event) => reject(event.target.error);
});

const deleteStatement = (id) => new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(Number(id));
    
    request.onsuccess = () => resolve();
    request.onerror = (event) => reject(event.target.error);
});