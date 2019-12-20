/**
 * 播放器入口
*/

import React, { useCallback, MouseEvent, useEffect, useRef, useMemo } from 'react';
import './index.less';
import Display from './display';
import Control from './control';
import Progress from './progress';
import useRecording from './hooks/useRecording';
import useControl from './hooks/useControl';
import useServiceWorker from './hooks/useServiceWorker';
import { listener } from './utils';
import { setHeader } from './utils/get';

interface Props {
    src?: string;
    width?: number;
    height?: number;
    headers?: object;
    getPlayer?: (player: Player) => void; // 跳转位置（时长ms）
}

interface Player {
    play: Function;
    pause: Function;
    seek: (e: {mouseDown?: boolean, inputValue: number}) => Promise<unknown>;
    cancelSeek: Function;
    getDuration: () => Promise<number>;
    getCurrentDuration: () => Promise<number>;
}

const GuacaPlayer: React.FC<Props> = ({src, headers, width, height, getPlayer}) => {

    useEffect(() => {
        headers && setHeader(headers);
    }, [headers])

    const {recording} = useRecording(src);

    const {
        progress, 
        playbackPosition, 
        duration, 
        currentDuration, 
        isPlaying, 
        seek,
        cancelSeek,
    } = useControl(recording)


    const player = useMemo(()=> {
        if(!recording) {
            return null;
        }
        return {
            play: recording.play,
            pause: recording.pause,
            seek,
            cancelSeek,
            getDuration: recording.getDuration,
            getCurrentDuration: recording.getCurrentDuration
        };
    }, [recording])

    useEffect(()=>{
        if(player && getPlayer) {
            getPlayer(player)
        }
    }, [player])

    
    const togglePlayback = useCallback((e: MouseEvent)=>{
        e.stopPropagation();
        if (recording) {
            if (recording.isPlaying())
                recording.pause();
            else
                recording.play();
        }
    }, [recording])

  
    const onPlayRangeChange = useCallback((e: {mouseDown: boolean; inputValue: number | null}) => {
        seek(e);
    }, [seek])



    let pause, play, display;

    if(recording) {
        pause = recording.pause;
        play = recording.play;
        display = recording.getDisplay();
    }

    
    return (
        <div className={"guaca-player"} style={{width, height}}>
            <Progress progress={progress} onCancel={cancelSeek}/>
            <Display display={display} onClick={togglePlayback}/>
            <Control 
                currentDuration={currentDuration}
                duration={duration}
                playbackPosition={playbackPosition}
                isPlaying={isPlaying}
                pause={pause}
                play={play}
                onChange={onPlayRangeChange}
            />
        </div>
    )
}


export default GuacaPlayer;