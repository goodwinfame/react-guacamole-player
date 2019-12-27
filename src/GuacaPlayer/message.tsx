/**
 * 加载进度条
 * 类型有文件加载于播放查找进度
 * 文件加载无取消按钮
 * 
*/


import React, { useState, useEffect, useRef, ChangeEvent } from 'react';

interface Props {
    loading: boolean;
    text?: string;
    visibility: boolean;
}

const Message: React.FC<Props> = ({loading = false, text = "", visibility = false}) => {
    return (
        <div className={`guaca-player-message`} style={{display: visibility?"flex":"none"}}>
            <div className={`guaca-player-message-wrapper`}>
                <div className={"guaca-player-message-icon"}>
                    <i className={`iconfont ${loading?"icon-loading guaca-spin":"icon-warning"}`}/>
                </div>
                <div>{text}</div>
            </div>
        </div>
    )
}


export default Message;