/**
 * 播放对象渲染容器
*/

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import usePrevious from './hooks/usePrevious';
import useMutaionObserver from './hooks/useMutaionObserver';
import {playerState} from "./hooks/useControl";
import { translation } from './hooks/useTranslation';

interface Props {
    display?: any;
    isPlaying: boolean;
    playerState: playerState;
    progress: any;
    translation: translation;
    onClick?: (evnet: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}

const Display: React.FC<Props> = ({ display, isPlaying, onClick, playerState, progress, translation }) => {

    const displayRef = useRef<HTMLDivElement | null>(null);
    const el = displayRef.current;
    
    

    const fitDisplay = useCallback(()=>{
        // 调整界面大小
        if (!display || !el) return;

        const target = el.parentElement as HTMLElement;

        const displayWidth = display.getWidth();
        const displayHeight = display.getHeight();
        
        // 视频流必须有高度宽度
        if (!displayWidth || !displayHeight) return;


        // 根据容器大小缩放视频
        display.scale(Math.min(target.offsetWidth / displayWidth,
            (target.offsetHeight - 40) / displayHeight));

    }, [display, el])

    const mutationCallback = useCallback((mutations: MutationRecord[], observer: MutationObserver)=>{
        console.log(mutations)
        fitDisplay()
    }, [display, el])

    useMutaionObserver(el, mutationCallback)
  
    //上一个display对象
    const prevDisplay = usePrevious(display);

    useEffect(()=>{
        if(!el) {
            return;
        }

        if (!display) {
            el.innerHTML = "";
            return;
        }
       
        
        if(prevDisplay) {
            el.innerHTML = "";
            prevDisplay.onresize = null;

        }

        el.appendChild(display.getElement());
        display.onresize = fitDisplay;
        fitDisplay();
        return ()=>{
            console.log("cancel resize")

            display.onresize = null;
        }
    }, [display])


    return (
        <>
            {
                !isPlaying
                &&
                playerState === "ready"
                &&
                progress.visiable === false
                &&
                <div className={"guaca-pausing"} onClick={onClick}>
                    <i className={"iconfont icon-pause"}/>
                    <div>
                        {
                            translation["message.player.pause"]
                        }
                    </div>
                </div>
            }
            <div className={"guaca-player-display"} ref={displayRef} onClick={onClick}></div>
        </>
    )
}


export default Display;