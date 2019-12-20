/**
 * 通用hook
 * 用于返回更新前的对象prevProps
*/

import { useRef, useEffect } from "react";

export default function usePrevious(value: any) {
	const ref = useRef<any>();
	useEffect(() => {
		ref.current = value;
	});
	return ref.current;
}