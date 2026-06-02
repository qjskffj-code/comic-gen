import OpenAI from 'openai';

export const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
});

export async function generateStripImageFromScript(
    script: string,
    size: '1024x1024' | '1024x1536' | '1536x1024' = '1024x1024',
    quality: 'low' | 'medium' | 'high' | 'auto' = 'high',
    compression: number = 50,
    output_format: 'jpeg' | 'png' = 'jpeg'
): Promise<string> {
    const prompt = `
Create a clean, semi-realistic editorial cartoon with four distinct panels in a horizontal strip. Each panel visualizes a moment from the summary below, using consistent characters and color schemes.

Style: Consistent line art, semi-realistic but expressive, slightly exaggerated expressions for emphasis. Clean layout. Use labeled signs, props, and character expressions to communicate each caption clearly.

Narrative:
${script}

Instructions:
- Arrange panels left to right.
- Ensure character continuity (e.g. same couple throughout).
- Use clean typography for captions.
- Do not add speech bubbles unless specified.
`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const result = await openai.images.generate({
        prompt,
        model: 'gpt-image-1',
        size,
        quality,
        output_compression: compression,
        output_format,
    });

    clearTimeout(timeout);

    const image_base64 = result.data?.[0]?.b64_json;
    if (!image_base64) {
        throw new Error('Image generation failed: Missing data in response.');
    }

    return image_base64;
}

export async function generateSinglePanelImage(
    visual: string,
    caption: string,
    size: '1024x1024' | '1024x1536' | '1536x1024' = '1024x1024',
    quality: 'low' | 'medium' | 'high' | 'auto' = 'high',
    compression: number = 50,
    output_format: 'jpeg' | 'png' = 'jpeg',
    modifier: string = 'flat vector'
): Promise<string> {
    const styleGuide: Record<string, string> = {
        'editorial': 'clean black and white editorial illustration, bold outlines, minimal shading, bright white background',
        'manga': 'black and white manga style, bold outlines, screen tones, expressive eyes, bright background',
        'cyberpunk': 'vibrant neon colors, futuristic setting, glowing lights, dark background with colorful accents',
        'noir': 'high contrast black and white, dramatic shadows, film noir atmosphere',
        'saturday morning': 'bright cheerful colors, round friendly shapes, white background, fun cartoon style',
        'flat vector': 'flat vector illustration, bright white background, bold black outlines, zero shading, clean geometric shapes, colorful and minimal like a modern infographic',
        'golden age': 'vintage comic style, warm colors, bold outlines, retro feeling',
        'pixel art': 'pixel art style, 8-bit graphics, bright colors, clean pixels',
        'pastel sketch': 'soft pastel colors, light sketch lines, gentle and warm, bright white background',
    };

    const styleInstruction = styleGuide[modifier] || `${modifier} style, bright background, clean illustration`;

    const prompt = `
Draw a single comic panel in this exact style: ${styleInstruction}.

Scene: ${visual}
Caption: "${caption}"

Important: bright background, cheerful tone, simple and clean illustration. No dark or moody atmosphere.
`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const result = await openai.images.generate({
        model: 'gpt-image-1',
        prompt,
        size,
        quality,
        output_compression: compression,
        output_format,
    });

    clearTimeout(timeout);

    const image_base64 = result.data?.[0]?.b64_json;
    if (!image_base64) {
        throw new Error('Single panel generation failed: Missing image data.');
    }

    return image_base64;
}