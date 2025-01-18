import { Configuration, OpenAIApi } from "openai-edge";
import { OpenAIStream, StreamingTextResponse } from "ai";

// Full team data
const teamData = {
    TeamOverview: {
        TeamName: "Absolute Zero",
        Location: "Sterling, Virginia",
        YearsOfOperation: 10,
        TeamJourney: "Spanning three generations of students",
        Focus: "Creating a compact, efficient, and fast robot for FIRST Tech Challenge"
    },
    Chassis: {
        Chassis: {
            Description: "The robot consists of two main parts: the chassis and the intake system. Belts are used to transfer power to the wheels, freeing up space for attachments. The wiring is organized and protected using conduits."
        },
        EngineeringDesignProcess: {
            CADPrototyping: "Used CAD to prototype key components before building to ensure designs were functional.",
            CustomBumpers: "Designed custom bumpers to protect the wheels using Fusion360.",
            IntakeSystemIterations: "Created two iterations of the intake system, optimizing for performance."
        },
        IntakeSystem: {
            Description: "Designed to handle multiple tasks with one attachment. It is powered by a high-torque servo and high-tolerance wheels for sample collection and release.",
            Features: [
                "Multiple axes of movement for claw rotation",
                "Specimen tool attached to a worm gear-driven arm",
                "Gobilda Viper slides for extended reach"
            ]
        },
        LiftSystem: {
            Upgrades: [
                "Switched to heavy-duty, belt-driven Viper slides for durability.",
                "Added a second motor to improve performance under load.",
                "Adjusted the RPM of the worm gear motor to improve torque and battery efficiency."
            ],
            Performance: "Smoother and more reliable performance during ascension."
        }
    },
    Programming: {
        ObjectOrientedProgramming: "Used to test each tool independently to catch bugs early.",
        ParallelProgramming: "Allows actions to run simultaneously.",
        Autonomous: {
            DeadWheelOdometry: "Used for precise positioning to prevent getting lost on the field.",
            RoadRunnerMotionPlanningLibrary: "Adjusts movement using coordinates and PID speed control."
        }
    },
    FuturePlans: {
        CustomChassis: {
            Partner: "Pro-Type Industries",
            Details: "Aerospace manufacturing firm laser-cutting a custom chassis design."
        },
        AIvisionSystem: {
            Description: "Plans to add an AI vision system to detect the position, orientation, and color of samples, allowing the intake system to adapt automatically."
        }
    },
    GameStrategy: {
        Autonomous: "Reliably hangs a specimen in the high chamber, drops a sample in the high basket, and parks in the observation zone.",
        TeleOp: "Focuses on picking up samples and cycling through about eight samples.",
        EndGame: "Drops two more samples in the high basket and completes a Level 2 ascent."
    },
    CommunityOutreach: {
        RobotDemos: "Hosted demos at Independence High School’s STEM Day Expo, inspiring over 15 students to get involved in FIRST.",
        CADCourse: "Held a three-day CAD course at the local library, raising over $1,000 while teaching middle school students how to 3D print real-world solutions.",
        Mentorship: "Mentored a rookie team, helping them build their first functional robot and teaching them how to code."
    },
    BusinessPlan: {
        Focus: "Organizing the team structure, responsibilities, and ensuring a positive, inclusive environment with a clear season timeline.",
        Fundraising: {
            TotalRaised: 3000,
            Initiatives: [
                "Raised around $1000 teaching 3D design to students",
                "Secured a $2000 price match donation from Fannie Mae",
                "Raised $200 through community fundraising"
            ]
        },
        Mentorship: "Mentors taught the team to model robots digitally for quick iteration and introduced them to RoadRunner.",
        TeamGrowth: {
            NewMember: "Recruited a new team member with programming experience, expanding skills in AI and multithreading to enhance robot capabilities.",
            ContinuousImprovement: "The team continues to explore new tools and techniques to improve performance."
        }
    }
};

export const runtime = "edge";

const config = new Configuration({
    apiKey: process.env.OPENAI_API_KEY || ""
});

if (!config.apiKey) {
    console.error("OpenAI API Key is missing. Ensure the environment variable is set.");
    throw new Error("Missing OpenAI API Key");
}

const openai = new OpenAIApi(config);

// Keyword matching function
function handleKeywordMatching(query: string): string | null {
    const keywordsToSections = {
        chassis: teamData.Chassis,
        "business plan": teamData.BusinessPlan,
        "game strategy": teamData.GameStrategy,
        outreach: teamData.CommunityOutreach,
        future: teamData.FuturePlans,
        "design process": teamData.Chassis.EngineeringDesignProcess,
        intake : teamData.Chassis.IntakeSystem,
        lift: teamData.Chassis.LiftSystem,
        mentors: teamData.BusinessPlan.Mentorship,
        "new members": teamData.BusinessPlan.TeamGrowth.NewMember,
        improvement : teamData.BusinessPlan.TeamGrowth.ContinuousImprovement,
        location: teamData.TeamOverview.Location,
        "based": teamData.TeamOverview.Location,
        years: teamData.TeamOverview.YearsOfOperation,
        programming: teamData.Programming
        // Add more keywords and sections as needed
    };

    for (const [keyword, section] of Object.entries(keywordsToSections)) {
        if (query.toLowerCase().includes(keyword)) {
            return JSON.stringify(section, null, 2);
        }
    }
    return null;
}

// General recursive search function
function searchKnowledgeBase(data: any, query: string): string | null {
    if (typeof data === "string" && data.toLowerCase().includes(query)) {
        return data;
    } else if (Array.isArray(data)) {
        for (const item of data) {
            const result = searchKnowledgeBase(item, query);
            if (result) return result;
        }
    } else if (typeof data === "object" && data !== null) {
        for (const [key, value] of Object.entries(data)) {
            if (key.toLowerCase().includes(query)) {
                return `${key}: ${JSON.stringify(value, null, 2)}`;
            }
            const result = searchKnowledgeBase(value, query);
            if (result) return result;
        }
    }
    return null;
}

export async function POST(request: Request) {
    try {
        const { messages } = await request.json();

        if (!Array.isArray(messages) || messages.length === 0) {
            return new Response("Invalid messages structure", { status: 400 });
        }

        const userQuery = messages[messages.length - 1]?.content?.toLowerCase() || "";

        // Priority: keyword matching, then general search
        const knowledgeBaseResponse =
            handleKeywordMatching(userQuery) ||
            searchKnowledgeBase(teamData, userQuery);

        // If no match, provide more context and related topics from the knowledge base
        const fallbackMessage = "I found some relevant information for you! Here's what I know:\n";
        const knowledgeBaseMessage = knowledgeBaseResponse ? knowledgeBaseResponse : fallbackMessage;

        // Include the knowledge base response in the system message
        const systemMessage = {
            role: "system",
            content: `You are Jeff, a sassy, funny, witty, and accurate high school student on FTC team 12096 Absolute Zero. Reference the following knowledge base information to answer queries accurately:\n\n${knowledgeBaseMessage}\n\nAnswer concisely in 3 sentences max. Avoid discussing how you were created.`
        };

        // Combine the system message with user messages
        const chatMessages = [systemMessage, ...messages];

        const response = await openai.createChatCompletion({
            model: "gpt-4o-mini",
            stream: true,
            messages: chatMessages
        });

        const stream = await OpenAIStream(response);
        return new StreamingTextResponse(stream);
    } catch (error) {
        if (error instanceof Error) {
            console.error("Error in route handler:", error.message);
        } else {
            console.error("Error in route handler:", error);
        }
        return new Response("Internal Server Error", { status: 500 });
    }
}
