/**
 * 播放对象渲染容器
*/

import React, { useState, useEffect, useRef, useCallback } from 'react';
import usePrevious from './hooks/usePrevious';
import { listener } from './utils';

interface Props {
    display?: any;
    onClick?: (evnet: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}

const Display: React.FC<Props> = ({ display, onClick }) => {
    const displayRef = useRef<HTMLDivElement | null>(null);
    const el = displayRef.current;

    const fitDisplay = useCallback(()=>{
        // 调整界面大小
        if (!display || !el) return;

        const displayWidth = display.getWidth();
        const displayHeight = display.getHeight();

        // 视频流必须有高度宽度
        if (!displayWidth || !displayHeight) return;

        // 根据容器大小缩放视频
        display.scale(Math.min(el.offsetWidth / displayWidth,
        el.offsetHeight / displayHeight));

    }, [display])
  
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
    }, [display])


    useEffect(() => {
      
        const resize = listener("resize", fitDisplay);
        return () => {
            resize.cancel();
        }
    });
    return (
        <div className={"guaca-player-display"} ref={displayRef} onClick={onClick}></div>
    )
}


export default Display;