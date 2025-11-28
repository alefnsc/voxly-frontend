import { Link as ScrollLink } from 'react-scroll';
import TypingTextEffect from 'components/typing-text-effect/TypingTextEffect'
import { Target, Clock1, UserCheck, BrainCircuit } from 'lucide-react'

import { Button } from 'components/ui/button'

type BodyCopyProps = {
    isMobile: boolean
}

const BodyCopy = (
    {
        isMobile
    }: BodyCopyProps
) => {

    return (
        <div className="flex flex-col h-full overflow-hidden md:w-[45%] items-start w-full mt-8 md:mt-0">
            <div className="flex flex-row items-center justify-center w-full sm:justify-center sm:items-center  ">

                <h1 className='text-primary text-4xl lg:text-5xl font-bold mb-4 lg:mb-8'>Unlock Your Next <span className='text-gray-700'>Famous</span> Job</h1 >

            </div>

            <div className="flex flex-col space-y-2 xl:ml-8 lg:ml-6 ">
                <div className="flex flex-col my-2 items-start justify-center text-lg lg:text-xl">
                    <h1 className="text-primary text-xl font-bold flex flex-row space-x-4">
                        <Target /><TypingTextEffect text='Master Interview: ' />
                    </h1>
                    <div className="flex flex-row my-2 text-md lg:text-lg ml-2">
                        <TypingTextEffect text="Refine answers with AI-driven mock interview." />
                    </div>
                </div>

                <div className="flex flex-col my-2 items-start justify-center text-lg lg:text-xl">
                    <h1 className="text-primary text-xl font-bold flex flex-row space-x-4">
                        <BrainCircuit /> <TypingTextEffect text='Tailored Recommendations: ' />
                    </h1>
                    <div className="flex flex-row my-2 text-md lg:text-lg ml-2">
                        <TypingTextEffect text="Get tips on to showcase your skills based on job description and seniority." />
                    </div>
                </div>

                <div className="flex flex-col my-2 items-start justify-center text-lg lg:text-xl">
                    <h1 className="text-primary text-xl font-bold flex flex-row space-x-4">
                        <Clock1 /><TypingTextEffect text='Real-Time Feedback:' />
                    </h1>
                    <div className="flex flex-row my-2 text-md lg:text-lg ml-2">
                        <TypingTextEffect text="Receive instant, constructive feedback." />
                    </div>
                </div>

                <div className="flex flex-col my-2 items-start justify-center text-lg lg:text-xl">
                    <h1 className="text-primary text-xl font-bold flex flex-row space-x-4">
                        <UserCheck /><TypingTextEffect text='Comprehensive Results: ' />
                    </h1>
                    <div className="flex flex-row my-2 text-md lg:text-lg ml-2">
                        <TypingTextEffect text="Review a detailed performance, strengths and opportunities." />
                    </div>
                </div>

            </div>
            <div className="flex flex-col items-start justify-center my-8 lg:mt-8">

                <Button className='p-7 lg:p-10 w-full' size={isMobile ? 'icon' : 'default'} >
                    <ScrollLink
                        to="form"
                        smooth={true}
                        duration={500}
                        className="flex items-center gap-x-2 text-3xl font-bold"
                    >
                        Get Started
                    </ScrollLink>
                </Button>
            </div>
        </div>
    )
}

export default BodyCopy
