/**
 * 播放帧管理类
 * 解析Blob为帧集合
 * 播放控制
 * 
*/


import Guacamole from 'guacamole-common-js';
import FileCache, {Partial} from './utils/fileCache';
import { delay, formatTime } from './utils';

class PlaybackTunnel{
    oninstruction?: (opcode: any, args: any)=>void
    connect(data: any) {
        // Do nothing
    };

    sendMessage(elements: any) {
        // Do nothing
    };

    disconnect() {
        // Do nothing
    };
    receiveInstruction = (opcode: any, args: any) => {
        if (this.oninstruction)
            this.oninstruction(opcode, args);
    };
}


class Frame {
    keyframe: boolean;
    timestamp: number;
    start: number;
    end: number;
    clientState: any;
    constructor(timestamp: number, start: number, end: number){
        this.keyframe = false;
        this.timestamp = timestamp;
        this.start = start;
        this.end = end;
        this.clientState = null;
    }

    

}

const BLOCK_SIZE = 262144, KEYFRAME_CHAR_INTERVAL = 16384, KEYFRAME_TIME_INTERVAL = 5000;



interface TrunkLoadEvent {
    type: "loading" | "parsing" | "loaded"; //加载中，转换中，加载完成
    index: number; //trunk index
    size?: number; //trunk size
    current: number; //trunk parse size

}

interface FileLoadEvent {
    type: "loading" | "loaded"; //加载中，加载完成
    size?: number; //file size
    trunkCount: number; // trunk count
    current: number; //trunk index

}

export default class SessionRecording {
    private playing: boolean = false;
    private frames: Frame[] = [];
    private lastKeyframe = 0;
    private playbackTunnel = new PlaybackTunnel();
    private playbackClient = new Guacamole.Client(this.playbackTunnel);
    private currentFrame = -1;
    private endVideoTimestamp = 0; //视频的结束时间戳
    private activeSeek: null | {
        aborted: boolean;
    } = null;
    private aborted = false; //文件解析取消
    private fileCache!: FileCache;
    private seekCallback: null | Function = null;
    get lastFrame(){
        return this.frames[this.lastFrameIndex];
    }
    get lastFrameIndex() {
        return this.frames.length - 1
    }
    private frameStart = 0;
    private frameEnd = 0;
    onError?: Function;
    onSeek?: Function;
    onAbort?: Function;
    onPlay?: Function;
    onPause?: Function;
    onTrunkLoad?: (event: TrunkLoadEvent)=>void; //trunk加载过程回调
    onFileLoad?: (event: FileLoadEvent)=>void; //所有文件解析完毕回调
    constructor(fileCache: FileCache) {
        this.playbackClient.connect();
        this.playbackClient.getDisplay().showCursor(false);
        this.fileCache = fileCache;
    };
    start = () => {
        //开始加载文件
        this.loadFile(this.fileCache.head);
    }
    stop = () => {
        //结束
        this.pause();
        this.abort();
    }
    getLastTimestamp = async () => {
        //获取视频最后一帧时间戳
        if (this.endVideoTimestamp) {
            return this.endVideoTimestamp;
        }
        this.endVideoTimestamp = this.frames[this.frames.length - 1]?.timestamp
        /*
        const file = await this.fileCache.tail.getFile();
        const string = await new Promise<String>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                if(typeof(reader.result) === "string") {
                    return resolve(reader.result);
                } else {
                    return reject()
                }
            }
            reader.readAsText(file);
        })

        const lastSync = string.lastIndexOf("sync");
        this.endVideoTimestamp = Number(string.slice(lastSync + 8, lastSync + 21));
        */
        return this.endVideoTimestamp;
    }
    loadFile = async (partial: Partial | null) => {
        //文件加载中回调
        this.onFileLoad && this.onFileLoad({
            type: "loading",
            size: this.fileCache.size,
            current: 0,
            trunkCount: this.fileCache.partialCount
        })

        let parser = new Guacamole.Parser();

        while(partial) {
            //trunk正在下载中
            this.onTrunkLoad && this.onTrunkLoad({
                type: "loading", 
                index: partial.index, 
                size: partial.size,
                current: 0
            })

            const file = await partial.getFile();

            //文件加载回调
            this.onFileLoad && this.onFileLoad({
                type: "loading",
                size: this.fileCache.size,
                current: partial.index,
                trunkCount: this.fileCache.partialCount

            })

            if(file) {
                await this.addFile(partial, parser);
            }

            //trunk已经加载并解析完毕
            this.onTrunkLoad && this.onTrunkLoad({
                type: "loaded", 
                index: partial.index, 
                size: partial.size,
                current: partial.size
            })

            partial = partial.next;

        }

        //文件加载完毕回调
        this.onFileLoad && this.onFileLoad({
            type: "loaded",
            size: this.fileCache.size,
            current: this.fileCache.size,
            trunkCount: this.fileCache.partialCount

        })

    }
    addFile = async (partial: Partial, parser: any) => {
        const file = await partial.getFile();

        try {
            return this.parseBlob(file, parser, (opcode: string, args: any) => {

                // 计算命令长度
                this.frameEnd += this.getElementSize(opcode);

                // 计算参数长度
                for (let i = 0; i < args.length; i++)
                    this.frameEnd += this.getElementSize(args[i]);
    
                // 当命令为sync说明需要创建帧
                if (opcode === 'sync') {
    
                    // 获取帧时间戳
                    let timestamp = parseInt(args[0]);
    
                    // 创建帧
                    const frame = new Frame(timestamp, this.frameStart, this.frameEnd);
                    this.frames.push(frame);
                    this.frameStart = this.frameEnd;
    
                    // 如果是第一帧，或者帧的数据量足够大，或者帧间隔时间足够长，则是关键帧
                    if (
                        this.frames.length === 1 
                        || 
                        (
                            this.chartIntervalBetweenFrames(frame, this.frames[this.lastKeyframe]) >= KEYFRAME_CHAR_INTERVAL
                            && 
                            timestamp - this.frames[this.lastKeyframe].timestamp >= KEYFRAME_TIME_INTERVAL
                        )
                    ) {
                        frame.keyframe = true;
                        this.lastKeyframe = this.lastFrameIndex;
                    }
    
                    // 帧创建回调
                    this.onTrunkLoad && this.onTrunkLoad({
                        type: "parsing",
                        index: partial.index,
                        size: partial.size,
                        current: this.frameEnd - partial.index * FileCache.MAX_FILE_SIZE
                    });
                        
    
                }
    
            });
        } catch(e) {
            console.log("parseBlob error")
        }
        
    }
    private chartIntervalBetweenFrames = (backFrame: Frame, frontFrame: Frame) => {
        //计算两帧之间相差多少个字节。
        return backFrame.end - frontFrame.start;
    }
    private parseBlob = async (blob: Blob, parser: any, instructionCallback: Function) => {
        if(this.aborted) {
            throw "aborted"
        }

        parser.oninstruction = instructionCallback;

        let offset = 0;

        const reader = new FileReader();

        do {
            // 如果终止则返回
            if (this.aborted)
                throw "aborted";

            const block = blob.slice(offset, offset + BLOCK_SIZE);

            offset += block.size;
            
            await new Promise((resolve, reject)=>{
                reader.onload = () => {
                    // 解析块中指令
                    if (reader.readyState === 2 /* DONE */) {
                        try {
                            parser.receive(reader.result);
                        }
                        catch (parseError) {
                            this.onError && this.onError();
                            //播放出错，找到上一个有效帧返回
                            while(--this.currentFrame >= 0) {
                                const frame = this.frames[this.currentFrame];
                                if (frame.clientState) {
                                    this.playbackClient.importState(frame.clientState);
                                    break;
                                }
                            }
                            
                            return reject(parseError.message);
                        }
                    }
                    return resolve()
                }
                reader.readAsText(block);
            })

        } while (offset < blob.size)

        return;


    }
    private getElementSize = (value: string) => {

        let valueLength = value.length;

        // Calculate base size, assuming at least one digit, the "."
        // separator, and the "," or ";" terminator
        let protocolSize = valueLength + 3;

        // Add one character for each additional digit that would occur
        // in the element length prefix
        while (valueLength >= 10) {
            protocolSize++;
            valueLength = Math.floor(valueLength / 10);
        }

        return protocolSize;

    }
    getDuration = async () => {
        // 获取视频总时长
        if (this.frames.length === 0)
            return 0;

        const lastTimestamp = await this.getLastTimestamp();
        return this.toRelativeTimestamp(lastTimestamp);

    }
    getCurrentDuration = async () => {
        // 获取当前已加载帧时长
        if (this.frames.length === 0)
            return 0;

        return this.toRelativeTimestamp(this.frames[this.lastFrameIndex].timestamp);

    }
    private toRelativeTimestamp = (timestamp: number) => {
        //计算已播放时长

        // 没有帧则返回0
        if (this.frames.length === 0)
            return 0;

        // 计算当前帧到第一帧的时间
        return timestamp - this.frames[0].timestamp;

    }
    private findFrame = (minIndex: number, maxIndex: number, timestamp: number): number => {
        //二分法查找

        // 左右index相等则返回结果
        if (minIndex === maxIndex)
            return minIndex;

        // 左右分区
        let midIndex = Math.floor((minIndex + maxIndex) / 2);
        let midTimestamp = this.toRelativeTimestamp(this.frames[midIndex].timestamp);

        // 如果当前时间在左边，则查左右
        if (timestamp < midTimestamp && midIndex > minIndex)
            return this.findFrame(minIndex, midIndex - 1, timestamp);

        // 如果当前时间在右边，则查右边
        if (timestamp > midTimestamp && midIndex < maxIndex)
            return this.findFrame(midIndex + 1, maxIndex, timestamp);

        // 如果当前时间戳就是mid帧时间戳，则返回mid帧
        return midIndex;

    }
    private replayFrame = async (index: number) => {
        let parser = new Guacamole.Parser();

        const frame = this.frames[index];

        // 播放帧
        const blob = await this.fileCache.slice(frame.start, frame.end);

        await this.parseBlob(blob, parser, (opcode: string, args: any) => {
            this.playbackTunnel.receiveInstruction(opcode, args);
        });

        // 如果当前帧是关键帧，则保存状态
        if (frame.keyframe && !frame.clientState) {
            this.playbackClient.exportState((state: any) => {
                frame.clientState = state;
            });
        }

        // 更新当前帧
        this.currentFrame = index;
        return;
    }

    private seekToFrame = async (index: number, realTimestamp: number = 0): Promise<boolean> => {
        /**
         * index 目标帧
         * startIndex 起始查找的帧
         * currentFrame 当前帧
        */
        
        // 终止查询
        this.abortSeek();

        // 设置新的查询标志
        let thisSeek = this.activeSeek = {
            aborted : false
        };

        let startIndex: number;

        // 从目标帧开始往前回溯到当前帧
        for (startIndex = index; startIndex >= 0; startIndex--) {

            const frame = this.frames[startIndex];

            // 如果已经到当前帧，则返回
            if (startIndex === this.currentFrame)
                break;

            // 如果该帧有状态，则将该帧设置为当前帧
            if (frame.clientState) {
                this.playbackClient.importState(frame.clientState);
                this.currentFrame = startIndex - 1;
                break;
            }

        }

        //计算延迟
        const current = this.frames[this.currentFrame] || this.frames[0];
        const next = this.frames[this.currentFrame + 1];
        const duration = Math.max(next.timestamp - current.timestamp + realTimestamp - new Date().getTime(), 0);
        

        await delay(duration);

        // 从当前帧开始播放到目标帧
        do {
           

            // 取消播放
            if (thisSeek.aborted) {
                console.log(`return ${this.currentFrame} ${index}`)

                return false;
            }
                

            // 播放下一帧
            if(this.currentFrame < index) {
                await this.replayFrame(this.currentFrame + 1);
                const current = this.frames[this.currentFrame];

                // 播放进度回调
                if (this.onSeek) {
                    this.onSeek(this.toRelativeTimestamp(current.timestamp),this.currentFrame - startIndex, index - startIndex);
                }
            } else {
                break;
            }
            
                
        } while (true)

        if(thisSeek.aborted) return false;

        return true;
        

    }
    private abortSeek = () => {
        if (this.activeSeek) {
            this.activeSeek.aborted = true;
            this.activeSeek = null;
        }
    }
    private continuePlayback = async () => {

        do {
            //存在下一帧
            //当前真实时间戳
            const currentRealTimestamp = new Date().getTime();

            //查找帧，如果结果为false，则停止播放
            const reault = await this.seekToFrame(this.currentFrame + 1, currentRealTimestamp);
            
            if(!reault) {
                return;
            }

            // 如果当前播放帧小于已缓存帧，则继续播放
        } while (this.currentFrame + 1 < this.frames.length)



        //不存在下一帧，则暂停
        this.pause();

        //记录当前已加载帧的长度
        const loadedFrameLength = this.frames.length;

        //获取视频总长
        const lastTimestamp = await this.getLastTimestamp();

        //当前帧时间戳
        const timestamp = this.frames[this.currentFrame].timestamp;

        if(timestamp >= lastTimestamp) {
            //视频已经播放完毕
            return;
        }

        //如果已加载帧长度无变化，则继续等待
        while(this.frames.length <= loadedFrameLength) {await delay(500)}
        
        //继续播放
        this.play()

    }
    abort = () => {
        if (!this.aborted) {
            this.aborted = true;
            if (this.onAbort)
                this.onAbort();
        }
    }
    getDisplay = () => {
        return this.playbackClient.getDisplay();
    }
    isPlaying = () => {
        return this.playing;
    }
    getPosition = () => {

        // 第一帧返回0
        if (this.currentFrame === -1)
            return 0;

        // 返回已播放时长
        return this.toRelativeTimestamp(this.frames[this.currentFrame].timestamp);

    }
    play = () => {

        // 如果当前状态为暂停并且有可播放帧，则处理
        if (!this.isPlaying()) {
            if(this.currentFrame + 1 >= this.frames.length) {
                this.currentFrame = -1;
            }

            // 播放回调
            if (this.onPlay)
                this.onPlay();

            // 开始播放
            this.playing = true;
            this.continuePlayback();

        }

    }
    seek = async (position: number, callback: Function) => {
        // position为查询帧的时间戳

        // 没有可播放帧则返回
        if (this.frames.length === 0)
            return;

        // 如果当前有正在进行的查询，则取消掉
        this.cancel();

        // 保存当前播放状态后暂停播放
        let originallyPlaying: boolean | null = this.isPlaying();
        this.pause();

        // 查询完毕回调
        this.seekCallback = () => {

            // 回调已执行，清空
            this.seekCallback = null;

            // 恢复播放状态
            if (originallyPlaying) {
                this.play();
                originallyPlaying = null;
            }

            // 通知完成
            if (callback)
                callback();

        };

        // 查询帧
        const result = await this.seekToFrame(this.findFrame(0, this.lastFrameIndex, position));

        if(result) {
            this.seekCallback()
        }

    }
    cancel = () => {
        if (this.seekCallback) {
            this.abortSeek();
            this.seekCallback();
        }
    }
    pause = () => {

        // 取消当前任务
        this.abortSeek();

        // 如果状态为播放则设置播放状态为停止
        if (this.isPlaying()) {
            this.playing = false;
            // 暂停回调
            if (this.onPause)
                this.onPause();


        }

    }
}