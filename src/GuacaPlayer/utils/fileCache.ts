/**
 * 文件缓存管理类
 * 缓存20个文件分片
 * 其余通过数据库存取
*/

import get, {Response} from './get';
import ManageDatabase from './mgrDB';
import { cancelablePromise, CancelablePromise } from '.';

let taskId = 0;

interface FetchingPromise extends CancelablePromise {
    id: number
}

class Base {
    static readonly MAX_FILE_SIZE = 5242880;
    protected url: string = "";
    public taskMap: Map<number, CancelablePromise<Response>> = new Map();
    static sessionDB = new ManageDatabase();
    public filePool: {index: number, file: Blob}[] = [];
    private transaction = async (start: number, end: number, id: number) => {
        //查询file事务
        if(Base.sessionDB.available) {
            // indexedDB可用
            const result = await Base.sessionDB.read({url: this.url, start, end});
            if(!this.taskMap.has(id)) throw Error("db read cancelled");
            if(result) {

                return result;
            }
        }
        

        const response = await get(this.url, start, end, Base.MAX_FILE_SIZE);
        if(!this.taskMap.has(id)) throw Error("file http get cancelled");
        try{
            await Base.sessionDB.add({url: this.url, start, end, data: response});
            if(!this.taskMap.has(id)) throw Error("db add cancelled");
        } catch(e) {
            console.log(e)
        }
        

        return response;
    }
    public fetching = (start: number = 0, end: number = start + Base.MAX_FILE_SIZE): FetchingPromise => {
        const id = taskId++;
        const promise = cancelablePromise(this.transaction(start, end, id)) as FetchingPromise;
        promise.id = id;

        return promise;

    }
    public addFile = (index: number, file: Blob) => {
        if(this.filePool.length > 20) {
            this.filePool.shift()
        }

        this.filePool.push({
            index,
            file
        })
    }

    public getFile = (index: number) => {
        const result = this.filePool.find(f=>f.index === index);
        return result && result.file;
    }
   
}
export class Partial {
    public index: number = 0;
    public size: number = 0;
    public rangeStart: number = 0;
    public rangeEnd: number = 0;
    public next: Partial | null = null;
    public prev: Partial | null = null;
    private taskId: null | number = null;
    private cacher: FileCache;
    constructor(rangeStart: number, rangeEnd: number, size: number, index: number, cacher: FileCache) {
        this.rangeStart = rangeStart;
        this.rangeEnd = rangeEnd;
        this.size = size;
        this.index = index;
        this.cacher = cacher;
    }
    getFile = async () => {
        if(this.cacher.getFile(this.index)) {
            return this.cacher.getFile(this.index)!;
        }

        // 查找是否有进行中的请求任务，有则等待返回
        if(this.taskId && this.cacher.taskMap.has(this.taskId)) {
            const {file} = await this.cacher.taskMap.get(this.taskId)!
            this.cacher.addFile(this.index, file)
            return file;
        }

        // 开始新的请求
        const promise = this.cacher.fetching(this.rangeStart, this.rangeEnd);
        this.taskId = promise.id;
        this.cacher.taskMap.set(this.taskId, promise);
        const {file} = await promise;
        this.cacher.taskMap.delete(this.taskId);
        this.taskId = null;

        this.cacher.addFile(this.index, file)

        return file;
    }
}


export default class FileCache extends Base{
    public head: Partial | null = null; //头
    public tail: Partial | null = null; //尾
    public size: number = 0;
    public partialCount: number = 0;
    constructor(){
        super();
    }
    init = async (src?: string) => {
        this.clear();

        if(src) {
            //初始化数据
            this.url = src;

            const promise = this.fetching(0, 0);
            const id = promise.id;
            this.taskMap.set(id, promise);
            const response = await promise;
            this.taskMap.delete(id);

            //更新file大小
            const match = /\/(?=([0-9]+))/.exec(response.contentRange || "");
            if(match && match[1]) {
                this.size = Number(match[1])
            }
            //构造Partial
            let childNode: Partial | null = null, end = this.size;
            for(let count = this.partialCount = Math.ceil(this.size / Base.MAX_FILE_SIZE), i = count - 1; i >= 0; i--) {
                let start = i * Base.MAX_FILE_SIZE, size = end - start;
                const partial = new Partial(start, end, size, i, this);
                end -= (size + 1);
                if(childNode) {
                    partial.next = childNode;
                } else {
                    //最后一个节点
                    this.tail = partial;
                }
                childNode = partial;
            }

            this.head = childNode;

            return this.head;

        } else {
            throw "no file src!"
        }
    }
    clear = () => {
        this.url = "";
        this.head = null;
        this.size = 0;
        this.taskMap.clear();
        this.filePool.length = 0;
    }
   
    
   
    cancelCaching = async () => {
        for(let [id, task] of this.taskMap.entries()) {
            console.log("cancel tasks",task)
            task.cancel();
            this.taskMap.delete(id);
        }
    }
    slice = async (start: number, end: number) => {

        if(!this.head) {
            throw "no head partial, init first!";
        }

        let startTrunkIndex = Math.ceil((start || 1) / Base.MAX_FILE_SIZE) - 1; //start所在的trunk index
        let endTrunkIndex = Math.ceil(end / Base.MAX_FILE_SIZE) - 1; //end 所在的trunk index
        let trunkStart = start - startTrunkIndex * Base.MAX_FILE_SIZE; //start所在trunk的起始位置
        let trunkEnd = end - endTrunkIndex * Base.MAX_FILE_SIZE;//end所在trunk的结束位置

        let blob = new Blob([]);
        
        let partial: Partial | null = this.head;

        while(partial) {

            if(partial.index > endTrunkIndex) {
                break;
            }

            if(partial.index >= startTrunkIndex) {
                let trunk = await partial.getFile();
                if(startTrunkIndex === endTrunkIndex) {
                    //起始在同一trunk
                    trunk = trunk.slice(trunkStart, trunkEnd);
                } else if(partial.index === startTrunkIndex) {
                    trunk = trunk.slice(trunkStart, trunk.size);
                } else if(partial.index === endTrunkIndex) {
                    trunk = trunk.slice(0, trunkEnd);
                }
    
                blob = new Blob([blob, trunk]);
            }

            partial = partial.next;

        }
       

        return blob;

    }
}