/**
 * 加载进度控制
*/

import { useState } from "react";

type progress = {
	type: "load" | "seek";
	current: number;
	total: number;
	visiable: boolean;
}

type progressParams = {
	type?: "load" | "seek";
	current?: number;
	total?: number;
	visiable?: boolean;
}

type setProgress = (params: progressParams)=>void;

export default function useProgress(value: progress = {type: "load", current: 0, total: 0, visiable: false}): [progress, setProgress] {
	const [type, setType] = useState(value.type);
	const [current, setCurrent] = useState(value.current);
	const [total, setTotal] = useState(value.total);
	const [visiable, setVisiable] = useState(value.visiable);

	const progress = {
		type,
		current,
		total,
		visiable
	}

	function setProgress({type, current, total, visiable}: progressParams) {
		if(type !== undefined) {
			setType(type);
		}
		if(current !== undefined) {
			setCurrent(current);
		}

		if(total !== undefined) {
			setTotal(total)
		}

		if(visiable !== undefined) {
			setVisiable(visiable)
		}
	}

	return [progress, setProgress];
}