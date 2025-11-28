// hooks/useInterviewTimer.js
import { useState, useRef, useCallback } from 'react';

export const useInterviewTimer = (initialMinutes, onTimerEnd) => {
    const [minutes, setMinutes] = useState(initialMinutes);
    const [seconds, setSeconds] = useState(0);
    const interval = useRef(null);

    const startTimer = useCallback(() => {
        const countDownDate = new Date().getTime() + initialMinutes * 60 * 1000;

        if (interval.current) clearInterval(interval.current);

        interval.current = setInterval(() => {
            const now = new Date().getTime();
            const distance = countDownDate - now;

            const mins = Math.floor((distance % (60 * 60 * 1000)) / (1000 * 60));
            const secs = Math.floor((distance % (60 * 1000)) / 1000);

            if (distance <= 0) {
                clearInterval(interval.current);
                setMinutes(0);
                setSeconds(0);
                if (onTimerEnd) onTimerEnd();
            } else {
                setMinutes(mins);
                setSeconds(secs);
            }
        }, 1000);

        return () => {
            if (interval.current) clearInterval(interval.current);
        };
    }, [initialMinutes, onTimerEnd]);

    const stopTimer = useCallback(() => {
        if (interval.current) {
            clearInterval(interval.current);
        }
    }, []);

    return {
        minutes,
        seconds,
        startTimer,
        stopTimer
    };
};