/**
 * 加载进度条
 * 类型有文件加载于播放查找进度
 * 文件加载无取消按钮
 * 
*/


import React, { useState, useEffect, useRef, ChangeEvent } from 'react';

interface Props {
    onCancel?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
    progress: {
        type: "load" | "seek";
        current: number;
        total: number;
        visiable: boolean;
    }
    
}

const Progress: React.FC<Props> = ({progress: { type, current, total, visiable }, onCancel}) => {
    const deg = Math.ceil(current / total * 360) || 0;
    
    return (
        <div className={`guaca-player-progress ${visiable && 'guaca-player-progress-visiable'}`}>
            <div className={`guaca-player-progress-wrapper`}>
                <div className={"guaca-player-progress-indicator guaca-player-progress-indicator-back"}/>
                <div className={`guaca-player-progress-indicator-wrapper ${deg > 180?"guaca-clip-auto":""}`}>
                    <div className={"guaca-player-progress-indicator guaca-player-progress-indicator-left"} style={{transform: `rotate(${deg}deg)`}}/>
                    <div className={`guaca-player-progress-indicator guaca-player-progress-indicator-right ${deg > 180?"guaca-clip-right":""}`}/>
                </div>
                <div className={"guaca-player-progress-text"}>
                    {Math.ceil((current / total * 100) || 0)}%
                </div>
            </div>
            <span>LOADING...</span>

            {
                type === "seek"
                &&
                <button onClick={onCancel}>
                    CANCEL
                </button>
            }
            
        </div>
    )
}


export default Progress;