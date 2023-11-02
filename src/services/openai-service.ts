import OpenAI from "openai";
import { CardRarity } from "../types/card-rarity";

const apiKey = process.env["OPENAI_API_KEY"];

const openai = new OpenAI({
    apiKey: apiKey,
});

const generateCardData = async (prompt: string) => {
    
    console.log("[OpenAI] prompt?", prompt);

    // DALL-E
    const image = await openai.images.generate({
        prompt: prompt as string,
        size: "512x512",
        response_format: "b64_json",
    });

    // CHATGPT
    const info = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
            {
                "role": "system",
                "content": "You are generating card information for a playing card game. You will be provided descriptions of the card's image and you will convert these descriptions into a dramatic title and blurb for the card. The title and description should be formatted as '%t\n%d, where %t is the title and %d is the description. Both should be at most 250 characters long.",
            },
            {
                "role": "user",
                "content": `Generate a title and card description for a playing card with following image: ${prompt}.`,
            }],
    });

    if (!image.data[0]) throw new Error("No image data returned from OpenAI");
    if (!info.choices[0]) throw new Error("No data returned from OpenAI");

    const content = info.choices[0].message.content as string;

    const contentArray = content.split("\n");
    let t = contentArray[0] || '';
    let d = contentArray[1] || '';

    t = t.replaceAll("Title: ", "");
    t = t.replaceAll("\"", "");

    d = d.replaceAll("Description: ", "");
    d = d.replaceAll("\"", "");

    const attackScore = Math.floor(Math.random() * 10);
    const defenseScore = Math.floor(Math.random() * 10);

    // 1% prismatic
    // 9% gold
    // 20% silver
    // 70% bronze
    const rarityRoll = Math.random();
    let rarityScore;
    if (rarityRoll < 0.01) {
        rarityScore = CardRarity.Prismatic;
    } else if (rarityRoll < 0.1) {
        rarityScore = CardRarity.Gold;
    } else if (rarityRoll < 0.3) {
        rarityScore = CardRarity.Silver;
    } else {
        rarityScore = CardRarity.Bronze;
    }

    const card = {
            image: `data:image/png;base64,${image.data[0].b64_json}`,
            title: t,
            desc: d,
            atk: attackScore,
            def: defenseScore,
            rarity: rarityScore,
    }; 

    return card;
};

export { generateCardData };