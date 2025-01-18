"use client";
import { useChat, Message } from "ai/react";
import { useEffect, useState } from "react";

export default function ChatComponent() {
    const { input, handleInputChange, handleSubmit, isLoading, messages } = useChat();
    const [isNewAssistantMessage, setIsNewAssistantMessage] = useState(false);

    // TTS Function: Converts the assistant's response to speech
    const speakText = (text: string) => {
        console.log("TTS Triggered: Speaking the following text:", text);

        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // Cancel any ongoing speech

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.25; // Adjust speed
            utterance.pitch = 1; // Adjust pitch
            utterance.lang = 'en-US'; // Adjust language if needed

            window.speechSynthesis.speak(utterance);

            console.log("TTS is speaking the text.");
        } else {
            console.error('Text-to-Speech is not supported in this browser.');
        }
    };

    // Handle new assistant messages and trigger TTS once
    useEffect(() => {
        const lastMessage = messages[messages.length - 1];

        if (lastMessage && lastMessage.role === "assistant" && isNewAssistantMessage) {
            console.log("New assistant message detected:", lastMessage.content);
            speakText(lastMessage.content); // Speak the assistant's response
            setIsNewAssistantMessage(false); // Reset the flag
        }
    }, [messages, isNewAssistantMessage]);

    // Trigger TTS only after the assistant's response is fully received
    const handleNewMessages = () => {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.role === "assistant") {
            console.log("Assistant message received, setting flag to trigger TTS:", lastMessage.content);
            setIsNewAssistantMessage(true); // Set flag
        }
    };

    // Monitor new messages
    useEffect(() => {
        console.log("Messages updated:", messages);
        handleNewMessages();
    }, [messages]);

    return (
        <div>
            {messages.map((message: Message) => {
                return (
                    <div key={message.id}>
                        {/* Name of the person talking */}
                        {
                            message.role === "assistant"
                                ? <h3 className="text-lg font-semibold mt-2">GPT-4</h3>
                                : <h3 className="text-lg font-semibold mt-2">User</h3>
                        }

                        {/* Formatting the message */}
                        {message.content.split("\n").map((currentTextBlock: string, index: number) => {
                            if (currentTextBlock === "") {
                                return <p key={message.id + index}>&nbsp;</p>; // Empty line
                            } else {
                                return <p key={message.id + index}>{currentTextBlock}</p>; // Display text
                            }
                        })}
                    </div>
                );
            })}

            <form className="mt-12" onSubmit={handleSubmit}>
                <p>User Message</p>
                <textarea
                    className="mt-2 w-full bg-slate-600 p-2"
                    placeholder={"Ask me questions about team 12096 Absolute Zero!"}
                    value={input}
                    onChange={handleInputChange}
                />
                <button
                    type="submit"
                    className="rounded-md bg-blue-600 p-2 mt-2"
                    disabled={isLoading}
                >
                    {isLoading ? "Loading..." : "Send message"}
                </button>
            </form>
        </div>
    );
}
