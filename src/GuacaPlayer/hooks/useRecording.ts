/**
 * 播放对象初始化调用
*/

import { useEffect, useMemo, useState } from "react";
import SessionRecording from '../sessionRecording';
import FileCache, {Partial} from '../utils/fileCache';
import useServiceWorker from './useServiceWorker';
import {debounce, cancelablePromise} from "../utils"

export type recordingState = "uninit" | "initing" | "inited" | "error";

export default function useRecording(src?: string) {
    const [recordingState, setRecordingState] = useState<recordingState>("uninit")

    //注册service worker
    const serviceWorkerState = false;

    const [recording, setRecording] = useState<SessionRecording | null>(null);

    useEffect(()=>{
        //service worker已经初始化完成才开始启动文件加载
        if(src && serviceWorkerState !== null){
            let fileCacheInit: any, fileCache: FileCache;

            //开始初始化
            setRecordingState("initing")
            //开始获取文件
            fileCache = new FileCache()
            fileCacheInit = cancelablePromise<Partial | null>(fileCache.init(src));
            fileCacheInit.then((head: any)=>{
                    //初始化完成
                    setRecordingState("inited");

                    if(head) {

                        const recording = new SessionRecording(fileCache);
                        setRecording(recording);
                        
                    } else {
                        throw "no head"
                    }
                })
                .catch((e: any)=>{
                    /**
                     * 初始化失败通常是组件更新导致，
                     * 此处不能改变组件状态，因为原组件可能已被销毁
                    */
                    console.log(e)
                })


            return () => {
                console.log("fileCacheInit cancelled")
                fileCacheInit&& fileCacheInit.cancel()
                fileCache && fileCache.cancelCaching();
            }
        } else {
            setRecording(null);
        }

        
    }, [src, serviceWorkerState])

    return {recording, recordingState};
}