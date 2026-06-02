"use server";

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: NextRequest) {
    const { summary, modifier, context } = await req.json();

    if (!summary || summary.length < 50) {
        return NextResponse.json(
            { error: "Summary content too short for comic visualization." },
            { status: 400 }
        );
    }

    const panelNumber = context ? context.length + 1 : 1;
    const contextText = context && context.length > 0
        ? `\n\nPrevious panels already created:\n${context.map((c: string, i: number) => `Panel ${i + 1}: ${c}`).join('\n')}\n\nNow create Panel ${panelNumber} only. It must be different from previous panels.`
        : `\n\nCreate Panel 1 only.`;

    try {
        const completion = await openai.chat.completions.create({
            model: "o4-mini",
            reasoning_effort: "medium",
            messages: [
                {
                    role: "system",
                    content:
                        `You are a visual storytelling assistant skilled at turning article summaries into visual panel descriptions for a ${modifier}-style comic strip. ` +
                        `Given a narrative summary, create ONE panel description. ` +
                        `The panel must: Reflect a key moment or concept from the summary. ` +
                        `Include a short visual description. ` +
                        `Include a caption that summarizes the message. ` +
                        `Use a ${modifier} style with consistent character design. ` +
                        `Return the output in this exact format:\n` +
                        `Panel N: [Visual description] (Caption: "...")\n` +
                        `Do not add commentary. Only produce one panel.`,
                },
                {
                    role: "user",
                    content: summary + contextText,
                },
            ],
            store: false,
        });

        const script = completion.choices[0]?.message?.content?.trim() || "No comic script generated.";
        console.log("AI SCRIPT OUTPUT:\n", script);
        return NextResponse.json({ script });
    } catch (err: unknown) {
        if (err instanceof Error) {
            console.error("Error:", err.message);
            return NextResponse.json({ error: err.message }, { status: 500 });
        }
        return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
    }
}