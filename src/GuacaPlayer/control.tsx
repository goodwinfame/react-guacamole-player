/**
 * 播放进度、按钮
*/
import React, { useState, useEffect, useRef, ChangeEvent, useCallback, MouseEvent, useMemo } from 'react';
import {formatTime, debounce} from './utils/index';
import usePrevious from './hooks/usePrevious';

interface Props {
    currentDuration: number | null;
    duration: number | null;
    playbackPosition: number | null;
    isPlaying: boolean;
    pause?: Function;
    play?: Function;
    onChange(e: {mouseDown: boolean; inputValue: number | null}): void;
}

const Control: React.FC<Props> = ({ currentDuration, duration, playbackPosition, isPlaying, pause, play, onChange }) => {

    const [mouseDown, setMouseDown] = useState(false);
    const [inputValue, setInputValue] = useState(playbackPosition);

    const preMouseDown = usePrevious(mouseDown);

    //防抖
    const deb = useMemo(()=>{
        return debounce(0)
    }, [])

    const handleBtnClick = useCallback((e: MouseEvent) => {
        e.stopPropagation();
        if(isPlaying) {
            pause && pause()
        } else {
            play && play()
        }
    },[isPlaying, play])

    const handleMouseEvent = useCallback((boolean: boolean, e: MouseEvent) => {
        e.stopPropagation();
        setMouseDown(boolean)
    },[])
    

    const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        setInputValue(Number(e.target.value))
    },[])
    

    useEffect(()=>{
        //如果播放位置没有发生变动则不触发事件
        if(inputValue === playbackPosition && preMouseDown === mouseDown) return;
        onChange && deb(onChange.bind(undefined, {
            mouseDown,
            inputValue
        }))

        return () => {
            console.log("cancel deb")
            deb.cancel()
        }
    }, [inputValue, mouseDown, onChange])

    return (
        <div className={"guaca-player-control"}>
            <div className={"guaca-player-control-range-wrapper"}>
                <input 
                    className={"guaca-player-range-input"}
                    type="range" 
                    min={0}
                    max={currentDuration || 0}
                    value={playbackPosition || 0}
                    style={{width: `${(currentDuration || 1) / (duration || 1) * 100}%`}}
                    onChange={handleInputChange}
                    onMouseDown={handleMouseEvent.bind(undefined, true)}
                    onMouseUp={handleMouseEvent.bind(undefined, false)}
                />
            </div>
            
            <div className={"guaca-player-control-btn-wrapper"}>
                <button className={"guaca-player-control-btn"} onClick={handleBtnClick}>
                    <i className={`iconfont ${isPlaying?"icon-pause":"icon-play"}`}/>
                </button>
                <span>
                    { formatTime(playbackPosition || 0) }
                    /
                    { formatTime(duration || 0) }
                </span>
            </div>
        </div>
    )
}


export default Control;