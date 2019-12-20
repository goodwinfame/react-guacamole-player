/**
 * 播放对象初始化调用
*/

import { useEffect, useMemo, useState } from "react";
import SessionRecording from '../sessionRecording';
import FileCache from '../utils/fileCache';
import useServiceWorker from './useServiceWorker';


export default function useRecording(src?: string) {

    //注册service worker
    const serviceWorkerState = false;

    
    //初始化资源缓存器
    const fileCache  = useMemo(()=>{
        return new FileCache()
    }, []);

    const [recording, setRecording] = useState<SessionRecording | null>(null);

    useEffect(()=>{
        //service worker已经初始化完成才开始启动文件加载
        if(src && serviceWorkerState !== null){
            //开始获取文件
            fileCache.init(src)
                .then(head=>{
                    if(head) {
                        const recording = new SessionRecording(fileCache);
                        setRecording(recording);
                        
                    } else {
                        throw "no head"
                    }
                })
                .catch(e=>{
                    console.log(e);
                })
        } else {
            setRecording(null);
        }

        return () => {
            fileCache.cancelCaching();
        }
    }, [src, serviceWorkerState])

    useEffect(()=>{

        return ()=>{
            if(recording) {
                recording.pause();
                recording.abort();
            }
        }
    }, [recording])

    return {recording, fileCache};
}