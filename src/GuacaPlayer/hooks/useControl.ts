/**
 * 播放器播放行为控制
*/

import { useEffect, useMemo, useState, useCallback } from "react";
import SessionRecording from '../sessionRecording';
import useProgress from './useProgress';
import {debounce, cancelablePromise} from "../utils"
import {recordingState} from './useRecording';
import usePrevious from './usePrevious';


let currentPlayingState: boolean | null = null;

export type playerState = recordingState | "ready";

export default function useControl(recording: SessionRecording | null, autoPlay: boolean, recordingState: recordingState) {
    // 播放器状态
    const [playerState, setPlayerState] = useState<playerState>(recordingState);

    // 播放进度位置
    const [playbackPosition, setPlaybackPosition] = useState(0);

    // 视频总时长
    const [duration, setDuration] = useState(0);

    // 当前已加载的视频时长
    const [currentDuration, setCurrentDuration] = useState(0);

    // 搜索进度位置
    const [seekPosition, setSeekPosition] = useState<null | number>(null);
    // 播放状态
    const [isPlaying, setPlaying] = useState(false);
    // 加载进度条状态
    const [progress, setProgress] = useProgress();

    //防抖
    const deb = useMemo(()=>{
        return debounce(300)
    }, [])

    const seek = useCallback(async (e: {mouseDown?: boolean; inputValue: number | null}) => {

        // 开始查找防抖
        if(!recording || typeof(e.inputValue) !== "number") {
            return false;
        }
        

        //停止播放并记录播放状态
        if(currentPlayingState === null) {
            currentPlayingState = recording.isPlaying();
            recording.pause();
        }
        
        setPlaybackPosition(e.inputValue!)

        if(e.mouseDown === true) return false;

        deb(()=>{
            setProgress({type: "seek", visiable: true, current: 0, total: 0});

            setSeekPosition(null);
        
            recording.seek(e.inputValue!, () => {
                // 如果已经查找完毕则隐藏加载进度并恢复之前的播放状态
                setProgress({visiable: false});
                if(currentPlayingState === true) {
                    recording.play();
                }
                currentPlayingState = null;
                return true;
            });
        })

    }, [recording])

    const cancelSeek = useCallback(() => {
        recording && recording.cancel();
        setPlaybackPosition(seekPosition || playbackPosition)
    }, [recording, seekPosition, playbackPosition])

    useEffect(()=>{
        let getCurrentDuration: any, getDuration: any;
        if(recording) {
            //重置状态
            setPlaybackPosition(0);
            setDuration(0);
            setCurrentDuration(0);
            setProgress({total: 0, current: 0, type: "load", visiable: false});
            setPlaying(false);
            setSeekPosition(0)
            
            recording.onTrunkLoad = (event) => {
                
                if(event.index === 0) {
                    // 仅仅处理第一个trunk的回调
                    
                    if(event.type === "loading") {
                        setProgress({
                            type: "load",
                            visiable: true,
                            current: 0,
                            total: 0
                        })
                    } else if(event.type === "parsing") {
                        setProgress({
                            current: event.current,
                            visiable: true,
                            total: event.size
                        })
                    }
                }

                if(event.type === "loaded") {
                    if(event.index === 0) {
                        // 设置视频总时长
                        var getDuration = cancelablePromise<number>(recording.getDuration());
                        getDuration.then((duration)=>{
                                setDuration(duration);
                                setProgress({
                                    visiable: false
                                })

                                // 自动播放
                                autoPlay && recording.play()
                                setPlayerState("ready")
                            })
                    }

                    // 设置视频当前已加载的时长
                    var getCurrentDuration = cancelablePromise<number>(recording.getCurrentDuration());
                    getCurrentDuration.then((duration)=>{
                            setCurrentDuration(duration);
                        })
                }
            }

            // 播放回调
            recording.onPlay = () => {
                setPlaying(true)
            };
 
            // 暂停回调
            recording.onPause = () => {
                 setPlaying(false)
            };


            // 文件正在查询中
            recording.onSeek = (position: number, current: number, total: number) => {
                // 如果当前正则播放，则更新播放进度
                if (recording.isPlaying()){
                    setPlaybackPosition(position);

                } else {
                    // 更新查找进度及加载进度
                    setSeekPosition(position);
                    setProgress({current, total});
                    
                }

                

            };


            recording.start();

            return () => {
                console.log("cancel control")
                recording.stop();

                recording.onPlay = undefined;
                recording.onPause = undefined;
                recording.onTrunkLoad = undefined;
                recording.onSeek = undefined;
    
                getDuration && getDuration.cancel();
                getCurrentDuration && getCurrentDuration.cancel();
    
            }

        }

        

    }, [recording, autoPlay])


    return {playbackPosition, seek, seekPosition, cancelSeek, isPlaying, progress, duration, currentDuration, playerState};
}