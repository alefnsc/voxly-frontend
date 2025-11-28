import React, { Fragment } from "react";

interface ClockProps {
    timerMinutes?: number;
    timerSeconds?: number;
}

const Clock: React.FC<ClockProps> = ({ timerMinutes = 15, timerSeconds = 0 }) => {
    // Format numbers to always show 2 digits
    const formattedMinutes = String(timerMinutes).padStart(2, '0');
    const formattedSeconds = String(timerSeconds).padStart(2, '0');

    return (
        <Fragment>
            <section 
                className="timer-container" 
                data-testid="timer-container"
                role="timer"
                aria-label={`Interview timer: ${timerMinutes} minutes and ${timerSeconds} seconds remaining`}
            >
                <section className="timer" data-testid="timer">
                    <div className="clock" data-testid="clock">
                        <section>
                            <p aria-label="minutes">{formattedMinutes}</p>
                            <small>Minutes</small>
                        </section>
                        <span aria-hidden="true">:</span>
                        <section>
                            <p aria-label="seconds">{formattedSeconds}</p>
                            <small>Seconds</small>
                        </section>
                    </div>
                </section>
            </section>
        </Fragment>
    );
};

export default Clock;