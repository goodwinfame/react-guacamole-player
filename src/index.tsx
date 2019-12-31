import ReactDom from 'react-dom';
import React, { useState, useEffect } from 'react';
import App from './App';
import './index.less'


const Container: React.FC = () => {
 
    return (
        <App />

    )
}


ReactDom.render(
    <Container />,
    document.getElementById('root')
);