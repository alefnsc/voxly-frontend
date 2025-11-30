import { Link as ScrollLink } from 'react-scroll';
import TypingTextEffect from 'components/typing-text-effect/TypingTextEffect'
import { Target, Clock1, UserCheck, BrainCircuit } from 'lucide-react'
import { useUser } from '@clerk/clerk-react'

import { Button } from 'components/ui/button'

type BodyCopyProps = {
    isMobile: boolean
}

const BodyCopy = ({
    isMobile
}: BodyCopyProps) => {
    const { isSignedIn } = useUser();

    return (
        <div className="
            flex flex-col h-full overflow-hidden
            w-full md:w-[50%] lg:w-[55%]
            items-center md:items-start
            mt-4 md:mt-0
            px-2 sm:px-4 md:px-0
        ">
            {/* Main headline */}
            <div className="flex flex-row items-center justify-center w-full md:justify-start">
                <h1 className='
                    text-primary font-bold
                    text-2xl sm:text-3xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl
                    mb-4 md:mb-6 lg:mb-8 xl:mb-10
                    text-center md:text-left
                    leading-tight
                '>
                    Unlock Your Next <span className='text-gray-700'>Voxly</span> Job
                </h1>
            </div>

            {/* Feature list */}
            <div className="
                flex flex-col
                space-y-3 md:space-y-4 lg:space-y-5 xl:space-y-6
                w-full
                md:pl-2 lg:pl-4 xl:pl-6
            ">
                {/* Feature 1: Master Interview */}
                <div className="flex flex-col items-start justify-center">
                    <h2 className="
                        text-primary font-bold flex flex-row items-center
                        gap-2 md:gap-3 lg:gap-4
                        text-lg md:text-xl lg:text-2xl xl:text-2xl
                    ">
                        <Target className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 xl:w-8 xl:h-8 flex-shrink-0" />
                        <TypingTextEffect text='Master Interview: ' />
                    </h2>
                    <p className="
                        text-gray-600
                        text-base md:text-lg lg:text-xl xl:text-xl
                        mt-1 md:mt-2 lg:mt-2
                        ml-7 md:ml-9 lg:ml-11 xl:ml-12
                    ">
                        <TypingTextEffect text="Refine answers with AI-driven mock interview." />
                    </p>
                </div>

                {/* Feature 2: Tailored Recommendations */}
                <div className="flex flex-col items-start justify-center">
                    <h2 className="
                        text-primary font-bold flex flex-row items-center
                        gap-2 md:gap-3 lg:gap-4
                        text-lg md:text-xl lg:text-2xl xl:text-2xl
                    ">
                        <BrainCircuit className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 xl:w-8 xl:h-8 flex-shrink-0" />
                        <TypingTextEffect text='Tailored Recommendations: ' />
                    </h2>
                    <p className="
                        text-gray-600
                        text-base md:text-lg lg:text-xl xl:text-xl
                        mt-1 md:mt-2 lg:mt-2
                        ml-7 md:ml-9 lg:ml-11 xl:ml-12
                    ">
                        <TypingTextEffect text="Get tips to showcase your skills based on job description and seniority." />
                    </p>
                </div>

                {/* Feature 3: Real-Time Feedback */}
                <div className="flex flex-col items-start justify-center">
                    <h2 className="
                        text-primary font-bold flex flex-row items-center
                        gap-2 md:gap-3 lg:gap-4
                        text-lg md:text-xl lg:text-2xl xl:text-2xl
                    ">
                        <Clock1 className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 xl:w-8 xl:h-8 flex-shrink-0" />
                        <TypingTextEffect text='Real-Time Feedback:' />
                    </h2>
                    <p className="
                        text-gray-600
                        text-base md:text-lg lg:text-xl xl:text-xl
                        mt-1 md:mt-2 lg:mt-2
                        ml-7 md:ml-9 lg:ml-11 xl:ml-12
                    ">
                        <TypingTextEffect text="Receive instant, constructive feedback." />
                    </p>
                </div>

                {/* Feature 4: Comprehensive Results */}
                <div className="flex flex-col items-start justify-center">
                    <h2 className="
                        text-primary font-bold flex flex-row items-center
                        gap-2 md:gap-3 lg:gap-4
                        text-lg md:text-xl lg:text-2xl xl:text-2xl
                    ">
                        <UserCheck className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 xl:w-8 xl:h-8 flex-shrink-0" />
                        <TypingTextEffect text='Comprehensive Results: ' />
                    </h2>
                    <p className="
                        text-gray-600
                        text-base md:text-lg lg:text-xl xl:text-xl
                        mt-1 md:mt-2 lg:mt-2
                        ml-7 md:ml-9 lg:ml-11 xl:ml-12
                    ">
                        <TypingTextEffect text="Review detailed performance, strengths and opportunities." />
                    </p>
                </div>
            </div>

            {/* CTA Button */}
            <div className="
                flex flex-col items-center md:items-start justify-center
                w-full
                mt-6 md:mt-8 lg:mt-10 xl:mt-12
            ">
                <Button 
                    className='
                        py-6 px-8 md:py-7 md:px-10 lg:py-8 lg:px-12 xl:py-9 xl:px-14
                        w-full md:w-auto
                        shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30
                        transition-all duration-300
                        transform hover:scale-105
                    ' 
                    size={isMobile ? 'lg' : 'default'}
                >
                    <ScrollLink
                        to="form"
                        smooth={true}
                        duration={500}
                        className="
                            flex items-center gap-x-2
                            text-xl md:text-2xl lg:text-3xl xl:text-3xl
                            font-bold cursor-pointer
                        "
                    >
                        Get Started
                    </ScrollLink>
                </Button>
            </div>
        </div>
    )
}

export default BodyCopy
