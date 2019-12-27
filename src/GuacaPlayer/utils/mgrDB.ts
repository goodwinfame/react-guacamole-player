/**
 * indexedDB管理类
*/
import {Response} from './get';

type session = {
    url: string;
    start: number;
    end: number;
    data?: Response;
    timestamp?: number;
}

export default class ManageDatabase {
    private IndxDb: IDBFactory;
    private db: IDBDatabase | null = null;
    private dbName: string;
    private version: number = 1.0;
    public available: boolean = false;
    constructor(dbName: string = "console-player") {
        this.IndxDb = window.indexedDB;
        this.dbName = dbName;
        if("indexedDB" in window) {
            this.openInitDB();
            this.available = true;
        }
    }
    connectionPool: Promise<IDBDatabase>[] = [];
    openInitDB = async () => {
        if(this.connectionPool[0]) {
            return this.connectionPool[0];
        }

        const req = this.IndxDb.open(this.dbName, this.version);

        const connection = new Promise<IDBDatabase>((resolve, reject)=>{
            req.onupgradeneeded = (e: any) => {
                console.log("db updated")
                this.db = e.target.result as IDBDatabase;
                if (!this.db.objectStoreNames.contains("sessions")) {
                    this.db.createObjectStore("sessions", {keyPath: ["url", "start", "end"]})
                }
            }
            req.onsuccess = (e: any) => {
                this.connectionPool.pop();
                this.db = e.target.result as IDBDatabase;
                return resolve(this.db);
            }
            req.onerror = (e: any) => {
                this.connectionPool.pop();
                return reject(e);
            }
            
        })
       

        this.connectionPool.push(connection);

        return connection;

    }
    getDB = async () => {

        if(this.db) {
            return this.db;
        }
        return await this.openInitDB();
    }
    
    add = async (session: session) => {

        const DB = await this.getDB();
        return new Promise((resolve, reject) => {
            const req = DB.transaction(["sessions"], "readwrite")
                .objectStore("sessions")
                .add({timestamp: new Date().getTime(), ...session});
            
            req.onsuccess = event => {
                console.log("db add", session, req)

                return resolve(session.data);
            }

            req.onerror = event => {
                return reject(event)
            }
        })
    }
    read = async (session: session) => {

        const DB = await this.getDB();
        return new Promise<Response>((resolve, reject) => {
            const req = DB.transaction(["sessions"])
                .objectStore("sessions")
                .get([session.url, session.start, session.end]);

            req.onsuccess = (event: any) => {
                console.log("db read", session, req)

                return resolve(req.result && req.result.data)
            }

            req.onerror = (event: any) => {
                return reject(event)
            }
        })
            
    }
    resetDB = async () => {
        console.log("db closed")
        const DB = await this.getDB();
        DB.close();
        this.IndxDb.deleteDatabase(this.dbName);
        this.openInitDB();
    }

}


